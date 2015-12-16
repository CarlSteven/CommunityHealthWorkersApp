'use strict';
/* VMA Controllers Module */
var vmaControllerModule = angular.module('vmaControllerModule', []);

vmaControllerModule.controller('loginCtrl', function ($scope, Auth, $state, ngNotify, $timeout, vmaGroupService) {
    if ($scope.isAuthenticated() === true && !$scope.isGuest) {
        //IF SUCCESSFULLY AUTH-ED USER IS TRYING TO GO TO LOGIN PAGE => SEND TO HOME PAGE OF APP
        $state.go('home.homePage');
    }
    $scope.salt = "nfp89gpe"; //PENDING - NEED TO GET ACTUAL SALT
    $scope.submit = function () {
        if ($scope.userName && $scope.passWord) {
            document.activeElement.blur();
            $scope.passWordHashed = String(CryptoJS.SHA512($scope.passWord + $scope.userName + $scope.salt));
            Auth.clearCredentials();
            Auth.setCredentials($scope.userName, $scope.passWordHashed);
            vmaGroupService.clear();
            $scope.userName = '';
            $scope.passWord = '';
            $scope.loginResultPromise = $scope.Restangular().all("users").all("myUser").getList();
            $scope.success = false;
            $scope.loginResultPromise.then(function (result) {
                $scope.loginResult = result;
                $scope.loginMsg = "You have logged in successfully!";
                Auth.confirmCredentials();
                $state.go("home.homePage", {}, {reload: true});
                ngNotify.set($scope.loginMsg, 'success');
                $scope.success = true;
            }, function (error) {
                $scope.loginMsg = "Incorrect username or password.";
                ngNotify.set($scope.loginMsg, {position: 'top', type: 'error'});
                Auth.clearCredentials();
                $scope.success = true;
            });
            $timeout(function () {
                if (!$scope.success) {
                    $scope.loginMsg = "Incorrect username or password.";
                    ngNotify.set($scope.loginMsg, {position: 'top', type: 'error'});
                    Auth.clearCredentials();
                } else {
                    //$scope.loginMsg = "Not doing it.";
                    //ngNotify.set($scope.loginMsg, {position: 'top', type: 'error'});
                }
            }, 10000)
        } else {
            $scope.loginMsg = "Please enter a username and password.";
            ngNotify.set($scope.loginMsg, {position: 'top', type: 'error'});
        }
    };
});

vmaControllerModule.controller('registerCtrl', function ($scope, $state, Auth, ngNotify) {
    $scope.registerUser = function () {
        if (!$scope.register || !$scope.password || !$scope.confirm) {
            ngNotify.set("Please fill out all fields!", {position: 'top', type: 'error'});
        } else if ($scope.register.username === "" || $scope.register.username === undefined) {
            ngNotify.set("Username is required!", {position: 'top', type: 'error'});
        } else if ($scope.password.password === "" || $scope.password.password === undefined) {
            ngNotify.set("Password is required!", {position: 'top', type: 'error'});
        } else if ($scope.confirm.password === "" || $scope.confirm.password === undefined) {
            ngNotify.set("Please enter password confirmation!", {position: 'top', type: 'error'});
        } else if ($scope.password.password !== $scope.confirm.password) {
            ngNotify.set("Passwords must match!", {position: 'top', type: 'error'});
        } else {
            Auth.setCredentials("Visitor", "test");
            $scope.salt = "nfp89gpe";
            $scope.register.password = String(CryptoJS.SHA512($scope.password.password + $scope.register.username + $scope.salt));
            $scope.$parent.Restangular().all("users").post($scope.register).then(
                function () {
                    Auth.clearCredentials();
                    Auth.setCredentials($scope.register.username, $scope.register.password);
                    Auth.confirmCredentials();
                    ngNotify.set("User account created!", {position: 'top', type: 'success'});
                    $state.go("home.availableClasses", {}, {reload: true});
                }, function (fail) {
                    Auth.clearCredentials();
                    ngNotify.set(fail.data.message, {position: 'top', type: 'error'});
                });
            Auth.clearCredentials();
        }
    }
});

