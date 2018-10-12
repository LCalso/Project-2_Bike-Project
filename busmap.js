define([
  'moment',
  'd3',
  'd3-tip',
  'topojson'
], function(moment, d3, tooltip, topojson) {

  function BusMap(baseTopoSrc) {

    // Const Settings 
    var BUS_ICON_FONT_SIZE = 13,
        POINTER_WIDTH = 6,                      // Width of middle dividing line of equilateral triangle pointer
        POINTER_GAP = BUS_ICON_FONT_SIZE/1.7,   // Central gap for icon
        MOVE_TRANS_TIME = 1500,                 // Movement transition duration (ms)
        POPUP_TRANS_TIME = 500,                 // Appear/disappear transition duration
        FADE_TRANS_TIME = 300;                  // Fade in/out transition duration

    // Allow higher performance on Chrome
    var isChrome = /chrome/.test(navigator.userAgent.toLowerCase());
    var LIMIT_TOPO_FEATURES = isChrome?50000:3000; // Do not draw large topo feature sets for browser protection
    var SMALL_SIZE_DISPLAY = 500;     // (px) Viewports of smaller width/height will display less cluttered info

    var pointerPolygon = [
        [-POINTER_WIDTH/2, -POINTER_GAP]. join(','),
        [POINTER_WIDTH/2, -POINTER_GAP].join(','),
        [0, -POINTER_WIDTH-POINTER_GAP].join(',')
      ].join(' ');  // Triangle pointing up


    var faBusIcon = '\uf207';  // Font awesome bus icon

    var svg,
        width = 950, 
        height = 500,
        mapProjection,
        mapG,
        busesG,
        filterBuses = [],
        busTooltip,
        footerTxt;

    function myMap(elemNode, cb) {

      svg = d3.select(elemNode).append("svg")
        .attr({
          class: 'bus-map',
          width: width,
          height: height
        });

      // Add Base Map layer
      mapG = svg.append('g');

      // Add buses layer
      busesG = svg.append('g')
        .attr('class', 'buses');

      _addFooter();
      _addTooltips();

      // Load map
      d3.json(baseTopoSrc, function(error, topoData) {
        if (error) return console.error("Unable to read topojson file: " + baseTopoSrc);

        mapProjection = _setupProjection(topoData);
        _drawTopoJson(topoData);
        cb();
      });

      return myMap;
    }

    function _setupProjection(baseTopo) {
      var projection = d3.geo.mercator();

      // Derive viewport from bbox [longmin, latmin, longmax, latmax]
      var bbox = baseTopo.bbox;

      // Reverse engineer how many degrees fit in one pixel at scale 1
      projection.scale(1);
      // Calc long ratio at Greenwich (Mercator has constant long2px ratio)
      var longDegPerPx = 1/(projection([1,0])[0] - projection([0,0])[0]);
      // Calc lat ratio at given latitude
      var latDegPerPx = (bbox[3]-bbox[1])/(projection([0,bbox[1]])[1] - projection([0,bbox[3]])[1]);

      // Use ratios to scale
      projection.scale(Math.min( // Smallest scale to fit both lat and long ranges
        width/(bbox[2]-bbox[0])*longDegPerPx, // Long scale
        height/(bbox[3]-bbox[1])*latDegPerPx  // Lat scale
      ));

      // Center on bbox centroid coords
      projection.center([
        bbox[0] + (bbox[2]-bbox[0])/2,
        bbox[1] + (bbox[3]-bbox[1])/2
      ]);

      // Center viewport
      projection.translate([(width/2),(height/2)]);

      return projection;
    }

    function _drawTopoJson(baseTopo) {

      var smallSize = (Math.min(width, height)<SMALL_SIZE_DISPLAY);

      var pathMaker = d3.geo.path().projection(mapProjection);

      // Draw map layers
      drawFeatureSet('neighborhoods', 'hood');
      if (!smallSize) drawFeatureSet('streets', 'street');
      drawFeatureSet('arteries', 'artery');
      drawFeatureSet('freeways', 'freeway');
      drawLabels('neighborhoods','neighborho', 'hood-label');

      // Adjust neihborhood labels size
      d3.selectAll('.hood-label')
        .style('font-size', (smallSize?8:10) + 'px');

      //

      function drawFeatureSet(featureType, cssClass) {

        if (!baseTopo.objects.hasOwnProperty(featureType)
          || baseTopo.objects[featureType].geometries.length>LIMIT_TOPO_FEATURES) {
          return -1;
        }

        mapG.append('g').selectAll("path")
          .data(topojson.feature(baseTopo, baseTopo.objects[featureType]).features)
          .enter()
            .append('path')
              .attr("class", cssClass)
              .attr("d", pathMaker);
      }

      function drawLabels(featureType, topoProperty, cssClass) {

        if (!baseTopo.objects.hasOwnProperty(featureType)
          || baseTopo.objects[featureType].geometries.length>LIMIT_TOPO_FEATURES) {
          return -1;
        }

        mapG.append('g').selectAll("text")
          .data(topojson.feature(baseTopo, baseTopo.objects[featureType]).features
            .filter(function(d) { 
              return d.properties.hasOwnProperty(topoProperty); 
            })
          )
          .enter()
            .append('text')
              .attr("class", cssClass)
              .attr({
                x: function (d) {
                    return pathMaker.centroid(d)[0];
                },
                y: function (d) {
                    return pathMaker.centroid(d)[1];
                }
              })
              // Add polygon property stored in TopoJson
              .text(function(d) { 
                return d.properties[topoProperty]; 
              });
      }
    }

    function _addFooter() {
      footerTxt = svg.append('text')
        .attr('class', 'map-footer')
        .attr({
          x: width - 8,
          y: height - 8
        })
        .style('text-anchor', 'end');
    }

    function _updateFooter() {
      var visBuses = busesG.selectAll('.bus')
        .filter(function(d) { return !filterBuses.length || filterBuses.indexOf(d.routeTag.toUpperCase())!=-1; });
      var visRoutes = d3.set();
      visBuses.each(function (d) { visRoutes.add(d.routeTag); });

      footerTxt.text(
        'Showing ' + visBuses[0].length + ' bus' + (visBuses[0].length==1?'':'es')
        + ' serving ' + visRoutes.size() + ' route' + (visRoutes.size()==1?'':'s')
      );
    }

    function _addTooltips() {
      busTooltip = tooltip()
        .attr('class', 'bus-tooltip')
        .offset([-15,0])
        .html(
          function(d) {
            return 'Route: <strong>' + d.routeTag + '</strong>'
              + ' <small>(' + d.speedKmHr + ' km/h)</small>'
              + '<br><small>seen ' + moment(d.lastReportTime).fromNow() + '</small>';
          }
      );
      svg.call(busTooltip);
    }

    myMap.updateBusLocations = function(busData) {

      var buses = busesG.selectAll('.bus')
        .data(busData, function(d) { return d.id; }); // Index by bus ID

      // Remove buses
      buses.exit()
        .transition().duration(POPUP_TRANS_TIME/2)
          .attr('transform', function() {
            return (d3.select(this).attr('transform')||'') + ' scale(2)'; 
          })
          .transition().duration(POPUP_TRANS_TIME/2)
            .attr('transform', function() {
              return (d3.select(this).attr('transform')||'') + ' scale(0)';
            })
            .remove();

      // Update existing buses position
      buses
        .transition().duration(MOVE_TRANS_TIME)
          .attr('transform', function (d) {
            return 'translate(' + mapProjection([d.lon, d.lat]).join(',') + ')';
          });

      // Add new buses
      var newBuses = buses.enter()
        .append('g')
        .attr('class', 'bus');

      // Bus icon
      newBuses
          .append("text")
          .attr('class', 'bus-icon')
          .text(faBusIcon)
          .attr('dy', BUS_ICON_FONT_SIZE/2.7)
          .style({
            'font-family': 'FontAwesome',
            'font-size': BUS_ICON_FONT_SIZE + 'px',
            'text-anchor': 'middle',
            cursor: 'default'
          });

      // Directional arrow
      newBuses
        .append('polygon')
          .attr({
            class: 'pointer',
            points: pointerPolygon
          });

      // Animate appearance in position
      newBuses
        .attr('transform', function(d) {
            return 'translate(' + mapProjection([d.lon, d.lat]).join(',') + ') scale(0)'
        })
        // Wait until it reaches position
        .transition().duration(POPUP_TRANS_TIME/2)
          .attr('transform', function(d) {
            return 'translate(' + mapProjection([d.lon, d.lat]).join(',') + ') scale(2)'
          })
          .transition().duration(POPUP_TRANS_TIME/2)
            .attr('transform', function(d) {
              return 'translate(' + mapProjection([d.lon, d.lat]).join(',') + ') scale(1)'
            });

      // Hide filtered out buses
      if (filterBuses.length) {
        newBuses.filter(function(d) {
          return filterBuses.indexOf(d.routeTag.toUpperCase())==-1;
        })
        .attr('visibility','hidden');
      }



      // Direct & show/hide arrow
      buses.select('.pointer')
        .transition().duration(MOVE_TRANS_TIME)
            .attr({
              visibility: function(d) { return (d.heading<0 || d.speedKmHr==0)?'hidden':null; },
              transform: function(d) { return 'rotate(' + d.heading +')'; }
            });

      // Add hover interaction
      newBuses.on('mouseover', function() {
        d3.select(this)
          // Attach original opacity
          .property('origOpacity', function() { return d3.select(this).style('fill-opacity'); } )
          .transition().duration(100)
            .attr('transform', function() { 
              return d3.select(this).attr('transform').replace(/scale(.*)/, '') + ' scale(1.8)';
            })
            .style('fill-opacity', 1);
      });

      newBuses.on('mouseout', function() {
        d3.select(this)
          .transition().duration(400)
            .attr('transform', function() { 
              return d3.select(this).attr('transform').replace(/scale(.*)/, '');
            })
            .style('fill-opacity', function() { return this.origOpacity; })
            .each("end", function() { 
              // Dettach property
              d3.select(this).property('origOpacity', null);
            })
      });

      // Add tooltips
      newBuses.on('mouseover.tooltip', busTooltip.show);
      newBuses.on('mouseout.tooltip', busTooltip.hide);

      _updateFooter();

      return myMap;

      //

      // Clockwise from horizontal, right pointing
      function calcLineAngle(x1,y1,x2,y2) {
        return Math.atan(((y2-y1)/(x2-x1)))*180/Math.PI + (x2<x1?180:(y2<y1?360:0));
      }

      // Straight line distance between two points
      function calcDist(x1,y1,x2,y2) {
        return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
      }
    };

    myMap.filterBuses = function(routeTags) {

      if (routeTags==null) return filterBuses;
      filterBuses = routeTags;

      busesG.selectAll('.bus')
        // Select buses to toggle
        .filter(function (d) {
          var passesFilter = !routeTags.length || routeTags.indexOf(d.routeTag.toUpperCase())!=-1;
          return (d3.select(this).attr('visibility')==null) != passesFilter;
        })
        .each(toggleFade);
        

      function toggleFade() {

        var elem = d3.select(this);
        var out = elem.attr('visibility')==null || elem.attr('visibility')=='visible';

        elem
          .style({
            'fill-opacity': out?null:0
          })
          .attr('visibility', null)
            // Fade
            .transition().duration(FADE_TRANS_TIME)
            .style({
              'fill-opacity': out?0:0.7
            })
            // Reset original opacity and set visibility
            .transition().duration(0)
              .style({
                'fill-opacity': null
              })
              .attr('visibility', out?'hidden':null);
      }

      _updateFooter();

      return myMap;
    };

    myMap.addImg = function(imgSrc, lat, long, width, height) {
      var xy = mapProjection([long, lat]);
      svg.insert('image', '.buses')
        .attr({
          'xlink:href': imgSrc,
          width: width,
          height: height,
          x: xy[0] - width/2,
          y: xy[1] - height/2
        });
    };

    // Getters/setters

    myMap.width = function(_) {
      if (_==null) return width;
      width = _;
      return myMap;
    };

    myMap.height = function(_) {
      if (_==null) return height;
      height = _;
      return myMap;
    };

    return myMap;

  }

  return BusMap;
});
nextbus-service.js#
angular.module('BusesApp').factory('NextbusService', function($http) {

  var apiUrl = '//webservices.nextbus.com/service/publicJSONFeed';

  var myMethods = {};

  // Pulls bus locations. agencyTag mandatory. routeTag and lastTime optional.
  myMethods.getVehicleLocs = function(cb, agencyTag, routeTag, lastTime) {

    lastTime = lastTime || 0; // Last 15 min default

    var params = {
      a: agencyTag,
      command: 'vehicleLocations',
      t: lastTime
    };

    if (routeTag) params.r = routeTag;
    if (lastTime) params.t = lastTime;

    var reqTime = new Date();

    _getData(params, function(data){
      cb(data.vehicle.map(function (busData) {

        // Compute report time
        busData.lastReportTime = new Date(reqTime-busData.secsSinceReport*1000);

        return busData;
      }));
    });

    return myMethods;
  };

  myMethods.apiUrl = function(_) {
    if(_==null) return apiUrl;
    apiUrl = _;
    return myMethods;
  };

  function _getData(getParams, cb) {

    var getParamsStr = (Object.keys(getParams).length?'?':'') +
      Object.keys(getParams).map(function(key) {
        return [key, getParams[key]].join('=');
      }).join('&');

    $http.get(apiUrl + getParamsStr)
      .then(function(res) { return res.data; })
      .then(cb);
  }

  return myMethods;

});
require-config.js#
require.config({
  paths: {
    jquery: "//cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min",
    bootstrap: "//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min",
    d3: "//cdnjs.cloudflare.com/ajax/libs/d3/3.4.13/d3.min",
    'd3-tip': "//cdnjs.cloudflare.com/ajax/libs/d3-tip/0.7.1/d3-tip.min",
    topojson: "//cdnjs.cloudflare.com/ajax/libs/topojson/2.2.0/topojson.min",
    moment: "//cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment"
  },
  shim: {
    bootstrap: ['jquery']
  }
});
sf-bus-directive.js#
angular.module('BusesApp').directive('sfBus', function(NextbusService) {
	return {
		restrict: 'E',
		scope: {},  // Isolate scope
		templateUrl: 'sf-bus.tpl.html',
		controller: function ($scope, $interval) {
			$scope.dataSelfUpdateInterval = 5000; // ms
			$scope.topo = 'sf.topo.json'; // SF base map

			$scope.busData = [];
			$scope.filteredBuses = [];

			// Pull bus data periodically
			$interval(function thisFunction() {

					NextbusService.getVehicleLocs(function(data) {
							$scope.busData = data;
						},
						'sf-muni'
					);
					return thisFunction;

				}(),  // Run immediately first time
				$scope.dataSelfUpdateInterval
			);
		}
	};
});
