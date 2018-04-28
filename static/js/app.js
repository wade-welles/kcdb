var app = angular.module('kcdb', ['ui.materialize', 'angularMoment']);

app.controller('BodyController', ["$scope", "$rootScope", function ($scope, $rootScope) {
    $scope.page = "search";
    $scope.changePage = function(pageName){
        $scope.page = pageName;
        $rootScope.$broadcast('page-change', {page: pageName});
    };
}]);

app.controller('SourcesController', ["$scope", "$http", "$rootScope", "$interval", function ($scope, $http, $rootScope, $interval) {
    $scope.loading = false;
    $scope.sources = [];
    $scope.ingest_status = null;

    $scope.load = function(){
      $scope.loading = true;
      $http({
        method: 'GET',
        url: '/sources/all',
      }).then(function successCallback(response) {
        $scope.sources = response.data
        $scope.loadStatus();
      }, function errorCallback(response) {
        $scope.loading = false;
        $scope.error = response;
      });
    }

    $scope.loadStatus = function(){
      $scope.loading = true;
      $http({
        method: 'GET',
        url: '/ingestor/status',
      }).then(function successCallback(response) {
        $scope.ingest_status = response.data
        $scope.loading = false;
      }, function errorCallback(response) {
        $scope.loading = false;
        $scope.error = response;
      });
    }

    $scope.hasUp = function(dateStr) {
      return !dateStr.startsWith('1970-');
    }
    $scope.ingestScheduledNow = function(ds) {
      return moment().isAfter(ds);
    }
    $scope.isNext = function(uid){
      return $scope.ingest_status && $scope.ingest_status.next_sources && $scope.ingest_status.next_sources[0].uid == uid;
    }


    $rootScope.$on('page-change', function(event, args) {
      if (args.page == 'sources'){
        if (!$scope.ingest_status) {
          $scope.updater = $interval($scope.loadStatus, 23 * 1000);
        }
        $scope.load();
      } else {
        if ($scope.updater) {
          $interval.cancel($scope.updater);
          $scope.updater =  null;
        }
      }
    });
}]);


app.controller('SearchController', ["$scope", "$http", "$rootScope", "$interval", function ($scope, $http, $rootScope, $interval) {
    $scope.loading = false;
    $scope.results = [];
    $scope.searchQ = '';

    $scope.search = function(query){
      $scope.loading = true;
      $scope.error = null;
      $http({
        method: 'POST',
        url: '/search/all',
        data: {query: $scope.searchQ},
      }).then(function successCallback(response) {
        $scope.results = response.data;
        $scope.loading = false;
      }, function errorCallback(response) {
        $scope.loading = false;
        $scope.error = response;
      });
    }



    // error info helpers.
    $scope.ec = function(){
      if (!$scope.error)return null;
      if ($scope.error.success === false)
        return 'N/A';
      return $scope.error.status;
    }
    $scope.exp = function(){
      if (!$scope.error)return null;
      if ($scope.error.status === -1)
        return "Network Error or server offline";
      if ($scope.error.success === false)
        return 'The server encountered a problem handling the request';
      return $scope.error.statusText;
    }
}]);
