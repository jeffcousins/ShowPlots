//Used This Example as a resource below --> http://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337
//Also this: --> http://codepen.io/Siddharth11/pen/YPMWeE

//Need Width, Height, Padding, Based on Object
//(Would like to use percentages for dynamic sizing based on browser)


app.directive('graph', function($parse, $window, $rootScope, TvShow) {
  return {
    restrict: 'EA',
    template: '<section class="graph"><div id="graph"></div></section>',
    link: function(scope, elem, attrs, ctrl) {


      $rootScope.$watchCollection('allResults', function(newVal, oldVal) {
        if (!newVal || !newVal[0]) { return; }
        TvShow.getBackdrop(newVal[0].Title, function(swatches) {
          for (var i = 0; i < newVal.length; i++) {
            data_url = newVal[i];
            drawGraph(scope.select, swatches[1]);
          }
        });

      });

      scope.$watch('show.selected', function(newVal) {
        if (newVal && newVal.name) {
          scope.submit(newVal.name);
        }
      });
    }
  };
});
