var viz = angular.module("viz", []);

viz.directive("heatmap", function ($window) {
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

viz.directive("dendrogram", function ($window) {
    return {
        restrict: "E",
        scope: {
            labels: "=",
            data: "="
        },
        link: function (scope, element, attrs) {
            var viz;
            console.log(scope.labels, scope.data);
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
