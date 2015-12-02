//Used This Example as a resource below --> http://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337
//Also this: --> http://codepen.io/Siddharth11/pen/YPMWeE

//Need Width, Height, Padding, Based on Object
//(Would like to use percentages for dynamic sizing based on browser)


app.directive('graph', function($parse, $window) {
  return {
    restrict: 'EA',
    template: '<section class="graph"><div id="graph"></div></section>',
    link: function(scope, elem, attrs, ctrl) {

      scope.$watchCollection('results', function(newVal, oldVal) {
        data_url = newVal || {};
        drawGraph(scope.select);
      });

      scope.$watch('show.selected', function(newVal) {
        if (newVal && newVal.Title) {
          scope.submit(newVal.Title);
        }
      });
    }
  };
});
