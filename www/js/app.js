'use strict';

/* VMA App Module */
angular.module('volunteerManagementApp', [
    'vmaControllerModule',
    'databaseServicesModule',
    'vmaServicesModule',
    'vmaDirectiveModule',
    'vmaFilterModule',
    'ngCsvImport',
    'restangular',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.datetimepicker',
    'ngNotify',
    'highcharts-ng',
    'adaptive.googlemaps',
    'checklist-model',
    "isteven-multi-select"
]).

config(function ($stateProvider, $urlRouterProvider, $compileProvider) {
    $urlRouterProvider.otherwise("/homePage");
    $stateProvider.
    state('home', {
        views: {
            "app": {templateUrl: "partials/home.html"},
            "header@": {templateUrl: "partials/header.html"},
            "bottomMenu": {templateUrl: "partials/bottomMenu.html", controller: "menuCtrl"}
        },
        authenticate: true
    }).
    state('login', {
        url: "/login",
        views: {
            "app": {templateUrl: "partials/login.html", controller: 'loginCtrl'}
        },
        authenticate: false
    }).
    state('register', {
        url: "/register",
        views: {
            "app": {templateUrl: "partials/register.html", controller: 'registerCtrl'}
        },
        authenticate: false
    }).
    state('home.availableClasses', {
        url: "/avClasses",
        views: {
            "app": {templateUrl: "partials/availableClasses.html", controller: 'taskController'}
        },
        authenticate: true
    }).
    state('home.myGroups', {
        cache: false,
        url: "/myGroups",
        views: {
            "app": {templateUrl: "partials/myGroups.html", controller: 'groupController'}
        },
        authenticate: true
    }).
    state('home.group', {
        url: "/group/:id",
        views: {
            "app": {templateUrl: "partials/efforts.group.html", controller: 'groupController'}
        },
        resolve: {
            group: function (vmaGroupService, $stateParams) {
                return vmaGroupService.getGroupMeta($stateParams.id).then(function (success) {
                    $stateParams.group = success;
                });
            }
        },
        authenticate: true
    }).
    state('home.group.tasks', {
        url: "/tasks",
        views: {
            "app@home": {templateUrl: "partials/groupFeed.task.html", controller: 'taskController'}
        },
        authenticate: true
    }).
    state('home.task', {
        url: "/taskview/:task",
        views: {
            "app": {templateUrl: "partials/viewTask.html", controller: 'task'}
        },
        resolve: {
            task: function (vmaTaskService, $stateParams) {
                return vmaTaskService.updateTasks().then(function () {
                    return vmaTaskService.getTaskView($stateParams.task).then(function (success) {
                        return success;
                    });
                });
            }
        },
        authenticate: true
    }).
    state('home.myTasks', {
        url: "/myTasks",
        views: {
            "app": {templateUrl: "partials/myTasks.html", controller: 'taskController'}
        },
        authenticate: true
    }).
    state('home.calendar', {
        url: "/calendar",
        views: {
            "app": {templateUrl: "partials/calendar.html", controller: "calendar"}
        },
        authenticate: true
    }).
    state('home.intro', {
        url: "/intro",
        views: {
            "app": {templateUrl: "partials/intro.html", controller: "intro"}
        },
        authenticate: true
    }).
    state('home.hours', {
        cache: false,
        url: "/hours",
        views: {
            "app": {templateUrl: "partials/hours.myHours.html", controller: "hoursController"}
        },
        authenticate: true
    }).
    state('home.myHours', {
        url: "/addCertificate",
        views: {
            "app": {templateUrl: "partials/addCertificate.html", controller: "hoursController"}
        },
        authenticate: true
    }).
    state('home.homePage', {
        url: "/homePage",
        views: {
            "app": {templateUrl: "partials/homePage.html", controller: "homeCtrl"}
        },
        resolve: {
            groups: function (vmaGroupService) {
                vmaGroupService.updateGroups(true);
            }
        },
        authenticate: true
    });
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|geo|maps):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
}).

run(function (Restangular, $rootScope, Auth, $q, $state, vmaUserService, ngNotify) {
    Restangular.setBaseUrl("https://hnetdev.hnet.uh.edu:8443/CHWApp/");
    //Restangular.setBaseUrl("https://hnetdev.hnet.uh.edu:8443/CombinedBackend/");
    //Restangular.setDefaultHeaders({"X-TenantId": "tenantCHW"});

    //TO ACCESS RESTANGULAR IN CONTROLLERS WITHOUT INJECTION - THIS SHOULD BE REMOVED, NOT GOOD PRACTICE
    $rootScope.Restangular = function () {
        return Restangular;
    };

    //CHECKING IF AUTHENTICATED ON STATE CHANGE - Called in $stateChangeStart
    $rootScope.isAuthenticated = function (authenticate) {
        if (!Auth.hasCredentials()) {
            $rootScope.isGuest = true;
            Auth.setCredentials("Guest", "21d7dcf66c3e4ad8daf654c8732791453a79408d312396dc25ec90453597f5bdf7dca5ac87b8c22c140d6b4dd17753bd2640b517d486d34d9e52d1a444560a93");
            Auth.confirmCredentials();
        }
        vmaUserService.getMyUser().then(function (result) {
            result = Restangular.stripRestangular(result)[0];
            //USERNAME & ID TO BE USED IN CONTROLLERS
            $rootScope.uid = result.id.toString();
            $rootScope.uin = result.username.toString();
            $rootScope.isGuest = (result.username.toString() == "Guest");
        });
        vmaUserService.getMyRole().then(function (success) {
            $rootScope.role = success;
            $rootScope.isMod = (success == "ROLE_MODERATOR");
            $rootScope.isAdm = (success == "ROLE_ADMIN");
        }, function (error) {
            if (error.status === 0) { // NO NETWORK CONNECTION OR SERVER DOWN, WE WILL NOT LOG THEM OUT
                ngNotify.set("Internet or Server Unavailable", {type: "error", sticky: true});
            } else { //Most Likely a 403 - LOG THEM OUT
                Auth.clearCredentials();
                if (authenticate) {
                    $state.go("login");
                    //location.reload();
                }
            }
        });
        return Auth.hasCredentials();
    };

    $rootScope.badgeConfig = [
        "Advocacy",
        "Capacity Building",
        "Communication Skills",
        "Community Service",
        "Coordination",
        "Interpersonal Communication",
        "Knowledge Base",
        "Organizational",
        "Service Coordination",
        "Skills",
        "Teaching Skills"
    ];
    $rootScope.goToLink = function (url) {
        window.open(url, "_system");
    };

    //AUTHENTICATE ON CHANGE STATE
    $rootScope.$on("$stateChangeStart", function (event, toState) {
        $('body').removeClass('loaded');
        if (toState.authenticate && !$rootScope.isAuthenticated(toState.authenticate)) {
            // User isn’t authenticated
            $state.go("login");
            //Prevents the switching of the state
            event.preventDefault();
        }
    });
    $rootScope.$on("$stateChangeSuccess", function () {
        $('body').addClass('loaded');
    });
    $rootScope.$on("$stateChangeError", function () {
        $('body').addClass('loaded');
    });
});
