'use strict';

angular.module('thecoolguideApp')
  .controller('MainCtrl', function ($scope, $http, $q, socket) {
    $scope.awesomeThings = [];
    $scope.munichCenter = {
          lat: 48.137447477273,
          lng: 11.578306599531 ,
          zoom: 13
      };
      var naturalEarth = L.tileLayer('http://{s}.tiles.mapbox.com/v3/mapbox.natural-earth-2/{z}/{x}/{y}.png');
      //xyz,mapbox,geoJSON,utfGrid,cartodbTiles,cartodbUTFGrid,cartodbInteractive,wms,wmts,wfs,group,featureGroup,google,china,ags,dynamic,markercluster,bing,heatmap,yandex,imageOverlay,custom,cartodb

    $scope.layers = {
            baselayers: {
              mapbox: {
                  name: 'Mapbox',
                  type: 'xyz',
                  url: 'http://api.tiles.mapbox.com/v4/{mapid}/{z}/{x}/{y}.png?access_token={apikey}',
                  layerParams: {
                      apikey: 'pk.eyJ1IjoidmFsZW50aW52aWVyaXUiLCJhIjoibzRqVk02TSJ9.o80Jz3QZDUAExWNqe8xKXQ',
                      mapid: 'valentinvieriu.k2e5m77g'
                  },
                  layerOptions: {
                      subdomains: ['a', 'b', 'c'],
                      continuousWorld: true
                  }
              }, 
              cycle: {
                  name: 'OpenCycleMap',
                  type: 'xyz',
                  url: 'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png',
                  layerOptions: {
                      subdomains: ['a', 'b', 'c'],
                      attribution: '&copy; <a href="http://www.opencyclemap.org/copyright">OpenCycleMap</a> contributors - &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                      continuousWorld: true
                  }
              },
              osm: {
                  name: 'OpenStreetMap',
                  type: 'xyz',
                  url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  layerOptions: {
                      subdomains: ['a', 'b', 'c'],
                      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                      continuousWorld: true
                  }
              }
            }
        };
    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    }); 

    $http.get('api/feeds/facebook')
    
    .then(function(fdData) { //we get the latest feeds and hide the junk ones
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

      $scope.fbData = cleanResult;

      return {
        fbData:cleanResult,
        locationIds:locationIds
      }
    })

    .then(function(result){ //We process the locations for the remaining ones.We need to batch process 50 requests for FB
      var locations      = [];
      var countLocations = result.locationIds.length;
      var qRequests      = [];

      for (var i =  0; i <= Math.floor(countLocations/50); i++) {
        locations = [];
        angular.forEach(result.locationIds.slice(i*50,(i+1)*50) ,function(fbPage){
          locations.push({'method':'GET','relative_url':fbPage+'/?fields=name,location,category,category_list,cover'});
        });

        qRequests.push($http.post('api/feeds/facebookBatch/',{'batch':JSON.stringify(locations)}));
      };


      return $q.all(qRequests);

    })


    .then(function(results){ //we merge the responses into one
      var mergedResults = [];

      angular.forEach(results,function(resultsItem){
        mergedResults = mergedResults.concat(resultsItem.data);
      });

      return mergedResults;

    })


    .then(function(result){
      var mapList = {};

      angular.forEach(result,function(item){
        var page = JSON.parse(item.body);

        if (page.location && page.location.latitude && page.location.longitude) {
          var allCategories = [];
          angular.forEach(page.category_list,function(categodyList){
            allCategories.push(categodyList.name);
          });

          mapList['marker_'+page.id] = {
              group     : 'munich',
              lat       : page.location.latitude,
              lng       : page.location.longitude,
              message   : ( ( (page.cover && page.cover.source) ? '<img src="'+page.cover.source+'" width="130" />': '' ) + '<h4>'+page.name+'</h4><p>'+allCategories.join(', ')+'</p>' ),
              draggable : false
            };

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
