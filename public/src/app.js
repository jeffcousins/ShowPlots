// instantiate an angular app
var app = angular.module('app', [
  'app.searchInputDirective', 
  'app.tooltipDirective',
  'app.episodeInfoDirective', 
  'ngSanitize', 
  'ui.select',
  'app.services'
  ]);
  // declare one controller for the app
app.controller('appCtrl', function($scope, $http, TvShow) {
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
  // Image colors
  $scope.swatches = [];

  $scope.icons = {
    "Amazon Prime": "assets/amazon.png",
    "Hulu": "assets/hulu.png",
    "Hulu Plus": "assets/huluplus.png"
  }
  $scope.select = function(info) {
    /*
    info = {
      title: 'episode title',
      rating: 9.1,
      season: 3,
      episode: 5,
      imdbId: 'tt3067860'
    }
    */
    
    $scope.currentEpisode = null;
    if ( $scope.episodes[info.imdbId] ) { 
      $scope.currentEpisode = $scope.episodes[info.imdbId];
      $scope.currentEpisode.rating = info.rating;
      $scope.currentEpisode.season = info.season;
      $scope.currentEpisode.episode = info.episode;
      $scope.currentEpisode.imdbId = info.imdbId;
    } else {
      $scope.currentEpisode = info;
    }
    console.log($scope.currentEpisode);

    $scope.$digest(); // Update page because this was called from d3 not angular
  }

  // * search function
  $scope.submit = function(queryString) {
    queryString = queryString || $scope.query;

    // remove episode info box
    $scope.currentEpisode = null;
    $scope.episodes = null;
    $scope.query = '';
    $scope.graphShown = true;
    // - make call to AJAX factory
    $scope.results = {};
    var season = 1;
    var seasonExists = true;
    
    // change the background based on the input tv show
    // TvShow.getBackdrop(queryString);

    // retrieve the tv shows ratings
    TvShow.getEpisodeRatings(queryString, season);

    // retreive guidebox data for all of the tv show's episodes
    TvShow.getImbdId(queryString)
    .then(function(imbdId) {
      return TvShow.getShowInfo(imbdId);
    })
    .then(function(showInfo) {
      var guideboxId = showInfo.id;
      return TvShow.getEpisodes(guideboxId);
    })
    .then(function(episodes) {
      console.log(episodes);
      $scope.episodes = parseEpisodeData(episodes.results);
    })
    .catch(function(err) {
      console.log(err);
    });

  };

  // ------ FOR RESULTS FROM SEARCH ------ //
  $scope.show = {};
  $scope.refreshShows = function(queryString) {
    if (queryString.length < 2) return;

    TvShow.getShowsFromSearchQuery(queryString)
    .then(function(res) {
      // console.log("refreshShows res: ", res);

      var filteredShows = res.data.results.filter(function (show) {
        return show.vote_count >= MIN_VOTE_COUNT || show.popularity >= MIN_POPULARITY;
      });

      // BEGIN HACK TO AVOID DUPLICATE SHOW NAMES
      // (Eg, US and UK versions of "The Office"...see GitHub issue #32)
      //
      // If there are shows with duplicate names
        // Include the first show, since it is more popular
          // (due to how themoviedb sorts before returning search queries)
      var usedNames = { };
      filteredShows = filteredShows.filter(function (show) {
        // A previous show has the same name, so do not include this show
        if (usedNames[show.name]) {
          return;
        }
        return usedNames[show.name] = true;
      });
      // END HACK

      // console.log("refreshShows filteredShows: ", filteredShows);
      $scope.shows = filteredShows;
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

// parse the episodes for relevant info
// store them in object with their imdb id as the key
/*
parsedEpisodes = {'imbdId': parsedEpisode};
parsedEpisode = {
  'title': 'episode title goes here',
  'description': 'a brief description',
  'freeLinks': {},
  'subscriptionLinks': {},
  'purchaseLinks': {}
}
*/
var parseEpisodeData = function(episodes) {
  // episodes is an array full of episode objects
  var parsedEpisodes = {};

  var freeOptions = {
    "Hulu": true,
    "YouTube": true
  };
  
  var subscriptionOptions = {
    "Amazon Prime": true,
    "HBO NOW": true,
    "Hulu": true,
    "Showtime": true
  };

  var digitalPurchaseOptions = {
    "Amazon": true,
    "Google Play": true,
    "iTunes": true,
    "YouTube": true
  }

  // parse out relevent info for each episode
  for (var i = 0; i < episodes.length; i++) {
    var episode = episodes[i];
    var imdb = episode.imdb_id;
    parsedEpisodes[imdb] = {};

    // episode title and description
    parsedEpisodes[imdb].title = episode.title;
    parsedEpisodes[imdb].description = episode.overview;

    var source;

    // free streaming
    var freeSources = episode.free_web_sources;  // this is an array full of objects
    var parsedFree = {};
    for (var j = 0; j < freeSources.length; j++) {
      source = freeSources[j];
      if ( freeOptions[source.display_name] ) {
        parsedFree[source.display_name] = source.link;
      }
    }
    parsedEpisodes[imdb].freeProviders = parsedFree;

    // subscription streaming
    var subscriptionSources = episode.subscription_web_sources;  // this is an array full of objects
    var parsedSubscription = {};
    for (var k = 0; k < subscriptionSources.length; k++) {
      source = subscriptionSources[k];
      if ( subscriptionOptions[source.display_name] ) {
        parsedSubscription[source.display_name] = source.link;
      }
    }
    parsedEpisodes[imdb].subscriptionProviders = parsedSubscription;

    // digital purchase
    var purchaseSources = episode.purchase_web_sources;  // this is an array full of objects
    var parsedPurchase = {};
    for (var x = 0; x < purchaseSources.length; x++) {
      source = purchaseSources[x];
      if ( digitalPurchaseOptions[source.display_name] ) {
        parsedPurchase[source.display_name] = source.link;
      }
    }
    parsedEpisodes[imdb].purchaseProviders = parsedPurchase;

  }
  
  console.log(parsedEpisodes);
  return parsedEpisodes;
};