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
         // Collect the data in the following denormalized form:
         // Sample_Reference_Id Composite_Element_Ref Protein Protein_Expression
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
                    data.push([sampleRef, compositeElementRef, protein, expressionLevels[protein]]);
                });
            });
            return data;
        },
        groupByProteins: function (data) {
            var proteins;
            proteins = {};
            data.forEach(function (observation) {
                var protein, expression;
                protein = observation[2];
                expression = observation[3];
                if (proteins.hasOwnProperty(protein) === false) {
                    proteins[protein] = {
                        levels: []
                    };
                }
                proteins[protein].levels.push(expression);
            });
            return proteins;
        },
        calculateCorrelationCoefficients: function (proteins, method) {
            var proteinLabels, standardizedProteins, correlations, i, j, correlation;
         // Extract labels for fast lookup.
            proteinLabels = Object.keys(proteins);
            if (method === "pearson") {
             // Standardize expression values.
                standardizedProteins = {};
                proteinLabels.map(function (protein) {
                    standardizedProteins[protein] = $window.spearson.standardize(proteins[protein].levels);
                });
            } else if (method === "spearman") {
             // Rank expression values.
                standardizedProteins = {};
                proteinLabels.map(function (protein) {
                    standardizedProteins[protein] = $window.spearson.rank(proteins[protein].levels);
                });
            }
         // Calculate the correlation coefficients of all protein expression levels.
            correlations = {};
            for (i = 0; i < proteinLabels.length; i++) {
                correlations[proteinLabels[i]] = {};
                for (j = 0; j <= i; j++) {
                    if (i === j) {
                        correlations[proteinLabels[i]][proteinLabels[j]] = 1;
                    } else {
                        correlation = $window.spearson.correlation[method](standardizedProteins[proteinLabels[i]], standardizedProteins[proteinLabels[j]], false);
                        correlations[proteinLabels[i]][proteinLabels[j]] = correlation;
                        correlations[proteinLabels[j]][proteinLabels[i]] = correlation;
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
        id: "sample",
        name: "Samples",
        template: "template/tab/samples.html"
    }, {
        id: "proteins",
        name: "Proteins",
        template: "template/tab/proteins.html"
    }, {
        id: "stats",
        name: "Stats",
        template: "template/tab/stats.html"
    }, {
        id: "correlation",
        name: "Correlation",
        template: "template/tab/correlation.html"
    }, {
        id: "clustering",
        name: "Clustering",
        template: "template/tab/clustering.html"
    }, {
        id: "export",
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
        filteredFiles = $scope.files.filter(function (file) {
            return file.selected;
        });
        $scope.data = rppa.normalizeFiles(filteredFiles);
    }, true);
    $scope.$watch("data", function () {
        var proteins;
        proteins = rppa.groupByProteins($scope.data);
        Object.keys(proteins).map(function (name) {
         // Pre-select all proteins.
            proteins[name].selected = true;
        });
        $scope.proteins = proteins;
    });
});

RPPA.controller("tabSamples", function ($scope) {
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
    $scope.$watch("proteins", function () {
        var slides, proteinLabels, medians, means, standardDeviations;
        slides = store.get("rppa-slide-links");
        proteinLabels = Object.keys($scope.proteins).filter(function (protein) {
            return $scope.proteins[protein].selected;
        });
        $scope.observations = proteinLabels.map(function (protein) {
            return {
                protein: protein,
                median: $window.spearson.median($scope.proteins[protein].levels),
                mean: $window.spearson.mean($scope.proteins[protein].levels),
                standardDeviation: $window.spearson.standardDeviation($scope.proteins[protein].levels),
                slide: slides.filter(function (slide) {
                    return slide.indexOf(protein) !== -1;
                })[0]
            };
        });
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
        var proteins;
        proteins = {};
        Object.keys($scope.proteins).filter(function (protein) {
            return $scope.proteins[protein].selected;
        }).map(function (protein) {
            proteins[protein] = $scope.proteins[protein];
        });
        $scope.correlationCoefficients = rppa.calculateCorrelationCoefficients(proteins, $scope.method.method);
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
        var proteins, correlationCoefficients, pairwiseDistances;
        proteins = {};
        Object.keys($scope.proteins).filter(function (protein) {
            return $scope.proteins[protein].selected;
        }).map(function (protein) {
            proteins[protein] = $scope.proteins[protein];
        });
        correlationCoefficients = rppa.calculateCorrelationCoefficients(proteins, "pearson");
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
            return observation.join("\t");
        }).join("\n");
    };
});
