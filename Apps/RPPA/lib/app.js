"use strict";

var RPPA;

RPPA = angular.module("rppa", ["viz"]);

RPPA.factory("store", function ($window) {
    return {
        get: function (key) {
            return JSON.parse($window.localStorage.getItem(key));
        },
        set: function (key, value) {
            $window.localStorage.setItem(key, JSON.stringify(value));
        },
        remove: function (key) {
            $window.localStorage.removeItem(key);
        },
        contains: function (key) {
            return $window.localStorage.getItem(key) !== null ? true : false;
        }
    };
});

RPPA.factory("allegro", function ($window) {
    var endpoint;
    endpoint = "http://agalpha.mathbiol.org/repositories/tcga?query=";
    return {
        query: function (query, callback) {
         // I'd love to use $http here, but it adds some XSRF headers that
         // don't go well with the CORS-implementation of AllegroGraph.
            $window.jQuery.ajax(endpoint + encodeURIComponent(query), {
                headers: {
                    "Accept": "application/sparql-results+json"
                },
            }).done(function (data) {
                callback(null, data);
            }).fail(function (xhr) {
                callback(xhr.status, null);
            });
        }
    };
});

RPPA.factory("rppa", function ($window, allegro) {
    return {
        getFileLinks: function (callback) {
            var query;
            query = ["prefix tcga:<http://purl.org/tcga/core#>",
                     "select ?url",
                     "where {",
                     "    ?file tcga:platform ?platform .",
                     "    ?platform rdfs:label \"mda_rppa_core\" .",
                     "    ?file tcga:disease-study ?diseaseStudy .",
                     "    ?diseaseStudy rdfs:label \"gbm\" .",
                     "    ?file rdfs:label ?name .",
                     "    ?file tcga:url ?url .",
                     "    filter contains(?name, \"Level_3\")",
                     "    minus {",
                     "        ?file rdfs:label ?name .",
                     "        filter contains(?name, \"Control\")",
                     "    }",
                     "}"].join("\n");
            allegro.query(query, function (err, data) {
                var links;
                if (err !== null) {
                    callback(err, null);
                } else {
                    links = [];
                    data.results.bindings.forEach(function (link) {
                        links.push(link.url.value);
                    });
                    callback(null, links);
                }
            });
        },
        getSlideLinks: function (callback) {
            var query;
            query = ["prefix tcga:<http://purl.org/tcga/core#>",
                     "select ?url",
                     "where {",
                     "    ?file tcga:platform ?platform .",
                     "    ?platform rdfs:label \"mda_rppa_core\" .",
                     "    ?file tcga:disease-study ?diseaseStudy .",
                     "    ?diseaseStudy rdfs:label \"gbm\" .",
                     "    ?file rdfs:label ?name .",
                     "    ?file tcga:url ?url .",
                     "    filter strEnds(?name, \".tif\")",
                     "}"].join("\n");
            allegro.query(query, function (err, data) {
                var links;
                if (err !== null) {
                    callback(err, null);
                } else {
                    links = [];
                    data.results.bindings.forEach(function (link) {
                        links.push(link.url.value);
                    });
                    callback(null, links);
                }
            });
        },
        normalizeFiles: function (files) {
            var data;
            data = [];
            files.forEach(function (file) {
                var expressionLevels, sampleRef, compositeElementRef;
                expressionLevels = {};
             // Parse file.
                file.body.split("\n").forEach(function (line, i) {
                    var tuple, expression;
                 // Ignore empty lines.
                    if (line !== "") {
                        tuple = line.split("\t");
                        if (tuple[0] === "Sample REF") {
                         // Extract Sample REF.
                            sampleRef = tuple[1];
                        } else if (tuple[0] === "Composite Element REF") {
                         // Extract Composite Element REF.
                            compositeElementRef = tuple[1];
                        } else {
                         // Extract proteins and their expression levels.
                            expression = Number(tuple[1]);
                            expressionLevels[tuple[0]] = expression;
                        }
                    }
                });
             // I have never seen a case where Sample REF and Composite Element REF were not at the top,
             // but parsing the whole document before writing them into the table is more robust and might
             // prevent potential errors. Unless of course, those values are missing.
                Object.keys(expressionLevels).map(function (protein) {
                    data.push({
                        sampleRef: sampleRef,
                        compositeElementRef: compositeElementRef,
                        protein: protein,
                        expressionLevel: expressionLevels[protein]
                    });
                });
            });
            return data;
        },
        groupByProteins: function (data) {
            var groups;
            groups = {};
            data.map(function (observation) {
                if (groups.hasOwnProperty(observation.protein) === false) {
                    groups[observation.protein] = [];
                }
                groups[observation.protein].push(observation.expressionLevel);
            });
            return Object.keys(groups).map(function (protein) {
                return {
                    protein: protein,
                    expressionLevels: groups[protein]
                };
            });
        },
        calculateCorrelationCoefficients: function (proteins, method) {
            var standardizedProteins, labels, correlations, i, j, correlation;
            standardizedProteins = {};
            if (method === "pearson") {
             // Standardize expression values.
                proteins.map(function (protein) {
                    standardizedProteins[protein.protein] = $window.spearson.standardize(protein.expressionLevels);
                });
            } else if (method === "spearman") {
             // Rank expression values.
                proteins.map(function (protein) {
                    standardizedProteins[protein.protein] = $window.spearson.rank(protein.expressionLevels);
                });
            }
         // Extract labels for fast lookup.
            labels = Object.keys(standardizedProteins);
         // Calculate the correlation coefficients of all protein expression levels.
            correlations = {};
            for (i = 0; i < labels.length; i++) {
                correlations[labels[i]] = {};
                for (j = 0; j <= i; j++) {
                    if (i === j) {
                        correlations[labels[i]][labels[j]] = 1;
                    } else {
                        correlation = $window.spearson.correlation[method](standardizedProteins[labels[i]], standardizedProteins[labels[j]], false);
                        correlations[labels[i]][labels[j]] = correlation;
                        correlations[labels[j]][labels[i]] = correlation;
                    }
                }
            }
            return correlations;
        }
    };
});

