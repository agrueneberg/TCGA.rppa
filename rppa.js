(function () {
    "use strict";

 // Load dependencies.
    TCGA.loadScript({
        registerModules: false,
        scripts: ["https://ajax.googleapis.com/ajax/libs/angularjs/1.0.2/angular.min.js"]
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
                }
            };
        });

        app.controller("template", function ($scope, $templateCache) {
            $templateCache.put("download-data.html", '<div ng-controller="download"><progress-bar message="message" percentage="percentage" /></div>');
            $templateCache.put("main.html", '<div ng-controller="main">{{test}}<div>');
            $scope.template = "download-data.html";
            $scope.$on("updateTemplate", function (event, template) {
                $scope.template = template;
            });
        });

        app.controller("download", function ($scope, rppa, store) {
            $scope.message = "Querying hub...";
            $scope.percentage = 1;
            rppa.fetchLinks().then(function (links) {
                $scope.message = "Downloading files...";
                rppa.fetchFiles(links).then(function (files) {
                 // Now that q supports progress notifications, AngularJS will hopefully implement them, too.
                 // https://github.com/kriskowal/q/issues/63
                    $scope.percentage = 100;
                 // Collapse links and files.
                    files = files.map(function (file, idx) {
                        return {
                            uri: links[idx],
                            body: file
                        };
                    });
                    store.set("files", files);
                 // Change template.
                    $scope.$emit("updateTemplate", "main.html");
                });
            });
        });

        app.controller("main", function ($scope) {
            $scope.test = "Hello World!";
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

     // Register tab.
        TCGA.ui.registerTab({
            id: "rppa",
            title: "RPPA",
            content: '<div class="page-header"><h1>RPPA <small>Real time analysis of reverse phase protein array data.</small></h1></div><div ng-controller="template"><ng-include src="template" /></div>',
            switchTab: true
        }, function (err, el) {
            angular.bootstrap(el, ["app"]);
        });

    });

}());