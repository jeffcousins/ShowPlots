angular.module('app.searchInputDirective', [])

.directive('searchInput', function() {
  return {
    templateUrl: 'templates/searchInput.html',
    link: function (scope) {

      scope.$watchCollection('shows', function(newVal) {
        if (!newVal) return;

        if (newVal.length > 0) {
          $('#searchError').fadeOut(500, function() {
            $('#searchError').css('visibility', 'hidden');
          });
        } else {
          $('#searchError').fadeIn(500, function() {
            $('#searchError').css('visibility', 'visible');
          });
        }
      });
    }
  };
});
