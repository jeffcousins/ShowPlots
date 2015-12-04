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
  $scope.graphLoading = false;
  $scope.infoLoading = false;

  $scope.headerName = '';
  $scope.hideMainHeader = false;

  $scope.icons = {
    "Amazon": "assets/amazon.png", // Amazon Instant Video
    "Amazon Prime": "assets/amazon-prime.jpg",
    "Google Play": "assets/google-play.png",
    "HBO NOW": "assets/hbo-now.png",
    "Hulu": "assets/hulu.png",
    "Hulu Plus": "assets/huluplus.png", // I don't think we use this one...
    "iTunes": "assets/iTunes.png",
    "Showtime": "assets/showtime.png",
    "YouTube": "assets/youTube.png"
  };

  $scope.episodeWaiting = false;
  $scope.nextEpisodeInfo = null;

  $scope.select = function(info) {
    if (!$scope.parsingFinished) {
      $scope.episodeWaiting = true;
      $scope.nextEpisodeInfo = info;
      $scope.$digest();
      return;
    }
    $scope.currentEpisode = null;
    if ( $scope.episodes && $scope.episodes[info.season][info.episode] ) { 
      $scope.currentEpisode = $scope.episodes[info.season][info.episode];
      $scope.currentEpisode.rating = info.rating;
      $scope.currentEpisode.season = info.season;
      $scope.currentEpisode.episode = info.episode;
      $scope.currentEpisode.imdbId = info.imdbId;
    } else {
      $scope.currentEpisode = info;
    }
    // Set hulu plus for subscription
    if ($scope.currentEpisode.subscriptionProviders && $scope.currentEpisode.subscriptionProviders.Hulu) {
      $scope.currentEpisode.subscriptionProviders["Hulu Plus"] = $scope.currentEpisode.subscriptionProviders.Hulu;
      delete $scope.currentEpisode.subscriptionProviders.Hulu;
    }
    if ($scope.currentEpisode.freeProviders) { // make sure its loaded
      $scope.currentEpisode.hasFreeProviders = Object.keys($scope.currentEpisode.freeProviders).length > 0 ? true : false;
      $scope.currentEpisode.hasSubscriptionProviders = Object.keys($scope.currentEpisode.subscriptionProviders).length > 0 ? true : false;
      $scope.currentEpisode.hasPurchaseProviders = Object.keys($scope.currentEpisode.purchaseProviders).length > 0 ? true : false;
    }
    // Add trailing zero instead of integer
    $scope.currentEpisode.rating = parseFloat(Math.round($scope.currentEpisode.rating * 100) / 100).toFixed(1);
    $scope.currentEpisode.linkUrl = 'http://www.imdb.com/title/' + $scope.currentEpisode.imdbId;
    console.log($scope.currentEpisode);

    if (!$scope.episodeWaiting) {
      $scope.$digest(); // Update page because this was called from d3 not angular
    }
    $scope.episodeWaiting = false;
  };

  // * search function
  $scope.submit = function(queryString) {
    
    queryString = queryString || $scope.query;

    // remove episode info box
    $scope.currentEpisode = null;
    $scope.episodes = null;
    $scope.query = '';
    $scope.hideMainHeader = true;
    $scope.graphShown = true;
    $scope.parsingFinished = false;
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
      $scope.headerName = queryString;
      return TvShow.getShowInfo(imbdId);
    })
    .then(function(showInfo) {
      var guideboxId = showInfo.id;
      var startEpisode = 0;
      return TvShow.getEpisodes(guideboxId, startEpisode);
    })
    .then(function(episodes) {
      $scope.episodes = parseEpisodeData(episodes);

    })
    .then(function(episodes) {
      $scope.parsingFinished = true;
      if ($scope.episodeWaiting) {
        $scope.select($scope.nextEpisodeInfo);
      }
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
          return false;
        }
        
        usedNames[show.name] = true;
        return usedNames[show.name];
      });
      // END HACK

      // console.log("refreshShows filteredShows: ", filteredShows);
      $scope.shows = filteredShows;
    });
  };
});

// dynamic background resizing
$(window).load(function() {
  $('#searchError').hide();
  $('#blackout').fadeOut(200);
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
  $('#searchInput input').keypress(function(e) {
    $('#searchError').hide();
    if (e.which !== 13) {
      $('#searchError').hide();
      return;
    }
    $('#searchError').hide();
    var numberOfResults = $('.ui-select-choices-row').length;
    if (numberOfResults < 1) {
      console.log('no show found');
      $('#searchError').show();
    }
  });
});

// parse the episodes for relevant info
// store them in object with their imdb id as the key
/*
parsedEpisodes = {'seasonNumber': {
  'episodeNumber': parsedEpisodeObj,
  'episodeNumber': parsedEpisodeObj
  }
};
parsedEpisodeObj = {
  'title': 'episode title goes here',
  'description': 'a brief description',
  'freeLinks': {},
  'subscriptionLinks': {},
  'purchaseLinks': {}
}
*/
var parseEpisodeData = function(episodes) {
  // episodes argument is an array full of episode objects
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
  };

  // parse out relevent info for each episode
  episodes.forEach(function(episode) {
    var seasonNum = episode.season_number;
    var episodeNum = episode.episode_number;
    var source;

    // if the season does not exist yet in parsedEpisodes, create it
    if ( !parsedEpisodes[seasonNum] ) {
      parsedEpisodes[seasonNum] = {};
    }

    // create an empty object for the parsed episode data
    parsedEpisodes[seasonNum][episodeNum] = {};

    // episode title and description
    parsedEpisodes[seasonNum][episodeNum].title = episode.title;
    parsedEpisodes[seasonNum][episodeNum].description = episode.overview;

    // free streaming (Hulu, Youtube)
    var freeSources = episode.free_web_sources;  // this is an array full of objects
    var freeProviders = {};
    freeSources.forEach(function(freeSource) {
      if ( freeOptions[freeSource.display_name] ) {
        freeProviders[freeSource.display_name] = freeSource.link;
      }
    });
    parsedEpisodes[seasonNum][episodeNum].freeProviders = freeProviders;

    // subscription streaming (AmazonPrime, HBO NOW, Hulu, Showtime)
    var subscriptionSources = episode.subscription_web_sources;  // this is an array full of objects
    var subscriptionProviders = {};
    subscriptionSources.forEach(function(subscriptionSource) {
      if ( subscriptionOptions[subscriptionSource.display_name] ) {
        subscriptionProviders[subscriptionSource.display_name] = subscriptionSource.link;
      }
    });
    parsedEpisodes[seasonNum][episodeNum].subscriptionProviders = subscriptionProviders;

    
    // digital purchase (Amazon, GooglePlay, iTunes, YouTube)
    var purchaseSources = episode.purchase_web_sources;  // this is an array full of objects
    var purchaseProviders = {};
    purchaseSources.forEach(function(purchaseSource) {
      if ( digitalPurchaseOptions[purchaseSource.display_name] ) {
        purchaseProviders[purchaseSource.display_name] = purchaseSource.link;
      }
    });
    parsedEpisodes[seasonNum][episodeNum].purchaseProviders = purchaseProviders;
  });
  
  return parsedEpisodes;  
}
