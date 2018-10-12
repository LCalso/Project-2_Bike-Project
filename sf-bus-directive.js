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