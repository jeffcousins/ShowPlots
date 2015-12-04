// var w = 1100;
var w = window.innerWidth * 0.8;
var h = 400;  
var padding = 25;
//We don't know where this will be yet, needs to change.
var data_url = {};
var epId = 1;
var episodedataset = [];
var ratingdataset = [];
var infoset = [];
var showName = '';
var seasonAvg = [];



var drawGraph = function(clickCallback, trendLineStrokeColor) {
  w = $('#graphContainer').width(); // to fix bootstrap
  trendLineStrokeColor = trendLineStrokeColor || "rgb(255, 255, 255)";
  //clear datasets if graphing new show changed
  if (data_url.Title !== showName) {
    epId = 1;
    episodedataset = [];
    ratingdataset = [];
    infoset = [];
  }
  //update showName
  showName = data_url.Title;

  // All purpose each function
  var each = function(input, callback) {
    if (input.constructor === Object) {
      for (var key in input) {
        callback(input[key], key, input);
      }
    } else {
      for (var i = 0; i < input.length; i++) {
        callback(input[i], i, input);
      }
    }
  };


  //Function for filling up the info dataset
  //Function for filling up the episode dataset
  //iterate over episodes and add data to d3 datasets
  var episodes = data_url.Episodes || {};
  each(episodes, function(episode, key) {
    if (episode.imdbRating !== "N/A") {
      //get episode data
      var epNum = parseInt(episode.Episode);
      var rating = parseFloat(episode.imdbRating);
      var showTitle = episode.Title;
      var season = parseInt(data_url.Season);
      var id = episode.imdbID;
      //fill the d3 dataset variables
      episodedataset.push([epId, rating, id, season]);
      ratingdataset.push(rating);
      infoset.push([showTitle, rating, season, epNum, id]);
      seasonAvg.push([season, rating]);
      epId++;
    }
  });

var seasonScore = [];

  //This reveals data when you mouse over nodes.
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])

    .html(function(d) {
      return "<strong>Title:</strong> <span style='color:#2FFF4D'>" + d[0] + "</span>" + "<br>" + "<strong>Rating:</strong> <span style='color:#2FFF4D'>" + d[1] + "</span>" + "<br>" + "<strong>Season:</strong> <span style='color:#2FFF4D'>" + d[2] + "</span>" + "<br>" + "<strong>Episode:</strong> <span style='color:#2FFF4D'>" + d[3] + "</span>" + "<br>" + "<br>"+ "<strong>Click for more info</strong> <span style='color:#2FFF4D'>";
    });

  var trendLine = function() {
    var x1 = 0;
    var y1 = 0;
    var x2 = 0;
    var y2 = 0;
    var len = episodedataset.length;

    each(episodedataset, function(item, index) {
      x1 += item[0];
    });

    each(episodedataset, function(item, index) {
      y1 += item[1];
    });

    each(episodedataset, function(item, index) {
      x2 += (item[0] * item[1]);
    });

    each(episodedataset, function(item, index) {
      y2 += (item[0] * item[0]);
    });

    var slope = (((len * x2) - (x1 * y1)) / ((len * y2) - (x1 * x1)));
    var intercept = ((y1 - (slope * x1)) / len);
    var xLabels = episodedataset.map(function(d) {
      return d[0];
    });
    var xSeries = d3.range(1, xLabels.length + 1);
    var ySeries = episodedataset.map(function(d) {
      return d[1];
    });
    var a1 = xLabels[0];
    var b1 = slope + intercept;
    var a2 = xLabels[xLabels.length - 1];
    var b2 = slope * xSeries.length + intercept;
    var trendData = [
      [a1, b1, a2, b2]
    ];
    var trendLine = svg.select();
    var trendline = svg.selectAll(".trendline")
      .data(trendData);

    trendline.enter()
      .append("line")
      .attr("class", "trendline")
      .attr("x1", function(d) {
        return xScale(d[0]);
      })
      .attr("y1", function(d) {
        return yScale(d[1]);
      })
      .attr("x2", function(d) {
        return xScale(d[2]);
      })
      .attr("y2", function(d) {
        return yScale(d[3]);
      })
      .style("stroke", trendLineStrokeColor);
  };


  var randomColor = function(){
    var letters = '0123456789ABCDEF'.split('');
    color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  //Define Graph Space, Initialize d3 (This sets how big the div is)
  d3.selectAll('svg')
    .remove();
  $('#graph').empty();

  var svg = d3.select('#graph')
    .append('svg')
    .attr('width', w)
    .attr('height', h);

  svg.call(tip);

  //Define Grid (inside), Initialize Scale and Axes of Graph (Using "g" element, tutorial here --> http://tutorials.jenkov.com/svg/g-element.html)
  /*x scale*/
  var xScale = d3.scale.linear()
    .domain([0, d3.max(episodedataset, function(d) {
      return d[0];
    })])
    .range([padding, w - padding]);

  /*y scale*/ //based on rating data set
  ratingdataset.sort();
  var yScale = d3.scale.linear()
    .domain([ratingdataset[0] - 0.2, ratingdataset[ratingdataset.length - 1] + 0.1])
    .range([h - padding, padding]);

  /*x axis*/
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom');

  /*append x axis*/
  svg.append('g')
    .attr({
      'class': 'xaxis',
      'transform': 'translate(0,' + (h - padding) + ')'
    })
    .call(xAxis)
    .append("text")
    .attr("y", -12)
    .attr("x", w - 35)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Episode");

  /*y axis*/
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left');
  /*append y axis*/
  svg.append('g')
    .attr({
      'class': 'yaxis',
      'transform': 'translate(' + padding + ',0)'
    })
    .call(yAxis)
    .append("text")
    .attr("y", 5)
    .attr("x", 40)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("IMDB Rating");

  //Draw Graph (Lines and Points)
  /*define line*/
  var lines = d3.svg.line()
    .x(function(d) {
      return xScale(d[0]);
    })
    .y(function(d) {
      return yScale(d[1]);
    })
    .interpolate('monotone');

  /*append line*/
  var path = svg.append('path')
    .attr({
      'd': lines(episodedataset),
      'class': 'lineChart'
      
    });

   

  svg.select('.lineChart')
    .style('opacity', 0)
    .transition()
    .duration(1000)
    .delay(1000)
    .style('opacity', 1);

  /*add points*/
  var points = svg.selectAll('circle')
    .data(episodedataset)
    .enter()
    .append("a")
    .append('circle');

  var colorCode = {
    1: "#E56410", 
    2: "#24E05F", 
    3: "#A572E1", 
    4: "#AA5158", 
    5: "#23304B", 
    6: "#318420"
  };

  var objLength = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

  /*point attributes*/
  points.attr('cy', 0)
    .transition()
    .duration(2500)
    .delay(function(d, i) {
      return (2000 / episodedataset.length) * i;
    })
    .ease('elastic')
    .attr({
      'cx': function(d) {
        return xScale(d[0]);
      },
      'cy': function(d) {
        return yScale(d[1]);
      },
      'r': 7,
      'class': 'datapoint',
      'id': function(d, i) {
        return i;
      }
    })
    .style("fill", function(d) {

    if (d[3] > objLength(colorCode)) { 
        return  (colorCode[d[3] % objLength(colorCode)]); 
    }

    for (var color in colorCode){
      if (d[3] == color){
        return colorCode[color];
      }
    }

  });


 

  // var area = d3.svg.area()
  //   .x(function(d) { return x(d[0]); })
  //   .y0(function(d) { return y(d[1]-3); })
  //   .y1(function(d) { return y(d[1]+3); });



  // points.style("fill", function(d) {
  //   var season = 1;
  //   var color = '#ff0000';

  //   console.log('season: ' + d);

  //   if (season !== d[3]){
  //   color = randomColor(); 
  //   season++;

  //   }

  //   return color;
    
    
  // });
      


  d3.timer(trendLine, 3500);
  


  // d3.select('#graph svg')
  //   .append("text")
  //   .attr("x", w / 2)
  //   .attr("y", 14)
  //   .attr("text-anchor", "middle")
  //   .attr('class', 'trendLine')
  //   .style("fill", trendLineStrokeColor)
  //   .text(showName);


svg.selectAll('circle').data(infoset).on('mouseover', function(d) {
        d3.select(this).transition()
            .ease("elastic")
            .duration("500")
            .attr("r", 12);

            tip.show(d);
            
          })
.on('mouseout', function(d) {
        d3.select(this).transition()
            .ease("elastic")
            .duration("500")
            .attr("r", 7);

            tip.hide(d);
          })
          .on('click', function(d) {
            var info = {};
            info.title = d[0];
            info.rating = d[1];
            info.season = d[2];
            info.episode = d[3];
            info.imdbId = d[4];
            clickCallback(info);
          });


};