angular.module('app.services', [])

.factory('TvShow', function($rootScope, $http) {

  // get the IMBd id for the tv show
  var getImbdId = function(tvShow) {
    return $http({
      method: 'GET',
      params: {
        t: tvShow,
        type: 'series'
      },
      url: 'http://www.omdbapi.com/?'
    })
    .then(function(res) {
      return res.data.imdbID;
    });
  };

  // get IMBd ratings for the tv show
  
  $rootScope.results = {};
  var getEpisodeRatings = function(tvShow, seasonNumber, results) {
    results = results || [];
    return $http({
      method: 'GET',
      params: {
        t: tvShow,
        type: 'series',
        season: seasonNumber
      },
      url: 'http://www.omdbapi.com/?'
    })
    .then(function(res) {
      // the api only allows you get retrieve one season at a time
      // recursively retreive all of the seasons
      if (res.data.Response === "True") {
        $rootScope.results = res.data;
        results = results.concat(res.data);
        getEpisodeRatings(tvShow, seasonNumber + 1, results);
      } else {
        $rootScope.allResults = results;
      }
    });
  };

  // api request to get the show's Guidebox id from the show's IMBd id
  // curl -X GET https://api-public.guidebox.com/v1.43/US/rKPgQzhBRt89EHnyQg2reRrflrhTT9yf/search/id/imdb/tt1870479
  var getShowInfo = function(imbdId) {
    return $http({
      method: 'GET',
      url: 'https://api-public.guidebox.com/v1.43/US/' +
        GUIDEBOX_API_KEY +
        '/search/id/imdb/' +
        imbdId
    })
    .then(function(res) {
      return res.data;
    });
  };

  // api request to get all of the episode data for the show
  // curl -X GET https://api-public.guidebox.com/v1.43/US/rKPgQzhBRt89EHnyQg2reRrflrhTT9yf/show/12880/episodes/all/0/100/all/web/true?reverse_ordering=true
  var getEpisodes = function(guideboxId) {
    return $http({
      method: 'GET',
      url: 'https://api-public.guidebox.com/v1.43/US/' +
        GUIDEBOX_API_KEY +
        '/show/' +
        guideboxId +
        '/episodes/all/0/100/all/web/true?reverse_ordering=true'
    })
    .then(function(res) {
      return res.data;
    });
  };

    // ------ TheMovieDB.org API ------ //
  var getBackdrop = function(queryString, onLoadCallback) {
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
          $rootScope.backdropUrl = 'http://image.tmdb.org/t/p/original' + backdropPath;
          // change background
          $('#blackout').fadeIn(100)
            .queue(function(next) {
              var img = document.getElementById('bg');
              img.crossOrigin = 'Anonymous';
              $('#bg').attr('src', 'http://image.tmdb.org/t/p/original' + backdropPath);
              // Get colors from image
              img.addEventListener('load', function() {
                  var vibrant = new Vibrant(img);
                  var swatches = vibrant.swatches()
                  var swatchArray = [];

                  for (var swatch in swatches) {
                    if (swatches.hasOwnProperty(swatch) && swatches[swatch]) {
                      swatchArray.push(swatches[swatch].getHex());
                      // console.log(swatch, swatches[swatch].getHex())
                    }
                  }
                  next();
                  onLoadCallback(swatchArray);
              });
              
            })
            .fadeOut(600);
        }
      }, function(data, status) {
        // error getting TheMovieDB data
        console.log(data);
        console.log(status);
      });
  };



  var getShowsFromSearchQuery = function (queryString) {
    return $http({
      method: 'GET',
      url: 'http://api.themoviedb.org/3/search/tv?api_key='+
      'd56e51fb77b081a9cb5192eaaa7823ad' +
      '&query=' + 
      queryString
    })
    .then(function(res) {
      return res;
    })
  };

  return {
    getImbdId: getImbdId,
    getEpisodeRatings: getEpisodeRatings,
    getShowInfo: getShowInfo,
    getEpisodes: getEpisodes,
    getBackdrop: getBackdrop,
    getShowsFromSearchQuery: getShowsFromSearchQuery
  };
});