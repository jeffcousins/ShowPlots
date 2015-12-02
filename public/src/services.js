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
  var getEpisodeRatings = function(tvShow, seasonNumber) {
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
	      getEpisodeRatings(tvShow, seasonNumber + 1);
	    }
		});
	};

  // api request to get the show's Guidebox id from the show's IMBd id
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

  return {
  	getImbdId: getImbdId,
  	getEpisodeRatings: getEpisodeRatings,
    getShowInfo: getShowInfo,
    getEpisodes: getEpisodes
  };
});