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