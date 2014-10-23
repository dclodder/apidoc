/**
 * Yet Another API Documentation Tool
 * https://github.com/dclodder/apidoc
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
  .factory('storage', function($window) {
    return {
      put: function(key,value) {
        return $window.localStorage.setItem(key,JSON.stringify(value));
      },
      get: function(key) {
        try {
          return JSON.parse($window.localStorage.getItem(key));
        } catch (e) {
          return null;
        }
      },
      delete: function(key){
        this.put(key, null);
      },
      clear: function() {
        $window.localStorage.clear();
      }
    }
  })
  .factory('api',function($q,$http,$state,projectList) {

    function processApiData(data) {
      for ( var g in data.resources ) {
        data.resources[g].id = data.resources[g].title.replace(' ','-');
        for ( var r in data.resources[g].requests ) {
          data.resources[g].requests[r].id = data.resources[g].requests[r].title.replace(' ','-');
          data.resources[g].requests[r].response = JSON.stringify(data.resources[g].requests[r].response,null,2);
        }
      }
      return data;
    }

    return {

      get: function(){
        var deferred = $q.defer();
        projectList.get($state.params.project).then(
          function(project){
            $http.get(project.file + '?t='+new Date().getTime())
              .success(function(data) {
                var apidoc = processApiData(data);
                deferred.resolve(apidoc);
              })
              .error( function() {
                deferred.reject('file not found');
              });
          },
          function (msg) {
            deferred.reject(msg);
          }
        );
        return deferred.promise;
      }

    }
  })
  .factory('projectList', function($q,$http,storage){
    return {
      getAll: function() {
        var deferred = $q.defer();
        var projectList = storage.get('projectList');
        if ( projectList ) {
          deferred.resolve(projectList);
        } else {
          $http.get('config.json').success( function(data){
            projectList = {};
            for ( var i in data.projects ) {
              var project = data.projects[i];
              projectList[project.url] = project;
            }
            storage.put('projectList',projectList);
            deferred.resolve(projectList);
          });
        }
        return deferred.promise;
      },
      reset: function(){
        storage.delete('projectList');
      },
      get: function(key) {
        var deferred = $q.defer();
        this.getAll().then( function(projects){
          if ( projects[key] ) {
            deferred.resolve(projects[key]);
          } else {
            deferred.reject('unknown project');
          }
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

    projectList.reset();
    projectList.getAll().then( function(projects) {
      $scope.projects = projects;
    });

    $scope.goTo = function(api){
      $state.transitionTo('api',{'project':api});
    }

  });