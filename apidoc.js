/**
 * Yet Another API Documentation Tool
 * Display your API specification from JSON to HTML with AngularJS
 *
 * Copyright (C) 2014  Dennis Lodder
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 */

angular.module('apidoc',['ui.router'])
  .config(function($stateProvider){
    $stateProvider
      .state('list',{
        url: '',
        templateUrl: 'templates/list.html',
        controller: 'ListController'
      })
      .state('api',{
        url: '/:project',
        templateUrl: 'templates/apidoc.html',
        controller: 'ApiDocController'
      });
  })
  .factory('api',function($q,$http,$state) {
    return {
      get: function(){
        var deferred = $q.defer();
        $http.get('projects/'+$state.params.project+'.json?t='+new Date().getTime()).success(function(data) {
          for ( var g in data.resources ) {
            data.resources[g].id = data.resources[g].title.replace(' ','-');
            for ( var r in data.resources[g].requests ) {
              data.resources[g].requests[r].id = data.resources[g].requests[r].title.replace(' ','-');
              data.resources[g].requests[r].response = JSON.stringify(data.resources[g].requests[r].response,null,2);
            }
          }
          deferred.resolve(data);
        });
        return deferred.promise;
      }
    }
  })
  .factory('projectList', function($q,$http){
    return {
      get: function() {
        var deferred = $q.defer();
        $http.get('config.json').success( function(data){
          deferred.resolve(data.projects);
        });
        return deferred.promise;
      }
    }
  })
  .controller('ApiDocController', function($scope,api) {

    api.get().then(function(api) {
      $scope.api = api;
    });

    $scope.scrollTo = function(id) {
      var el = document.getElementById(id);
      if ( el ) {
        var top = el.getBoundingClientRect().top;
        window.scrollTo(0,top);
      }
    }
  })
  .controller('ListController', function($scope, $state, projectList) {

    projectList.get().then( function(projects) {
      $scope.projects = projects;
    });

    $scope.goTo = function(api){
      $state.transitionTo('api',{'project':api});
    }

  });