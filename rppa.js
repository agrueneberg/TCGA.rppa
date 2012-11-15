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
                             // Remove species and validation status from antibody names.
                             // See: http://goo.gl/KB4JZ
                                tuple[0] = tuple[0].match(/(.*)-\w+-\w+/)[1];
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
                },
                mapAntibodyToGenes: function (antibody) {
                    var mapping;
                 // The mapping was extracted from http://goo.gl/KB4JZ
                    mapping = {
                        "14-3-3_beta": ["YWHAB"],
                        "14-3-3_epsilon": ["YWHAE"],
                        "14-3-3_zeta": ["YWHAZ"],
                        "4E-BP1": ["EIF4EBP1"],
                        "4E-BP1_pT37_T46": ["EIF4EBP1"],
                        "4E-BP1_pS65": ["EIF4EBP1"],
                        "53BP1": ["TP53BP1"],
                        "ACC_pS79": ["ACACA", "ACACB"],
                        "ACC1": ["ACACA"],
                        "ACVRL1": ["ACVRL1"],
                        "Akt": ["AKT1", "AKT2", "AKT3"],
                        "Akt_pS473": ["AKT1", "AKT2", "AKT3"],
                        "Akt_pT308": ["AKT1", "AKT2", "AKT3"],
                        "AMPK_alpha": ["PRKAA1"],
                        "AMPK_pT172": ["PRKAA1"],
                        "Annexin_I": ["ANXA1"],
                        "Annexin_VII": ["ANXA7"],
                        "AR": ["AR"],
                        "Bad_pS112": ["BAD"],
                        "Bak": ["BAK1"],
                        "Bax": ["BAX"],
                        "Bcl-2": ["BCL2"],
                        "Bcl-xL": ["BCL2L1"],
                        "Beclin": ["BECN1"],
                        "Bid": ["BID"],
                        "Bim": ["BCL2L11"],
                        "E-Cadherin": ["CDH1"],
                        "N-Cadherin": ["CDH2"],
                        "Caspase-7_cleavedD198": ["CASP7"],
                        "Caspase-9_cleavedD330": ["CASP9"],
                        "alpha-Catenin": ["CTNNA1"],
                        "beta-Catenin": ["CTNNB1"],
                        "Caveolin-1": ["CAV1"],
                        "CD31": ["PECAM1"],
                        "CD49b": ["ITGA2"],
                        "CDK1": ["CDC2"],
                        "Chk1": ["CHEK1"],
                        "Chk1_pS345": ["CHEK1"],
                        "Chk2": ["CHEK2"],
                        "Chk2_pT68": ["CHEK2"],
                        "cIAP": ["BIRC2"],
                        "Claudin-7": ["CLDN7"],
                        "Collagen_VI": ["COL6A1"],
                        "Cyclin_B1": ["CCNB1"],
                        "Cyclin_D1": ["CCND1"],
                        "Cyclin_E1": ["CCNE1"],
                        "DJ-1": ["PARK7"],
                        "Dvl3": ["DVL3"],
                        "eEF2": ["EEF2"],
                        "eEF2K": ["EEF2K"],
                        "EGFR": ["EGFR"],
                        "EGFR_pY1068": ["EGFR"],
                        "EGFR_pY1173": ["EGFR"],
                        "eIF4E": ["EIF4E"],
                        "eIF4G": ["EIF4G1"],
                        "ER-alpha": ["ESR1"],
                        "ER-alpha_pS118": ["ESR1"],
                        "ERCC1": ["ERCC1"],
                        "Fibronectin": ["FN1"],
                        "FOX03a": ["FOXO3"],
                        "FoxM1": ["FOXM1"],
                        "Gab2": ["GAB2"],
                        "GATA3": ["GATA3"],
                        "GSK3_pS9": ["GSK3A", "GSK3B"],
                        "GSK3-alpha-beta": ["GSK3A", "GSK3B"],
                        "GSK3-alpha-beta_pS21_S9": ["GSK3A", "GSK3B"],
                        "TSC1": ["TSC1"],
                        "HER2": ["ERBB2"],
                        "HER2_pY1248": ["ERBB2"],
                        "HER3": ["ERBB3"],
                        "HER3_pY1298": ["ERBB3"],
                        "IGFBP2": ["IGFBP2"],
                        "INPP4B": ["INPP4B"],
                        "IRS1": ["IRS1"],
                        "JNK_pT183_pT185": ["MAPK8"],
                        "JNK2": ["MAPK9"],
                        "c-Kit": ["KIT"],
                        "Lck": ["LCK"],
                        "MAPK_pT202_Y204": ["MAPK1", "MAPK3"],
                        "MEK1": ["MAP2K1"],
                        "MEK1_pS217_S221": ["MAP2K1"],
                        "c-Met": ["MET"],
                        "c-Met_pY1235": ["MET"],
                        "MGMT": ["MGMT"],
                        "MIG-6": ["ERRFI1"],
                        "MSH2": ["MSH2"],
                        "MSH6": ["MSH6"],
                        "mTOR": ["FRAP1"],
                        "mTOR_pS2448": ["FRAP1"],
                        "c-Myc": ["MYC"],
                        "MYH11": ["MYH11"],
                        "NDRG1_pT346": ["NDRG1"],
                        "NF2": ["NF2"],
                        "NF-kB-p65_pS536": ["NFKB1"],
                        "Notch1": ["NOTCH1"],
                        "Notch3": ["NOTCH3"],
                        "p27": ["CDKN1B"],
                        "p27_pT157": ["CDKN1B"],
                        "p27_pT198": ["CDKN1B"],
                        "p38_MAPK": ["MAPK14"],
                        "p38_pT180_Y182": ["MAPK14"],
                        "p53": ["TP53"],
                        "p70S6K": ["RPS6KB1"],
                        "p70S6K_pT389": ["RPS6KB1"],
                        "p90RSK_pT359_S363": ["RPS6KA1"],
                        "Paxillin": ["PXN"],
                        "PCNA": ["PCNA"],
                        "PDCD4": ["PDCD4"],
                        "PDK1": ["PDK1"],
                        "PDK1_pS241": ["PDK1"],
                        "PEA15": ["PEA15"],
                        "PEA15_pS116": ["PEA15"],
                        "PI3K-p110-alpha": ["PIK3CA"],
                        "PI3K-p85": ["PIK3R1"],
                        "PKC-alpha": ["PRKCA"],
                        "PKC-alpha_pS657": ["PRKCA"],
                        "PKC-delta_pS664": ["PRKCD"],
                        "PKC-pan_BetaII_pS660": ["PKC"],
                        "PR": ["PGR"],
                        "PRAS40_pT246": ["AKT1S1"],
                        "PTEN": ["PTEN"],
                        "Rab11": ["RAB11A", "RAB11B"],
                        "Rab25": ["RAB25"],
                        "Rad50": ["RAD50"],
                        "Rad51": ["RAD51"],
                        "Raf-B": ["BRAF"],
                        "C-Raf": ["RAF1"],
                        "C-Raf_pS338": ["RAF1"],
                        "Raptor": ["RPTOR"],
                        "K-Ras": ["KRAS"],
                        "N-Ras": ["NRAS"],
                        "Rb": ["RB1"],
                        "Rb_pS807_S811": ["RB1"],
                        "RBM15": ["RBM15"],
                        "Rictor": ["RICTOR"],
                        "Rictor_pT1135": ["RICTOR"],
                        "S6_pS235_S236": ["RPS6"],
                        "S6_pS240_S244": ["RPS6"],
                        "SCD1": ["SCD1"],
                        "SF2": ["SFRS1"],
                        "Smac": ["DIABLO"],
                        "Smad1": ["SMAD1"],
                        "Smad3": ["SMAD3"],
                        "Smad4": ["SMAD4"],
                        "Snail": ["SNAI2"],
                        "Src": ["SRC"],
                        "Src_pY416": ["SRC"],
                        "Src_pY527": ["SRC"],
                        "STAT3_pY705": ["STAT3"],
                        "STAT5-alpha": ["STAT5A"],
                        "Stathmin": ["STMN1"],
                        "Syk": ["SYK"],
                        "TAZ": ["WWTR1"],
                        "TAZ_pS89": ["WWTR1"],
                        "TTF1": ["TTF1"],
                        "TIGAR": ["C12ORF5"],
                        "TRFC": ["TRFC"],
                        "Transglutaminase": ["TGM2"],
                        "Tuberin": ["TSC2"],
                        "VEGFR2": ["KDR"],
                        "VHL": ["VHL"],
                        "XRCC1": ["XRCC1"],
                        "YAP": ["YAP1"],
                        "YAP_pS127": ["YAP1"],
                        "YB-1": ["YBX1"],
                        "YB-1_pS102": ["YBX1"]
                    };
                    if (mapping.hasOwnProperty(antibody)) {
                        return mapping[antibody];
                    } else {
                        return [];
                    }
                }
            };
        });

        app.controller("template", function ($scope, $templateCache) {
            $templateCache.put("download-data.html", '<div ng-controller="download"><progress-bar message="message" percentage="percentage" /></div>');
            $templateCache.put("main.html", '<div ng-controller="main"><div class="navbar"><div class="navbar-inner"><ul class="nav"><li><a href="#samples">Samples</a></li><li><a href="#antibodies">Antibodies</a></li><li><a href="#summary">Summary</a></li><li><a href="#correlations">Correlations</a></li><li><a href="#clusters">Clusters</a></li><li><a href="#export">Export</a></li></ul></div></div><h2><a name="samples">Samples</a></h2><div class="btn-group"><button ng-click="selectAll(samples)" class="btn">Select all</button><button ng-click="selectNone(samples)" class="btn">Select none</button></div><ul class="unstyled"><li ng-repeat="sample in samples"><input type="checkbox" ng-model="sample.selected" />&nbsp;<a href="{{sample.uri}}" target="_blank">{{sample.id}}</a></li></ul><h2><a name="antibodies">Antibodies</a></h2><div class="btn-group"><button ng-click="selectAll(antibodies)" class="btn">Select all</button><button ng-click="selectNone(antibodies)" class="btn">Select none</button></div><ul class="unstyled"><li ng-repeat="antibody in antibodies"><input type="checkbox" ng-model="antibody.selected" />&nbsp;{{antibody.name}}</li></ul><h2><a name="summary">Summary</a></h2><table class="table table-striped"><thead><tr><th>Antibody</th><th>Median</th><th>Mean</th><th>Standard deviation</th></tr></thead><tbody><tr ng-repeat="item in summary"><td>{{item.antibody}}</td><td>{{item.median}}</td><td>{{item.mean}}</td><td>{{item.standardDeviation}}</td></tr></tbody></table><h2><a name="correlations">Correlation coeffcients of antibody pairs</h2><heatmap data="correlations" /><h2><a name="clusters">Clustering of correlation coefficients</a></h2><dendrogram labels="clusterLabels" data="clusters" /><h2><a name="export">Export tidied data (for use in R, MATLAB, Google Refine, ...)</a></h2><p>Format: <code>Sample REF</code> \\t <code>Composite Element REF</code> \\t <code>Protein</code> \\t <code>Protein Expression</code></p><a href="{{blobUri}}" download="rppa.tsv" class="btn">Download tidied data</a><div>');
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
            $scope.selectAll = function (model) {
                model.forEach(function (item) {
                    item.selected = true;
                });
            };
            $scope.selectNone = function (model) {
                model.forEach(function (item) {
                    item.selected = false;
                });
            };
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
            content: '<style>.node circle {fill: #fff; stroke: steelblue; stroke-width: 1.5px} .node {font: 10px sans-serif} .link {fill: none; stroke: #ccc; stroke-width: 1.5px}</style><div class="page-header"><h1>RPPA <small>Real time analysis of reverse phase protein array data.</small></h1></div><div ng-controller="template"><ng-include src="template" /></div>',
            switchTab: true
        }, function (err, el) {
            angular.bootstrap(el, ["app"]);
        });

    });

}());