RPPA.controller("init", function ($scope, store) {
 // I decided not to use the router because I need to fetch some data first.
    if (store.contains("rppa-files")) {
        $scope.template = "template/tabs.html";
    } else if (store.contains("rppa-file-links")) {
        $scope.template = "template/intent.html";
    } else {
        $scope.template = "template/finder.html";
    }
    $scope.$on("updateTemplate", function (event, template) {
        $scope.template = template;
    });
});

RPPA.controller("finder", function ($scope, $window, store, rppa) {
    $window.async.parallel([function (callback) {
        rppa.getFileLinks(function (err, links) {
            if (err !== null) {
                callback(err, null);
            } else {
                callback(null, links);
            }
        });
    }, function (callback) {
        rppa.getSlideLinks(function (err, links) {
            if (err !== null) {
                callback(err, null);
            } else {
                callback(null, links);
            }
        });
    }], function (err, data) {
     // Store link lists.
        store.set("rppa-file-links", data[0]);
        store.set("rppa-slide-links", data[1]);
     // Change template.
        $scope.$emit("updateTemplate", "template/intent.html");
        $scope.$apply();
    });
});

RPPA.controller("intent", function ($scope, store) {
    $scope.download = function () {
        var links, intent;
     // Retrieve link list.
        links = store.get("rppa-file-links");
     // Convert links to text/uri-list.
        links = links.join("\n");
     // Create Intent.
        intent = new WebKitIntent({
            "action": "http://mathbiol.org/intents/tcga/download",
            "type": "text/uri-list",
            "data": links
        });
     // Start Intent.
        window.navigator.webkitStartActivity(intent, function (files) {
         // Extract sample ID.
            files = files.map(function (file) {
                file.sample = file.uri.match(/Level_3\.([-_a-zA-Z0-9]+)\.txt$/)[1];
                return file;
            });
         // Remove links from store.
            store.remove("rppa-file-links");
         // Store files in store.
            store.set("rppa-files", files);
         // Change template.
            $scope.$emit("updateTemplate", "template/tabs.html");
            $scope.$apply();
        }, function (err) {
            alert("The Intent was unsuccessful: " + err);
        });
    };
});

RPPA.controller("tab", function ($scope, store, rppa) {
    $scope.tabs = [{
        name: "Samples",
        template: "template/tab/samples.html"
    }, {
        name: "Proteins",
        template: "template/tab/proteins.html"
    }, {
        name: "Stats",
        template: "template/tab/stats.html"
    }, {
        name: "Correlation",
        template: "template/tab/correlation.html"
    }, {
        name: "Clustering",
        template: "template/tab/clustering.html"
    }, {
        name: "Export",
        template: "template/tab/export.html"
    }];
    $scope.currentTab = $scope.tabs[0];
    $scope.changeTab = function (tab) {
        $scope.currentTab = tab;
    };
    $scope.files = store.get("rppa-files").map(function (file) {
     // Pre-select all files.
        file.selected = true;
        return file;
    });
    $scope.$watch("files", function () {
        var filteredFiles;
     // Filter files.
        filteredFiles = $scope.files.filter(function (file) {
            return file.selected;
        });
        $scope.data = rppa.normalizeFiles(filteredFiles);
    }, true);
    $scope.$watch("data", function () {
        $scope.proteins = rppa.groupByProteins($scope.data).map(function (protein) {
         // Pre-select all proteins.
            protein.selected = true;
            return protein;
        });
    });
});

