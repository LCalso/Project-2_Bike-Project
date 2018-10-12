angular.module('BusesApp').directive('busMap', function () {

	return {
		restrict: 'E',
		scope: {
			data: '=',           // Bus data
			filteredBuses: '=?', // Which buses to filter to
			topoFile: '@'        // Map TopoJSON file
		},
		controller: controller,
		link: link
	};

	//

	function controller($scope) {
		if (!$scope.filteredBuses) {
			$scope.filteredBuses = [];
		}
	}

	function link(scope, elem) {
		require(['busmap'], function(BusMap) {
			// Instantiate base map
			var busMap = BusMap(scope.topoFile);

			// Set dimensions
			busMap.width(elem[0].clientWidth)
				.height(elem[0].clientHeight);

			// Build map
			busMap(elem[0], function() {
				// Populate it at once
				busMap.updateBusLocations(scope.data);
				busMap.filterBuses(scope.filteredBuses);

				// Watch for data changes
				scope.$watch('data', busMap.updateBusLocations);
				scope.$watch('filteredBuses', busMap.filterBuses);
			});
		});
	}

});
