// instantiate an angular app
var app = angular.module('app', ['app.searchInputDirective', 'app.tooltipDirective']);
  // declare one controller for the app
app.controller('appCtrl', function($scope, $http) {
  // * scope will have the query string as a variable
  $scope.query = '';
  // * show meta data as an object (reponse from AJAX call?)
  $scope.results = [];
  // * d3 object / data set (when data is changed page is update)
  $scope.graphShown = false;

  // * search function
  $scope.submit = function() {
    $scope.graphShown = true;
    // - make call to AJAX factory
    $scope.results = {};
    var season = 1;
    var seasonExists = true;
    var queryString = $scope.query;
    $scope.query = '';
    var getAllSeasons = function(seasonNumber) {
    	$http({
    		//need to handle url spaces
    		method: 'GET',
        params: {
          t: queryString, 
          type: 'series', 
          season: seasonNumber},
    		url: 'http://www.omdbapi.com/?',
    	}).then(function(res) {
        console.log(res);
        if (res.data.Response === "True") {
          $scope.results = res.data;
          getAllSeasons(seasonNumber + 1);
        }
    		//run d3 function with data
    	}, function(err) {

        console.log(err);
      });
    };

    // ------ TheMovieDB.org API ------ //
    var getBackdrop = function() {
      var base = 'http://api.themoviedb.org/3/search/tv';
      var apiKey = '5fa7832c6fecbcc0b59712892ca52fca';
      var callback = 'JSON_CALLBACK'; // provided by angular.js
      var url = base + '?api_key=' + apiKey + '&query=' + queryString + '&callback=' + callback;

      $http.jsonp(url)
        .then(function(res, status) { 
          if (res.data.total_results) {
            console.log('total_results === ' + res.data.total_results);
            var backdropPath = res.data.results[0].backdrop_path;
            $('#bg').attr('src', 'http://image.tmdb.org/t/p/original' + backdropPath);
          }
        },function(data, status) {
          console.log(data);
          console.log(status);
        });
    };

    getBackdrop();
    getAllSeasons(season);
  };
});