RPPA.controller("tabSamples", function ($scope, store) {
    $scope.selectAll = function () {
        $scope.files = $scope.files.map(function (file) {
            file.selected = true;
            return file;
        });
    };
    $scope.selectNone = function () {
        $scope.files = $scope.files.map(function (file) {
            file.selected = false;
            return file;
        });
    };
    $scope.redownloadSamples = function () {
        store.remove("rppa-files");
        store.remove("rppa-slide-links");
        $scope.$emit("updateTemplate", "template/finder.html");
    };
    $scope.toggle = function (file) {
        file.expanded = !file.expanded;
    };
});

RPPA.controller("tabProteins", function ($scope) {
    $scope.selectAll = function () {
        Object.keys($scope.proteins).map(function (name) {
            $scope.proteins[name].selected = true;
        });
    };
    $scope.selectNone = function () {
        Object.keys($scope.proteins).map(function (name) {
            $scope.proteins[name].selected = false;
        });
    };
});

RPPA.controller("tabStats", function ($scope, $window, store) {
    var slides, filteredProteins, medians, means, standardDeviations;
    slides = store.get("rppa-slide-links");
 // Filter proteins.
    filteredProteins = $scope.proteins.filter(function (protein) {
        return protein.selected;
    });
    $scope.observations = filteredProteins.map(function (protein) {
        return {
            protein: protein.protein,
            median: $window.spearson.median(protein.expressionLevels),
            mean: $window.spearson.mean(protein.expressionLevels),
            standardDeviation: $window.spearson.standardDeviation(protein.expressionLevels),
            slide: slides.filter(function (slide) {
             // Silly protein names.
                return slide.indexOf(protein.protein) !== -1;
            })[0]
        };
    });
});

RPPA.controller("tabCorrelation", function ($scope, rppa) {
    $scope.methods = [{
        name: "Pearson",
        method: "pearson"
    }, {
        name: "Spearman",
        method: "spearman"
    }];
    $scope.method = $scope.methods[0];
    $scope.$watch("method", function () {
        var filteredProteins;
     // Filter proteins.
        filteredProteins = $scope.proteins.filter(function (protein) {
            return protein.selected;
        });
        $scope.correlationCoefficients = rppa.calculateCorrelationCoefficients(filteredProteins, $scope.method.method);
    });
});

RPPA.controller("tabClustering", function ($scope, rppa) {
    $scope.linkageCriteria = [{
        name: "Single",
        linkageCriterion: "single"
    }, {
        name: "Complete",
        linkageCriterion: "complete"
    }, {
        name: "UPGMA",
        linkageCriterion: "upgma"
    }];
    $scope.linkageCriterion = $scope.linkageCriteria[2];
    $scope.$watch("linkageCriterion", function () {
        var filteredProteins, correlationCoefficients, pairwiseDistances;
     // Filter proteins.
        filteredProteins = $scope.proteins.filter(function (protein) {
            return protein.selected;
        });
        correlationCoefficients = rppa.calculateCorrelationCoefficients(filteredProteins, "pearson");
     // Calculate the pairwise distances.
        pairwiseDistances = Object.keys(correlationCoefficients).map(function (proteinA) {
            return Object.keys(correlationCoefficients[proteinA]).map(function (proteinB) {
             // The direction of the correlation coefficient is of no value,
             // it is only the magnitude that matters.
                return 1 - Math.abs(correlationCoefficients[proteinA][proteinB]);
            });
        });
     // Extract labels.
        $scope.labels = Object.keys(correlationCoefficients);
     // Run the clustering.
        $scope.clusters = spearson.hierarchicalClustering(pairwiseDistances, $scope.linkageCriterion.linkageCriterion);
    });
});

RPPA.controller("tabExport", function ($scope) {
    $scope.stringify = function () {
        return $scope.data.map(function (observation) {
            return observation.sampleRef + "\t" + observation.compositeElementRef + "\t" + observation.protein + "\t" + observation.expressionLevel;
        }).join("\n");
    };
});
