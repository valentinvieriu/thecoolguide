'use strict';

angular.module('thecoolguideApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    });    
    $http.get('api/feeds/facebook').success(function(fdData) {
      var cleanResult = [];
      angular.forEach(fdData.data, function(value, key) {
        if (value.status_type && value.message_tags) {
          value.big_picture= value.picture.replace("_s.jpg", "_n.jpg").replace("/v", "").replace(/\/\w+x\d+/, "");
          cleanResult.push(value);
        };
        
      });
      $scope.fbData = cleanResult;
    });



    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      $scope.newThing = '';
    };

    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });
  });
