(function () {
    "use strict";

 // Load dependencies.
    TCGA.loadScript({
        registerModules: false,
        scripts: [
            "https://ajax.googleapis.com/ajax/libs/angularjs/1.0.2/angular.min.js",
            "https://raw.github.com/agrueneberg/Spearson/master/lib/spearson.js",
            "https://raw.github.com/mbostock/d3/master/d3.v2.min.js",
            "https://raw.github.com/agrueneberg/Viz/master/heatmap/heatmap.js",
            "https://raw.github.com/agrueneberg/Viz/master/dendrogram/dendrogram.js"
        ]
    }, function () {

        var app;

        app = angular.module("app", []);

     // A simple store service to bridge between controllers.
        app.factory("store", function ($q) {
            var store;
            store = {};
            return {
                set: function (key, value) {
                    var deferred;
                    deferred = $q.defer();
                    store[key] = value;
                    deferred.resolve();
                    return deferred.promise;
                },
                get: function (key) {
                    var deferred;
                    deferred = $q.defer();
                    deferred.resolve(store[key]);
                    return deferred.promise;
                }
            };
        });

        app.factory("rppa", function ($rootScope, $q) {
            var get;
            get = function (link) {
                var deferred;
                deferred = $q.defer();
                TCGA.get(link, function (err, res) {
                    $rootScope.$apply(function () {
                        if (err !== null) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(res);
                        }
                    });
                });
                return deferred.promise;
            };
            return {
                fetchLinks: function () {
                    var deferred, query;
                    deferred = $q.defer();
                    query = ["prefix tcga:<http://purl.org/tcga/core#>",
                             "select ?url",
                             "where {",
                             "    ?file tcga:platform ?platform .",
                             "    ?platform rdfs:label 'mda_rppa_core' .",
                             "    ?file tcga:disease-study ?diseaseStudy .",
                             "    ?diseaseStudy rdfs:label 'gbm' .",
                             "    ?file rdfs:label ?name .",
                             "    ?file tcga:url ?url .",
                             "    filter contains(?name, 'Level_3')",
                             "    minus {",
                             "        ?file rdfs:label ?name .",
                             "        filter contains(?name, 'Control')",
                             "    }",
                             "}"].join("\n");
                    TCGA.find(query, function (err, sparql) {
                        var links;
                        links = sparql.results.bindings.map(function (link) {
                            return link.url.value;
                        });
                        $rootScope.$apply(function () {
                            deferred.resolve(links);
                        });
                    });
                    return deferred.promise;
                },
                fetchFiles: function (links) {
                    var promises;
                    promises = links.map(function (link) {
                        return get(link);
                    });
                    return $q.all(promises);
                },
                extractSampleId: function (uri) {
                    return uri.match(/Level_3\.([-_a-zA-Z0-9]+)\.txt$/)[1];
                },
             // Converts the data into the following denormalized form:
             // Sample_Reference_Id Composite_Element_Ref Antibody Antibody_Expression
                normalizeFile: function (file, ignoredAntibodies) {
                    var deferred, data, expressionLevels, sampleRef, compositeElementRef;
                    deferred = $q.defer();
                    data = [];
                    ignoredAntibodies = ignoredAntibodies || [];
                 // Parse file.
                    expressionLevels = {};
                    file.split("\n").forEach(function (line, i) {
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
                             // Ignore given antibodies.
                                if (ignoredAntibodies.indexOf(tuple[0]) === -1) {
                                 // Extract antibodies and their expression levels.
                                    expression = Number(tuple[1]);
                                    expressionLevels[tuple[0]] = expression;
                                }
                            }
                        }
                    });
                 // I have never seen a case where Sample REF and Composite Element REF were not at the top,
                 // but parsing the whole document before writing them into the table is more robust and might
                 // prevent potential errors. Unless of course, those values are missing.
                    Object.keys(expressionLevels).map(function (antibody) {
                        data.push([sampleRef, compositeElementRef, antibody, expressionLevels[antibody]]);
                    });
                    deferred.resolve(data);
                    return deferred.promise;
                }
            };
        });

        app.controller("template", function ($scope, $templateCache) {
            $templateCache.put("download-data.html", '<div ng-controller="download"><progress-bar message="message" percentage="percentage" /></div>');
            $templateCache.put("main.html", '<div ng-controller="main"><h2>Samples</h2><ul><li ng-repeat="sample in samples"><input type="checkbox" ng-model="sample.selected" />&nbsp;<a href="{{sample.uri}}" target="_blank">{{sample.id}}</a></li></ul><h2>Antibodies</h2><ul><li ng-repeat="antibody in antibodies"><input type="checkbox" ng-model="antibody.selected" />&nbsp;{{antibody.name}}</li></ul><h2>Summary</h2><table class="table table-striped"><thead><tr><th>Antibody</th><th>Median</th><th>Mean</th><th>Standard deviation</th></tr></thead><tbody><tr ng-repeat="item in summary"><td>{{item.antibody}}</td><td>{{item.median}}</td><td>{{item.mean}}</td><td>{{item.standardDeviation}}</td></tr></tbody></table><h2>Correlation coeffcients of antibody pairs</h2><heatmap data="correlations" /><h2>Clustering of correlation coefficients</h2><dendrogram labels="clusterLabels" data="clusters" /><h2>Export tidied data (for use in R, MATLAB, Google Refine, ...)</h2><p>Format: <code>Sample REF</code> \\t <code>Composite Element REF</code> \\t <code>Protein</code> \\t <code>Protein Expression</code></p><a href="{{blobUri}}" download="rppa.tsv" class="btn">Download tidied data</a><div>');
            $scope.template = "download-data.html";
            $scope.$on("updateTemplate", function (event, template) {
                $scope.template = template;
            });
        });

        app.controller("download", function ($scope, $q, rppa, store) {
            $scope.message = "Querying hub...";
            $scope.percentage = 1;
            rppa.fetchLinks().then(function (links) {
                $scope.message = "Downloading files...";
                rppa.fetchFiles(links).then(function (files) {
                    var promises;
                 // Now that q supports progress notifications, AngularJS will hopefully implement them, too.
                 // https://github.com/kriskowal/q/issues/63
                    $scope.percentage = 100;
                 // Store each file in the store service.
                    promises = files.map(function (file, idx) {
                        var id;
                        id = rppa.extractSampleId(links[idx]);
                        return store.set("file:" + id, file);
                    });
                 // Store links in the store service.
                    promises.push(store.set("links", links));
                 // Parse one file to extract a list of antibodies.
                    promises.push(rppa.normalizeFile(files[0]).then(function (observations) {
                        var antibodies;
                        antibodies = observations.map(function (observation) {
                            return observation[2];
                        });
                     // Store antibodies in store service.
                        return store.set("antibodies", antibodies);
                    }));
                    $q.all(promises).then(function () {
                     // Change template.
                        $scope.$emit("updateTemplate", "main.html");
                    });
                });
            });
        });

        app.controller("main", function ($scope, $q, $window, rppa, store) {
         // Samples can be inferred from links.
            store.get("links").then(function (links) {
             // Preselect links.
                links = links.map(function (link) {
                    return {
                        id: rppa.extractSampleId(link),
                        uri: link,
                        selected: true
                    };
                });
                $scope.samples = links;
            });
            store.get("antibodies").then(function (antibodies) {
             // Preselect antibodies.
                antibodies = antibodies.map(function (antibody) {
                    return {
                        name: antibody,
                        selected: true
                    };
                });
                $scope.antibodies = antibodies;
            });
            $scope.$watch(function () {
                return {
                    samples: $scope.samples,
                    antibodies: $scope.antibodies
                };
            }, function (combination) {
                var samples, ignoredAntibodies, promises;
                samples = combination.samples.filter(function (sample) {
                    return sample.selected;
                });
                ignoredAntibodies = combination.antibodies.filter(function (antibody) {
                    return !antibody.selected;
                }).map(function (antibody) {
                    return antibody.name;
                });
                promises = samples.map(function (sample) {
                    return store.get("file:" + sample.id).then(function (file) {
                        return rppa.normalizeFile(file, ignoredAntibodies);
                    });
                });
                $q.all(promises).then(function (data) {
                    var blob, groupedByAntibody, antibodyNames, standardizedAntibodies, correlations, i, j, correlation, pairwiseDistances;
                 // Flatten data.
                    data = data.reduce(function (previous, current) {
                        return previous.concat(current);
                    });
                 // Generate blob URI.
                    blob = new Blob([data.map(function (observation) {
                        return observation.join("\t");
                    }).join("\n")]);
                 // See http://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers-bloburis
                    $scope.blobUri = $window.URL.createObjectURL(blob);
                 // Group observations by antibody.
                    groupedByAntibody = {};
                    data.forEach(function (observation) {
                        var antibody, expression;
                        antibody = observation[2];
                        expression = observation[3];
                        if (groupedByAntibody.hasOwnProperty(antibody) === false) {
                            groupedByAntibody[antibody] = [];
                        }
                        groupedByAntibody[antibody].push(expression);
                    });
                 // Extract antibody names for fast lookup.
                    antibodyNames = Object.keys(groupedByAntibody);
                 // Compute summary statistics.
                    $scope.summary = antibodyNames.map(function (antibody) {
                        return {
                            antibody: antibody,
                            median: spearson.median(groupedByAntibody[antibody]),
                            mean: spearson.mean(groupedByAntibody[antibody]),
                            standardDeviation: spearson.standardDeviation(groupedByAntibody[antibody])
                        };
                    });
                 // Standardize expression values.
                    standardizedAntibodies = {};
                    antibodyNames.map(function (antibody) {
                        standardizedAntibodies[antibody] = spearson.standardize(groupedByAntibody[antibody]);
                    });
                 // Calculate the correlation coefficients of all antibody expression levels.
                    correlations = {};
                    for (i = 0; i < antibodyNames.length; i++) {
                        correlations[antibodyNames[i]] = {};
                        for (j = 0; j <= i; j++) {
                            if (i === j) {
                                correlations[antibodyNames[i]][antibodyNames[j]] = 1;
                            } else {
                                correlation = spearson.correlation.pearson(standardizedAntibodies[antibodyNames[i]], standardizedAntibodies[antibodyNames[j]], false);
                                correlations[antibodyNames[i]][antibodyNames[j]] = correlation;
                                correlations[antibodyNames[j]][antibodyNames[i]] = correlation;
                            }
                        }
                    }
                    $scope.correlations = correlations;
                 // Calculate the pairwise distances.
                    pairwiseDistances = Object.keys(correlations).map(function (proteinA) {
                        return Object.keys(correlations[proteinA]).map(function (proteinB) {
                         // The direction of the correlation coefficient is of no value,
                         // it is only the magnitude that matters.
                            return 1 - Math.abs(correlations[proteinA][proteinB]);
                        });
                    });
                 // Run the clustering.
                    $scope.clusters = spearson.hierarchicalClustering(pairwiseDistances, "upgma");
                    $scope.clusterLabels = antibodyNames;
                });
            }, true);
        });

        app.directive("progressBar", function ($window) {
            return {
                restrict: "E",
                scope: {
                    message: "=",
                    percentage: "="
                },
                template: '<div class="well"><p>{{message}}</p><div class="progress progress-striped active"><div class="bar" style="width: {{percentage}}%"></div></div></div>'
            };
        });

        app.directive("heatmap", function ($window) {
            return {
                restrict: "E",
                scope: {
                    data: "="
                },
                link: function (scope, element, attrs) {
                    var viz;
                    viz = $window.heatmap().width(940).height(940);
                    scope.$watch("data", function () {
                        $window.d3.select(element[0])
                                  .datum(scope.data)
                                  .call(viz);
                    });
                }
            };
        });

        app.directive("dendrogram", function ($window) {
            return {
                restrict: "E",
                scope: {
                    labels: "=",
                    data: "="
                },
                link: function (scope, element, attrs) {
                    var viz;
                    viz = $window.dendrogram().width(940).height(4000);
                    scope.$watch("data", function () {
                        viz.labels(scope.labels);
                        $window.d3.select(element[0])
                                  .datum(scope.data)
                                  .call(viz);
                    });
                }
            };
        });

     // Register tab.
        TCGA.ui.registerTab({
            id: "rppa",
            title: "RPPA",
            content: '<style>.tooltip {display: none; position: absolute; padding: 5px; font-size: 13px; opacity: 100; background-color: rgba(242, 242, 242, .8)} .node circle {fill: #fff; stroke: steelblue; stroke-width: 1.5px} .node {font: 10px sans-serif} .link {fill: none; stroke: #ccc; stroke-width: 1.5px}</style><div class="page-header"><h1>RPPA <small>Real time analysis of reverse phase protein array data.</small></h1></div><div ng-controller="template"><ng-include src="template" /></div>',
            switchTab: true
        }, function (err, el) {
            angular.bootstrap(el, ["app"]);
        });

    });

}());