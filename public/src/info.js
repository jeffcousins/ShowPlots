angular.module('app.episodeInfoDirective', [])

.directive('episodeInfo', function() {
  return {
    templateUrl: 'templates/episodeInfo.html',
    link: function(scope, elem, attrs, ctrl) {
      scope.$watch('currentEpisode', function(newVal, oldVal) {
        console.log('fuck');
        debugger;
      }, true);
    }
  };
});

