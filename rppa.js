(function () {
    "use strict";

 // Load dependencies.
    TCGA.loadScript({
        registerModules: false,
        scripts: ["https://ajax.googleapis.com/ajax/libs/angularjs/1.0.2/angular.min.js"]
    }, function () {

        var app;

        app = angular.module("app", []);

        app.controller("template", function ($scope, $templateCache) {
            $templateCache.put("test.html", 'Hello World!');
            $scope.template = "test.html";
            $scope.$on("updateTemplate", function (event, template) {
                $scope.template = template;
            });
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