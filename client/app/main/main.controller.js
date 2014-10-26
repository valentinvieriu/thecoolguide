'use strict';

angular.module('thecoolguideApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];
    $scope.munichCenter = {
          lat: 48.137447477273,
          lng: 11.578306599531 ,
          zoom: 13
      };
    $scope.layers = {
            baselayers: {
                googleTerrain: {
                    name: 'Google Terrain',
                    layerType: 'TERRAIN',
                    type: 'google'
                },
                googleHybrid: {
                    name: 'Google Hybrid',
                    layerType: 'HYBRID',
                    type: 'google'
                },
                googleRoadmap: {
                    name: 'Google Streets',
                    layerType: 'ROADMAP',
                    type: 'google'
                }
            }
        };
    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    }); 

    $http.get('api/feeds/facebook')
    .then(function(fdData) {
      var responseData = fdData.data.data;
      var cleanResult = [];
      var locationIds = [];
      angular.forEach(responseData, function(fbPost, key) {
        if (fbPost.status_type && fbPost.message_tags) {
          fbPost.big_picture= fbPost.picture.replace("_s.jpg", "_n.jpg").replace("/v", "").replace(/\/\w+x\d+/, "");
          fbPost.tag = {};
          angular.forEach(fbPost.message_tags,function(mvalue,mkey){
            locationIds.push(mvalue[0].id);
            fbPost.tag[mvalue[0].id]= {
              name     :mvalue[0].name,
              location :null
            } ;
          })
          cleanResult.push(fbPost);
        };
        
      });
      return {
        fbData:cleanResult,
        locationIds:locationIds
      }
    }).then(function(result){
      // console.log(result.locationIds.length)
      var locations = [];
      angular.forEach(result.locationIds.slice(0,50),function(fbPage){
        locations.push({'method':'GET','relative_url':fbPage+'/?fields=name,location,category,category_list'});
      });
      // console.log(JSON.stringify(locations));

      $scope.fbData = result.fbData;
      // .join(',')
      return $http.post('api/feeds/facebookBatch/',{'batch':JSON.stringify(locations)});

    })
    .then(function(result){
      var mapList = {};
      // console.log(result.data);
      angular.forEach(result.data,function(item){
        var page = JSON.parse(item.body);
        // var currentItem = {};
        if (page.location && page.location.latitude && page.location.longitude) {
          mapList['marker_'+page.id] = {
              lat       :page.location.latitude,
              lng       :page.location.longitude,
              message   :page.name,
              draggable : false
            };
          // mapList.push(currentItem);
          // console.log(page.name,page.location.latitude,page.location.longitude)
        };
      });
      $scope.markers = mapList;
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
