angular.module('BusesApp').directive('busFilterInput', function ($timeout) {

	return {
		restrict: 'E',
		scope: {
			filteredBuses: '=',
			typingPauseTime: '=?'
		},
		templateUrl: 'bus-filter.tpl.html',
		controller: controller
	};

	//

	function controller($scope) {
		$scope.typingPauseTime = $scope.typingPauseTime || 400; // ms

		// Wait for a typing pause before effecting changes
		var typingDebouncer = false;
		$scope.filterChange = function () {
			if (typingDebouncer !== false) {
				$timeout.cancel(typingDebouncer);
			}
			typingDebouncer = $timeout(
				function () {
					// Parse input text
					$scope.filteredBuses = $scope.filterTxt
						.split(',')
						.map(function (busStr) {
							return busStr.trim().toUpperCase();
						})
						.filter(function (busStr) {
							return busStr.length;
						});
				},
				$scope.typingPauseTime
			);
		}
	}
});
