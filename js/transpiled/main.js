'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (L) {

  'use strict';

  var Map = (function () {
    function Map(opts) {
      _classCallCheck(this, Map);

      this.opts = opts;
      this.init();
    }

    // Inititalizes the map object and adds the tiles.

    _createClass(Map, [{
      key: 'init',
      value: function init() {
        this.view = L.map(this.opts.id).setView(this.opts.coords, this.opts.zoom);

        L.tileLayer(this.opts.tiles + '?access_token=' + this.opts.token, {
          attribution: this.opts.attribution,
          maxZoom: this.opts.maxZoom
        }).addTo(this.view);

        this.fetchData();
      }
    }, {
      key: 'fetchData',

      // Fetches the data and then calls the addMarkers function.
      value: function fetchData() {
        var _this = this;

        var request = new XMLHttpRequest();
        request.open('GET', location.pathname + 'data/bikestationjson.json', true);

        request.onload = function () {
          if (request.status >= 200 && request.status < 400) {
            _this.data = JSON.parse(request.responseText);
            _this.addMarkers();
          } else {
            console.error(request.responseText);
          }
        };

        request.onerror = function () {
          console.error('Failed to fetch the data');
        };

        request.send();
      }
    }, {
      key: 'addMarkers',

      // Adds markers to the map, handling styling for the icons and polygons.
      // Clusters groups of markers using Leaflet.markercluster.
      // Sets click handler for individual markers.
      value: function addMarkers() {
        var _this2 = this;

        var markers = [];
        var iconStyles = { icon: 'bicycle', prefix: 'fa', markerColor: 'black' };
        var polygonStyles = { color: '#303030', opacity: 0.9 };

        this.markers = new L.MarkerClusterGroup({ polygonOptions: polygonStyles });

        this.data.forEach(function (item) {
          var marker = L.marker([item.latitude, item.longitude], { icon: L.AwesomeMarkers.icon(iconStyles) }).bindPopup(_this2.formatPopupContent(item));

          markers.push(marker);
        });

        this.markers.addLayers(markers).addTo(this.view);
        this.markers.on('click', function () {
          this.openPopup();
        });
      }
    }, {
      key: 'formatPopupContent',

      // Builds the HTML to populate a marker's popup tooltip.
      value: function formatPopupContent(item) {
        // Eliminates weird data values.
        var name = item.name !== 'UK' ? '<div class="name">' + item.name + '</div>' : '';
        var address = item.city !== 'None' ? '<div class="address">' + item.city + '</div>' : '';

        return name + ' ' + address + '\n        <hr class="divider">\n        <div>Bike Count: <span class="number">' + item.dock_count + '</span></div>\n        ';
      }
    }]);

    return Map;
  })();

  var opts = {
    id: 'map',
    coords: [37.7577, -122.4376],
    zoom: 13,
    maxZoom: 18,
    tiles: 'http://{s}.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    token: 'pk.eyJ1IjoibmVnb21pIiwiYSI6IkRNSkNoRWMifQ.cydNn3XrNI48_36-Wwz2kw'
  };

  var sf = new Map(opts);
})(L);