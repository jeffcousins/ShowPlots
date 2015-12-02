// instantiate an angular app
var app = angular.module('app', ['app.searchInputDirective', 'app.tooltipDirective',
                                 'app.episodeInfoDirective', 'ngSanitize', 'ui.select']);
  // declare one controller for the app
app.controller('appCtrl', function($scope, $http) {
  // The below constants are used by $scope.refreshShows() to filter results
  // before showing end-user suggestions based on their search query.
  var MIN_VOTE_COUNT = 10; // Votes on TheMovieDB.org.
  var MIN_POPULARITY = 2; // Popularity on TheMovieDB.org Seems to go between 1 and 10.

  // * scope will have the query string as a variable
  $scope.query = '';
  // * show meta data as an object (reponse from AJAX call?)
  $scope.results = [];
  // * d3 object / data set (when data is changed page is update)
  $scope.graphShown = false;
  $scope.currentEpisode = null;
  $scope.icons = {
    "Amazon Prime": "assets/amazon.png",
    "Hulu": "assets/hulu.png",
    "Hulu Plus": "assets/huluplus.png"
  }
  $scope.select = function(info) {
    $scope.currentEpisode = info;

    // Dummy data until the api call is complete
    $scope.currentEpisode.description = "This is dummy text until we get the real API call. Here's some more text to fill up the space. A+! Really great text, would read again."
    $scope.currentEpisode.freeProviders = { "Amazon Prime": "http://www.amazon.com/", "Hulu": "http://www.hulu.com/" }
    $scope.currentEpisode.subscriptionProviders = { "Amazon Prime": "http://www.amazon.com/", "Hulu Plus": "http://www.hulu.com/" }
    $scope.currentEpisode.purchaseProviders = { "Amazon Prime": "http://www.amazon.com/", "Hulu": "http://www.hulu.com/" }
    $scope.$digest(); // Update page because this was called from d3 not angular
  }

  // * search function
  $scope.submit = function(queryString) {
    queryString = queryString || $scope.query;
    $scope.query = '';
    $scope.graphShown = true;
    // - make call to AJAX factory
    $scope.results = {};
    var season = 1;
    var seasonExists = true;
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

          // if search results > 0
          if (res.data.total_results) {

            // image path
            var backdropPath = res.data.results[0].backdrop_path;

            // change background
            $('#blackout').fadeIn(100)
              .queue(function(next) { 
                $('#bg').attr('src', 'http://image.tmdb.org/t/p/original' + backdropPath);
                next();
              })
              .fadeOut(600);
          }
        }, function(data, status) {
          // error getting TheMovieDB data
          console.log(data);
          console.log(status);
        });
    };

    getBackdrop();
    getAllSeasons(season);
  };

  // ------ FOR RESULTS FROM SEARCH ------ //
  $scope.show = {};
  $scope.refreshShows = function(queryString) {
    $http({
      method: 'GET',
      url: 'http://api.themoviedb.org/3/search/tv?api_key=d56e51fb77b081a9cb5192eaaa7823ad&query=' + queryString
    }).then(function(res) {
      // console.log("refreshShows res: ", res);

      $scope.shows = res.data.results.filter(function (show) {
        return show.vote_count >= MIN_VOTE_COUNT || show.popularity >= MIN_POPULARITY;
      });
    });
  };
});

// dynamic background resizing
$(window).load(function() { 
  var theWindow = $(window);
  var $bg = $('#bg');
  var aspectRatio = $bg.width() / $bg.height();

  function resizeBg() {
      if ( (theWindow.width() / theWindow.height()) < aspectRatio ) {
          $bg.removeClass().addClass('bgheight');
          var myLeft = ( aspectRatio * theWindow.height() - theWindow.width() ) / -2;
          $bg.css('left', myLeft);
      } else {
          $bg.removeClass().addClass('bgwidth');
          $bg.css('left', '0');
      }           
  }
  theWindow.resize(resizeBg).trigger("resize");

  $('#bg').fadeIn(2000);
});