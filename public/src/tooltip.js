angular.module('app.tooltipDirective', [])

.directive('tooltip', function() {
  return {
    scope: {
      title: '=title'
    },
    templateUrl: 'templates/tooltip.html',
    link: function(scope, element, attrs) {
      scope.$watch('title', function (newVal, oldVal) {
        $compile(element.contents())(scope);
      });
    }
  };
})