vmaControllerModule.controller('settings', function ($scope, $state, Auth) {
    //OPENING THE MODAL TO LOG OUT A USER
    $scope.logOutUser = function (id) {
        $scope.openLogOut(id);
    };
    $scope.openLogOut = function () {
        bootbox.confirm("Are you sure you would like to log out?", function (result) {
            if (result) $scope.out();
        });
    };
    $scope.out = function () {
        Auth.clearCredentials();
        $state.go("home.homePage", {}, {reload: true});
    }
});

vmaControllerModule.controller('groupController', function ($scope, $state, vmaGroupService, $timeout, ngNotify, $rootScope, vmaTaskService, $stateParams, $filter, $modal) {
    var state = $state.current.name;
    switch (state) {
        case "home.myGroups":
            $scope.update = function (update) {
                vmaGroupService.getMetaGroups(update).then(function (success) {
                    $scope.groups = success;
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };
            break;
        case "home.group":
            $scope.id = $stateParams.id;
            $scope.update = function (update) {
                vmaGroupService.getGroupMeta($scope.id, update).then(function (success) {
                    $scope.group = success;
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };
            $scope.group = $stateParams.group;
            $scope.map = {
                sensor: true,
                size: '800x500',
                zoom: 10,
                center: $scope.group.address,
                markers: [$scope.group.address], //marker locations
                mapevents: {redirect: true, loadmap: false}
            };
            break;
        default:
            $scope.update = function () {
            };
            console.log("ERROR: UNCAUGHT STATE: ", state);
            return true;
    }
    $scope.updateGroups = $scope.update;
    $scope.update(true);

    //OPENING MODAL TO ADD A GROUP
    $scope.addGroup = function () {
        $scope.openAdd();
    };
    $scope.openAdd = function () {
        $scope.addController = function ($scope, vmaGroupService, $modalInstance) {
            $scope.ok = function () {
                var promise = vmaGroupService.addGroup($scope.newGroup);
                promise.then(function () {
                    ngNotify.set("Center created successfully!", 'success');
                    $modalInstance.dismiss('done');
                }, function (fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('done');
            }
        };
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'partials/addGroup.html',
            controller: $scope.addController,
            size: 'lg'
        });
        modalInstance.result.then(function () {
            $scope.updateGroups(true);
        }, function () {
            $scope.updateGroups(true);
        })
    };

    //OPENING THE MODAL TO DELETE A GROUP
    $scope.deleteGroup = function (id) {
        $scope.openDelete(id);
    };
    $scope.openDelete = function (id) {
        bootbox.confirm('Delete Center', function (ret) {
            if (ret) {
                var promise = vmaGroupService.deleteGroup(id);
                promise.then(function () {
                    $scope.updateGroups();
                    ngNotify.set("Center deleted successfully!", 'success');
                }, function (fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            }
        });
    };

    //OPENING THE MODAL TO EDIT A GROUP
    $scope.editGroup = function (id) {
        $scope.openEdit(id);
    };
    $scope.openEdit = function (id) {
        $scope.editController = function ($scope, vmaGroupService, $modalInstance) {
            vmaGroupService.getGroup(id).then(function (success) {
                $scope.editGroupNew = angular.copy(success);
            });
            $scope.ok = function () {
                var promise = vmaGroupService.editGroup(id, $scope.editGroupNew);
                promise.then(function () {
                    ngNotify.set("Center edited successfully!", 'success');
                    $modalInstance.dismiss('done');
                }, function (fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            };
            $scope.cancel = function () {
                $modalInstance.dismiss();
            }
        };
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'partials/editGroup.html',
            controller: $scope.editController,
            size: 'lg'
        });
        modalInstance.result.then(function () {
            $scope.updateGroups(true);
        }, function () {
            $scope.updateGroups(true);
        })
    };


    //JOINING A GROUP
    $scope.joinGroup = function (id) {
        var jProm = vmaGroupService.joinGroup(id, $scope.uid);
        jProm.then(function (success) {
            $scope.updateGroups();
            ngNotify.set("Center joined successfully!", 'success');
        }, function (fail) {
            ngNotify.set(fail.data.message, 'error');
        });
    };

    //VIEW POSTS
    $scope.viewPost = function (pid) {
        $state.go("home.group.posts.comments", {"post_id": pid}, [{reload: false}]);
    };

    //VIEW GROUP
    $scope.viewGroup = function (gid) {
        $state.go("home.group", {"id": gid});
    };

    //PERMISSIONS
    $scope.generateActions = function (id) {
        var actionObj = $filter('getById')($scope.groups, id);
        var ionicActionArray = [];
        if (actionObj.isManager || $scope.isAdm || $scope.isMod) {
            ionicActionArray.push(
                {text: 'Edit'},
                {text: 'Delete'}
            );
        } else if (actionObj.isMember) {
            //ionicActionArray.push(
            //    { text: 'Leave' }
            //);
        } else {
            //ionicActionArray.push(
            //    { text: 'Join' }
            //);
        }
        return ionicActionArray;
    };

    //PERMISSION SHOW CHECK
    $scope.actionCount = function (id) {
        return $scope.generateActions(id).length > 0;
    };

    //ACTION SHEET
    $scope.showActions = function (id, event0) {
        $scope.popOverStyle = {width: '150px', height: $scope.ionicActions.length * 55 + "px"};
        $scope.popover.show(event0);
        $scope.click = function (action) {
            $scope.popOverClick(action, id);
        }
    };

    $scope.popOverClick = function (action, id) {
        switch (action) {
            case "Edit":
                $scope.editGroup(id);
                break;
            case "Delete":
                $scope.deleteGroup(id);
                break;
            case "Leave":
                $scope.leaveGroup(id);
                break;
            default:
                return true;
        }
        return true;
    };
});

vmaControllerModule.controller('taskController', function ($scope, $state, vmaGroupService, $timeout, ngNotify, $rootScope, vmaTaskService, $stateParams, $filter, $modal) {
    $scope.getItemHeight = function () {
        return 150;
    };

    $scope.openfilterPopover = function ($event) {
        //$scope.filterpopover.show($event);
    };

    $scope.badgeMultiSelect = [];
    $scope.badgeConfig.forEach(function (badge) {
        $scope.badgeMultiSelect.push({name: badge, ticked: true});
    });
    $scope.$watch('output', function () {
        $scope.indexCoresInput = $filter('convertToIndex')($scope.output, $scope.badgeConfig);
    });

    var state = $state.current.name;
    switch (state) {
        case "home.myTasks":
            $scope.updateTasks = function (refresh) {
                return vmaTaskService.getJoinTasks(refresh).then(function (success) {
                    $scope.tasks = success;
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };
            break;
        case "home.group":
            $scope.updateTasks = function (update) {
                return vmaTaskService.getAllTasksGroup($scope.id, update).then(function (success) {
                    $scope.tasks = success;
                    var tasks_temp = $scope.tasks;
                    $scope.tasks = [];
                    tasks_temp.forEach(function (task) {
                        if (!task.finished || task.finished != 1) $scope.tasks.push(task);
                    });
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };
            break;
        case "home.group.tasks":
            $scope.id = $stateParams.id;
            $scope.updateTasks = function (update) {
                vmaGroupService.getGroupMeta($scope.id).then(function (success) {
                    $scope.isMod = success.isManager;
                });
                return vmaTaskService.getMetaTasksGroup($scope.id, update).then(function (success) {
                    $scope.tasks = success;
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };
            break;
        case "home.availableClasses":
            $scope.id = $stateParams.id;
            $scope.updateTasks = function (update) {
                return vmaTaskService.getMetaTasks(update).then(function (success) {
                    success.forEach(function (s) {
                        vmaGroupService.getGroup(s.location_id).then(function (success) {
                            s.group = success;
                        });
                        vmaGroupService.isManager(s.group_id).then(function (s) {
                            $scope.isMan = s;
                        });
                    });
                    $scope.tasks = success;
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };
            break;
        default:
            $scope.update = $scope.updateTasks = function () {
            };
            console.log("ERROR: UNCAUGHT STATE: ", state);
            break;
    }
    $scope.updateTasks(true);

    //VIEW A TASK
    $scope.viewTask = function (click_id) {
        vmaTaskService.getTaskView(click_id).then(function () {
            $state.go("home.task", {"task": click_id});
        });
    };
    //VIEW MESSAGES
    $scope.displayMessages = function (click_id) {
        $state.go('home.message', {id: click_id}, {reload: false});
    };

    //OPENING THE MODAL TO ADD A TASK
    $scope.addTask = function () {
        $scope.openAdd();
    };
    $scope.openAdd = function () {
        $scope.addController = function ($scope, vmaTaskService, $modalInstance, location_id) {
            $scope.newTask = {};
            $scope.badgeOptions = $scope.badgeConfig;
            $scope.ok = function () {
                $scope.newTask.location_id = location_id;
                var promise = vmaTaskService.addTask($scope.newTask);
                promise.then(function () {
                    ngNotify.set("Class added successfully", "success");
                    $modalInstance.dismiss('done');
                }, function (fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('done');
            }
        };
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'partials/addTask.html',
            controller: $scope.addController,
            size: 'lg',
            resolve: {
                location_id: function () {
                    return $scope.id;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.updateTasks(true);
        }, function () {
            $scope.updateTasks(true);
        })
    };

    //OPENING THE MODAL TO ADD A TASK VIA CSV
    $scope.addTaskCSV = function () {
        $scope.openAddCSV();
    };
    $scope.openAddCSV = function () {
        $scope.addCSVController = function ($scope, vmaTaskService, $modalInstance, location_id) {
            $scope.ok = function () {
                var promise = vmaTaskService.addTaskList($scope.csv.result, location_id, $scope.badgeConfig);
                promise.then(function (success) {
                    ngNotify.set("Class CSV uploaded successfully", "success");
                    $modalInstance.dismiss('done');
                }, function (fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('done');
            }
        };
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'partials/addClassCSV.html',
            controller: $scope.addCSVController,
            size: 'lg',
            resolve: {
                location_id: function () {
                    return $scope.id;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.updateTasks(true);
        }, function () {
            $scope.updateTasks(true);
        })
    };

    //OPENING THE MODAL TO EDIT A TASK
    $scope.editTaskFunction = function (task_id) {
        $scope.openEdit(task_id);
    };
    $scope.openEdit = function (task_id) {
        $scope.editController = function ($scope, vmaTaskService, $modalInstance, task_id) {
            vmaTaskService.getTaskPure(task_id).then(function (success) {
                $scope.editTask = success;
                if ($scope.editTask.time)
                    $scope.editTask.time = new Date($scope.editTask.time);
                else
                    $scope.editTask.time = null;
            });
            $scope.badgeOptions = $scope.badgeConfig;
            $scope.ok = function () {
                var promise = vmaTaskService.editTask(task_id, $scope.editTask);
                promise.then(function () {
                    ngNotify.set("Class edited successfully", "success");
                    $modalInstance.dismiss('done');
                }, function (fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            };
            $scope.duplicate = function () {
                $scope.editTask.id = null;
                var promise = vmaTaskService.addTask($scope.editTask);
                promise.then(function () {
                    ngNotify.set("Class duplicated successfully", "success");
                    $modalInstance.dismiss('done');
                }, function (fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('done');
            }
        };
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'partials/editTask.html',
            controller: $scope.editController,
            size: 'lg',
            resolve: {
                task_id: function () {
                    return task_id;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.updateTasks(true);
        }, function () {
            $scope.updateTasks(true);
        })
    };

    //OPENING THE MODAL TO DELETE A TASK
    $scope.deleteTask = function (task_id) {
        $scope.openDelete(task_id);
    };
    $scope.openDelete = function (task_id) {
        bootbox.confirm('Are you sure you want to delete this class?', function (ret) {
            if (ret) {
                var promise = vmaTaskService.deleteTask(task_id);
                promise.then(function () {
                    $scope.updateTasks(true);
                    ngNotify.set("Class deleted successfully", "success");
                }, function (fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            }
        });
    };

    //JOINING A TASK
    $scope.joinTask = function (task_id) {
        var promise = vmaTaskService.joinTask(task_id, $scope.uid);
        promise.then(function (success) {
            $scope.updateTasks(true).then(function () {
                ngNotify.set("Class added to My Wish List successfully", "success");
            });
        }, function (fail) {
            ngNotify.set(fail.data.message, 'error');
        });
    };

    //LEAVING A TASK
    $scope.leaveTask = function (task_id) {
        var promise = vmaTaskService.leaveTaskMember(task_id, $scope.uid);
        promise.then(function () {
            $scope.updateTasks(true).then(function () {
                ngNotify.set("Class Removed from My Wish List successfully", "success");
            });
        }, function (fail) {
            ngNotify.set(fail.data.message, 'error');
        });
    };

    $scope.markFinished = function (task_id) {
        vmaTaskService.markFinished(task_id).then(function () {
            ngNotify.set("Class marked complete successfully", "success");
        });
    };

    $scope.markUnFinished = function (task_id) {
        vmaTaskService.markUnFinished(task_id).then(function () {
            ngNotify.set("Class marked incomplete successfully", "success");
        });
    };

    //PERMISSIONS
    $scope.generateActions = function (id) {
        var actionObj = $filter('getById')($scope.tasks, id);
        var ionicActionArray = [];
        if (actionObj.isManager || actionObj.isGroupManager || $scope.isAdm || $scope.isMod) {
            ionicActionArray.push(
                {text: 'Edit'},
                {text: 'Delete'}
            );
        }
        return ionicActionArray;
    };

    //PERMISSION SHOW CHECK
    $scope.actionCount = function (id) {
        return ($scope.generateActions(id).length > 0);
    };

    $scope.openPopover = function ($event) {
        $scope.popover.show($event);
    };

    //ACTION POPUP
    $scope.showActions = function (id, event0) {
        $scope.ionicActions = $scope.generateActions(id);
        $scope.popOverStyle = {width: '150px', height: $scope.ionicActions.length * 55 + "px"};
        $scope.popover.show(event0);
        $scope.click = function (action) {
            $scope.popOverClick(action, id);
        }
    };

    $scope.popOverClick = function (action, id) {
        switch (action) {
            case "Edit":
                $scope.editTaskFunction(id);
                break;
            case "Delete":
                $scope.deleteTask(id);
                break;
            case "Leave":
                $scope.leaveTask(id);
                break;
            case "Join":
                $scope.joinTask(id);
                break;
            case "Complete":
                $scope.markFinished(id);
                break;
            case "Incomplete":
                $scope.markUnFinished(id);
                break;
            default:
                return true;
        }
        return true;
    };

    //VIEW GROUP
    $scope.viewGroup = function (gid) {
        $state.go("home.group", {"id": gid});
    };
});

vmaControllerModule.controller('task', function ($scope, $state, $stateParams, task) {
    $scope.task = task;

    if ($scope.task.address)
        $scope.map = {
            sensor: true,
            size: '800x500',
            zoom: 10,
            center: $scope.task.address,
            markers: [$scope.task.address], //marker locations
            mapevents: {redirect: true, loadmap: false}
        };
});

vmaControllerModule.controller('hoursController', function ($scope, $state, $stateParams, $rootScope, ngNotify, vmaTaskService, vmaHourService, $filter) {
    $scope.update = function () {
        vmaTaskService.getJoinTasks().then(function (success) {
            var tasks_temp = success;
            $scope.joinTasks = [];
            tasks_temp.forEach(function (task) {
                if (task.finished != 1) $scope.joinTasks.push(task);
            });
        });
        vmaHourService.getMyHours(100000, null, null, false).then(function (success) {
            $scope.entries = success;
        });
    };
    $scope.update();

    $scope.entry = [];
    $scope.entry.name = "Choose a class";
    $scope.ok = function () {
        if ($scope.entry.name == "Choose a class") {
            ngNotify.set("Please choose a class", "error");
        } else {
            if ($scope.entry.name != "Other") {
                var taskSelected = $filter('getByName')($scope.joinTasks, $scope.entry.name);
                $scope.hourEntry = {
                    user_id: $rootScope.uid,
                    title: $scope.entry.name,
                    start_time: $scope.entry.newDate,
                    duration: Math.ceil($scope.entry.duration),
                    task_id: taskSelected.id
                };
            } else {
                try {
                    $scope.hourEntry = {
                        user_id: $rootScope.uid,
                        title: $scope.entry.customName,
                        start_time: $scope.entry.newDate,
                        duration: Math.ceil($scope.entry.duration)
                    };
                } catch (e) {
                    console.log(e);
                    ngNotify.set("Please fill required fields", "error");
                    $scope.hourEntry = {
                        user_id: $rootScope.uid,
                        title: $scope.entry.customName,
                        duration: Math.ceil($scope.entry.duration)
                    };
                }
            }
            if (($scope.hourEntry.title && $scope.hourEntry.duration) || $scope.tmp)
                vmaHourService.addHours($scope.hourEntry).then(function (success) {
                    $scope.update();
                    $scope.entry = [];
                    $scope.entry.name = "Choose a class";
                    ngNotify.set("Successfully submitted hour entry!", "success");
                }, function () {
                    ngNotify.set("Error!", "error");
                });
            else
                ngNotify.set("Please fill required fields", "error");
        }
    };
    $scope.$watch('entry.name', function (taskName) {
        if (taskName != "Other")
            vmaTaskService.getTaskByName(taskName).then(function (success) {
                if (success) {
                    if (success.time)
                        $scope.entry.newDate = $filter('date')(success.time, "yyyy-MM-dd'T'HH:mm:ssZ");
                    if (success.duration)
                        $scope.entry.duration = success.duration;
                }
            })
    });
    $scope.deleteHour = function (h_id) {
        bootbox.confirm("Are you sure you want to delete this certificate?", function (val) {
            if (val)
                vmaHourService.deleteHour(h_id).then(function () {
                    $scope.update();
                    $scope.entry = [];
                    ngNotify.set("Successfully deleted hour entry!", "success");
                }, function () {
                    ngNotify.set("Error!", "error");
                });
        });
    };
});

vmaControllerModule.controller('calendar', function ($scope, $state, vmaTaskService, $filter) {
    //ACCESSES SERVER AND UPDATES THE LIST OF TASKS
    $scope.updateTasksAndDisplayCalendar = function () {
        vmaTaskService.getCalTasks($scope.id).then(function (success) {
            $scope.calTasks = success;
            displayFullCalendar($scope.calTasks);
        });
    };

    $scope.updateTasksAndDisplayCalendar();
});

vmaControllerModule.controller('menuCtrl', function ($scope, $state) {
    $scope.state = $state;
});

vmaControllerModule.controller('homeCtrl', function ($scope, $state) {
    $scope.state = $state;
});

vmaControllerModule.controller('about', function ($scope, $state) {
    $scope.state = $state;
});

vmaControllerModule.controller('intro', function ($rootScope, $scope, $state) {
    $rootScope.curState = $state.current.name;
    $rootScope.prevState = $rootScope.curState;
    $scope.startApp = function () {
        $state.go('home.homePage');
    };
});
