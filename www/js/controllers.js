'use strict';
/* Controllers */
var vmaControllerModule = angular.module('vmaControllerModule', []);

vmaControllerModule.controller('loginCtrl', ['$scope', 'Auth', '$state', 'ngNotify', '$timeout', function($scope, Auth, $state, ngNotify, $timeout) {
     if($scope.isAuthenticated() === true) {
         //IF SUCCESSFULLY AUTH-ED USER IS TRYING TO GO TO LOGIN PAGE => SEND TO HOME PAGE OF APP
         $state.go('home');
     }
     $scope.salt = "nfp89gpe"; //PENDING - NEED TO GET ACTUAL SALT
     $scope.submit = function() {
         if ($scope.userName && $scope.passWord) {
             document.activeElement.blur();
             $timeout(function() {
                 $scope.passWordHashed = new String(CryptoJS.SHA512($scope.passWord + $scope.userName + $scope.salt));
                 Auth.setCredentials($scope.userName, $scope.passWordHashed);
                 $scope.userName = '';
                 $scope.passWord = '';
                 $scope.loginResultPromise = $scope.Restangular().all("users").all("myUser").getList();
                 $scope.loginResultPromise.then(function(result) {
                    $scope.loginResult = result;
                    $scope.loginMsg = "You have logged in successfully!";
                    Auth.confirmCredentials();
                    $state.go("home.cfeed", {}, {reload: true});
                    ngNotify.set($scope.loginMsg, 'success');
                 }, function(error) {
                    $scope.loginMsg = "Incorrect username or password.";
                    ngNotify.set($scope.loginMsg, {position: 'top', type: 'error'});
                    Auth.clearCredentials();
                 });
             }, 500);
         } else {
             $scope.loginMsg = "Please enter a username and password.";
             ngNotify.set($scope.loginMsg, {position: 'top', type: 'error'});
         }
     };
 }]);

vmaControllerModule.controller('registerCtrl', ['$scope', '$state', 'Auth', 'ngNotify', function($scope, $state, Auth, ngNotify) {
    $scope.registerUser = function() {
        Auth.setCredentials("Visitor", "test");
        $scope.salt = "nfp89gpe";
        $scope.register.password = new String(CryptoJS.SHA512($scope.register.password + $scope.register.username + $scope.salt));
        $scope.$parent.Restangular().all("users").post($scope.register).then(
            function(success) {
                Auth.clearCredentials();
                ngNotify.set("User account created. Please login!", {position: 'top', type: 'success'});
                $state.go("home", {}, {reload: true});
            },function(fail) {
                Auth.clearCredentials();
                ngNotify.set(fail.data.message, {position: 'top', type: 'error'});
        });

        Auth.clearCredentials();
    }
}]);

vmaControllerModule.controller('settings', ['$scope', '$state', 'Auth', '$ionicModal', function($scope, $state, Auth, $modal) {
    //OPENING THE MODAL TO LOG OUT A USER
    $scope.logOutUser = function(id) {
        $scope.openLogOut(id);
    }
    $scope.openLogOut = function () {
        var confirmPopup = $ionicPopup.confirm({
                title: 'Log Out',
                template: 'Are you sure you would like to log out?'
            });
                confirmPopup.then(function(res) {
            if(res) {
                 $scope.ok();
            } else {

            }
        });
        $scope.ok = function () {
            $scope.out();
        };
    };
    $scope.out = function() {
        Auth.clearCredentials();
        console.log("HERE");
        $state.go("home", {}, {reload: true});
    }
}]);

vmaControllerModule.controller('postController', ['$scope', '$state', 'vmaPostService', '$ionicActionSheet', 'ngNotify', '$ionicModal', '$stateParams', '$ionicPopup', function($scope, $state, vmaPostService, $ionicActionSheet, ngNotify, $ionicModal, $stateParams, $ionicPopup) {
    $scope.posts = [];
    var state = $state.current.name;
    switch(state) {
        case "home.cfeed":
            $scope.updatePosts = function() {
                var loadSize = 10;
                if($scope.posts.length != 0){
                    loadSize = $scope.posts.length;
                    console.log(loadSize);
                }
                var gProm = vmaPostService.getGroupPosts(loadSize, null, null);
                gProm.then(function(success) {
                    $scope.posts = success;
                }, function(fail) {
                    console.log(fail);
                });
            }
            $scope.loadMore = function() {
                vmaPostService.getGroupPosts(10, $scope.posts[$scope.posts.length -1].id, null).then(
                    function(success) {
                        console.log(success);
                        $scope.posts = $scope.posts.concat(success);
                        console.log($scope.posts);
                    }, function(fail) {
                    }
                );
            }
            break;
        case "home.group.posts":
            $scope.id = $stateParams.id;
            $scope.updatePosts = function() {
                var loadSize = 10;
                if($scope.posts.length != 0){
                    loadSize = $scope.posts.length;
                    console.log(loadSize);
                }
                var gProm = vmaPostService.getGroupPosts(loadSize, null, null);
                gProm.then(function(success) {
                    $scope.posts = success;
                }, function(fail) {
    //                console.log(fail);
                });
            }
            $scope.loadMore = function() {
        //            console.log("LOADING MORE");
        //            console.log($scope.posts[$scope.posts.length -1].id);
                    vmaPostService.getGroupPosts(10, $scope.posts[$scope.posts.length -1].id, $scope.id).then(
                    function(success) {
                        $scope.posts = $scope.posts.concat(success);
                    }, function(fail) {
                        //console.log(fail);
                    });
                }
            break;
        case "home.groupFeed":
            $scope.updatePosts = function() {
                var loadSize = 10;
                if($scope.posts.length != 0){
                    loadSize = $scope.posts.length;
                    console.log(loadSize);
                }
                var gProm = vmaPostService.getMyGroupPosts(loadSize, null);
                gProm.then(function(success) {
                    $scope.posts = success;
                }, function(fail) {
    //                console.log(fail);
                });
            }
            $scope.loadMore = function() {
                vmaPostService.getMyGroupPosts(10, $scope.posts[$scope.posts.length -1].id).then(
                function(success) {
                    $scope.posts = $scope.posts.concat(success);
                }, function(fail) {
                    //console.log(fail);
                });
            }
            break;
        default:
            $scope.updatePosts = function(){}
            $scope.loadMore = function(){}
            console.log("ERROR: UNCAUGHT STATE: ", state);
            return true;
    }

    $scope.updatePosts();
    
    //VIEW POST
    $scope.viewPost = function(pid) {
        $state.go("home.group.posts.comments", {"post_id" : pid}, [{reload: false}]);
    }

    //OPEN EDIT FUNCTION AND OPEN MODAL
    $scope.editPost = function(pid) {
        $scope.openEdit(pid);
    }
    $scope.openEdit = function(pid) {
        // callback for ng-click 'modal'- open Modal dialog to add a new course
        $ionicModal.fromTemplateUrl('partials/addPost.html', {
            scope : $scope
        }).then(function (modal) {
            $scope.modalEdit = modal;
            
            $scope.modalEdit.show();
        });
        $scope.openModal = function() {
            $scope.modal.show();
        };
        $scope.closeModal = function() {
            $scope.modalEdit.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modalEdit.remove();
        });
        
        $scope.ok = function () {
            var prom = vmaPostService.editPost(pid, $scope.post);
            prom.then(function(success) {
                ngNotify.set("Post edited successfully!", 'success');
                $scope.updatePosts();
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
            $scope.modalEdit.remove();
        };
        var getPostProm = vmaPostService.getPost(pid);
        getPostProm.then(function(success) {
            $scope.post = success;
        });
    };

    //OPEN ADD FUNCTION AND DELETE
    $scope.addPost = function() {
        $scope.openAdd();
    }
    $scope.openAdd = function() {
        // callback for ng-click 'modal'- open Modal dialog to add a new course
        $ionicModal.fromTemplateUrl('partials/addPost.html', {
            scope : $scope
        }).then(function (modal) {
            $scope.modalAdd = modal;
            $scope.post = {};
            $scope.modalAdd.show();
        });
        $scope.openModal = function() {
            $scope.modalAdd.show();
        };
        $scope.closeModal = function() {
            $scope.modalAdd.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modalAdd.remove();
        });
        
        $scope.ok = function () {
            $scope.post["group_id"] = $scope.id;
            var prom = vmaPostService.addPost($scope.post, $scope.uid);
            prom.then(function(success) {
                $scope.updatePosts();
                ngNotify.set("Posted successfully!", 'success');
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
            $scope.modalAdd.remove();
        };
    };

    //OPEN DELETE FUNCTION AND DELETE
    $scope.deletePost = function(pid) {
        $scope.openDelete(pid);
    };
    $scope.openDelete = function(pid) {
       var confirmPopup = $ionicPopup.confirm({
         title: 'Delete Post',
         template: 'Are you sure you want delete this post?'
       });
       confirmPopup.then(function(res) {
         if(res) {
             $scope.ok();
         } else {

         }
       });
        
        $scope.ok = function () {
            var prom = vmaPostService.deletePost(pid);
            prom.then(function(success) {
                ngNotify.set("Post deleted successfully!", 'success');
                $scope.updatePosts();
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
        };
    };

    //PERMISSIONS
    $scope.generateActions = function(post_id) {
        var ionicActionArray = [
            { text: 'Edit' },
            { text: 'Delete' }
        ];
        return ionicActionArray;
    }

    //ACTION SHEET
    $scope.showActions = function(post_id) {
        var ionicActions = $scope.generateActions();
        $ionicActionSheet.show({
            buttons: ionicActions,
            titleText: 'Update Post',
            cancelText: 'Cancel',
            buttonClicked: function(index) {
//                console.log(index);
                var action = ionicActions[index];
                switch(action.text) {
                    case "Edit":
                        $scope.editPost(post_id);
                        break;
                    case "Delete":
                        $scope.deletePost(post_id);
                        break;
                    default:
                        return true;
                }
                return true;
            }
        });
    }
}]);

vmaControllerModule.controller('groupController', ['$scope', '$state', '$ionicModal', 'vmaGroupService', '$timeout', 'ngNotify', '$rootScope', 'vmaTaskService', '$stateParams', '$filter', '$ionicActionSheet', '$ionicPopup', function($scope, $state, $ionicModal, vmaGroupService, $timeout, ngNotify, $rootScope, vmaTaskService, $stateParams, $filter, $ionicActionSheet, $ionicPopup) {
    var state = $state.current.name;
    switch(state) {
        case "home.myGroups":
            $scope.update = function(update) {
                vmaGroupService.getMetaJoinedGroups(update).then(function(success) { $scope.metaJoinedGroups = success; });
            }
            break;
        case "home.joinGroups":
            $scope.update = function(update) {
                vmaGroupService.getMetaGroups(update).then(function(success) {
                    $scope.metaGroups = success;
                    $filter('removeJoined')($scope.metaGroups);
                });
            }
            break;
        case "home.group":
            $scope.id = $stateParams.id;
            $scope.update = function(update){
                vmaGroupService.getGroupMeta($scope.id, update).then(function(success) { $scope.group = success; });
//                console.log($stateParams.groupMapData);
                //CONFIGURE MAP
                $scope.map = {
                    sensor: true,
                    size: '500x300',
                    zoom: 15,
                    center: $stateParams.groupMapData.description,
                    markers: [$stateParams.groupMapData.description], //marker locations
                    mapevents: {redirect: true, loadmap: false}
                };
            }
            break;
        default:
            $scope.update = function(){}
            console.log("ERROR: UNCAUGHT STATE: ", state);
            return true;
    }
    $scope.updateGroups = $scope.update;
    $scope.update(true);

    //OPENING MODAL TO ADD A GROUP
    $scope.addGroup = function() {
        $scope.openAdd();
    }
    $scope.openAdd = function () {
        // callback for ng-click 'modal'- open Modal dialog to add a new course
        $ionicModal.fromTemplateUrl('partials/addGroup.html', {
            scope : $scope
        }).then(function (modal) {
            $scope.modalAdd = modal;
            $scope.newGroup = {};
            $scope.modalAdd.show();
        });
        $scope.openModal = function() {
            $scope.modalAdd.show();
        };
        $scope.closeModal = function() {
            $scope.modalAdd.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modalAdd.remove();
        });
        
        $scope.ok = function () {
            var promise = vmaGroupService.addGroup($scope.newGroup);
            console.log($scope.newGroup);
            promise.then(function(success) {
                $scope.updateGroups(true);
                $scope.closeModal();
                ngNotify.set("Group created successfully!", 'success');
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
        };
    };

    //OPENING THE MODAL TO DELETE A GROUP
    $scope.deleteGroup = function(id) {
        $scope.openDelete(id);
    }
    $scope.openDelete = function (id) {
       var confirmPopup = $ionicPopup.confirm({
         title: 'Delete Group',
         template: 'Are you sure you want delete this group?'
       });
       confirmPopup.then(function(res) {
         if(res) {
             $scope.ok();
         } else {

         }
       });
       $scope.ok = function () {
            var promise = vmaGroupService.deleteGroup(id);
            promise.then(function(success) {
                $scope.updateGroups(true);
                ngNotify.set("Group deleted successfully!", 'success');
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
        };
    };

    //OPENING THE MODAL TO EDIT A GROUP
    $scope.editGroup = function(id) {
        $scope.openEdit(id);
    }
    $scope.openEdit = function (id) {
        // callback for ng-click 'modal'- open Modal dialog to add a new course
        $ionicModal.fromTemplateUrl('partials/editGroup.html', {
            scope : $scope
        }).then(function (modal) {
            $scope.modalAdd = modal;
            vmaGroupService.getGroup(id).then(function(success) { $scope.group = success });
            $scope.modalAdd.show();
        });
        $scope.openModal = function() {
            $scope.modalAdd.show();
        };
        $scope.closeModal = function() {
            $scope.modalAdd.hide();
        };
        $scope.$on('$destroy', function() {
            $scope.modalAdd.remove();
        });
        $scope.ok = function () {
            var promise = vmaGroupService.editGroup(id, $scope.group);
            promise.then(function(success) {
                ngNotify.set("Group edited successfully!", 'success');
                $scope.updateGroups(true);
                $scope.closeModal();
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
        };
    };
    
    //OPENING THE MODAL TO LEAVE A GROUP
    $scope.leaveGroup = function(id) {
        $scope.openLeave(id);
    }
    $scope.openLeave = function (id) {
       var confirmPopup = $ionicPopup.confirm({
         title: 'Leave Group',
         template: 'Are you sure you want to leave this group?'
       });
       confirmPopup.then(function(res) {
         if(res) {
             $scope.ok();
         } else {

         }
       });
       $scope.ok = function () {
            var promise = vmaGroupService.leaveGroupMember(id, $scope.uid);
            promise.then(function(success) {
                $scope.updateGroups(true);
                ngNotify.set("Group left successfully!", 'success');
                console.log(success);
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
        };
    };

    //JOINING A GROUP
    $scope.joinGroup = function(id) {
        var jProm = vmaGroupService.joinGroup(id, $scope.uid);
        jProm.then(function(success) {
            $scope.updateGroups(true);
            ngNotify.set("Group joined successfully!", 'success');
        }, function(fail) {
            console.log(fail);
            ngNotify.set(fail.data.message, 'error');
        });
    }

    //VIEW POSTS
    $scope.viewPost = function(pid) {
        $state.go("home.group.posts.comments", {"post_id" : pid}, [{reload: false}]);
    }

    //PERMISSIONS
    $scope.generateActions = function(id) {
        var ionicActionArray = [
            { text: 'Edit' },
            { text: 'Delete' },
            { text: 'Leave' }
        ];
        return ionicActionArray;
    }

    //ACTION SHEET
    $scope.showActions = function(id) {
        var ionicActions = $scope.generateActions(id);
        $ionicActionSheet.show({
            buttons: ionicActions,
            titleText: 'Update Group',
            cancelText: 'Cancel',
            buttonClicked: function(index) {
//                console.log(index);
                var action = ionicActions[index];
                switch(action.text) {
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
                        console.log("BUG");
                        return true;
                }
                return true;
            }
        });
    }
}]);

vmaControllerModule.controller('taskController', ['$scope', '$state', '$ionicModal', 'vmaGroupService', '$timeout', 'ngNotify', '$rootScope', 'vmaTaskService', '$stateParams', '$filter', '$ionicActionSheet', '$ionicPopup', function($scope, $state, $ionicModal, vmaGroupService, $timeout, ngNotify, $rootScope, vmaTaskService, $stateParams, $filter, $ionicActionSheet, $ionicPopup) {
    var state = $state.current.name;
    switch(state) {
        case "home.myTasks":
            $scope.updateTasks = function() {
                vmaTaskService.getJoinTasks().then(function(success) { $scope.joinTasks = success; });
            }
            break;
        case "home.group":
            $scope.updateTasks = function(update){
                vmaTaskService.getAllTasksGroup($scope.id).then(function(success) { $scope.tasks = success; });
            }
            break;
        case "home.group.tasks":
            $scope.id = $stateParams.id;
            $scope.updateTasks = function() {
                vmaTaskService.getMetaTasksGroup($scope.id).then(function(success) { $scope.metaTasks = success;});
            }
            $scope.updateTasks();
            break;
        default:
            $scope.update = function(){}
            console.log("ERROR: UNCAUGHT STATE: ", state);
            break;
    }
    $scope.updateTasks();
    
    //VIEW A TASK
    $scope.viewTask = function(click_id) {
        $scope.task = vmaTaskService.getTaskView(click_id);
        $state.go("home.task", {"task" : JSON.stringify($scope.task)}, [{reload: false}]);
    }
    
    //VIEW MESSAGES
    $scope.displayMessages = function(click_id) {
        $state.go('home.groupMessages.message', {id:click_id}, {reload: false});
    }

    //OPENING THE MODAL TO ADD A TASK
    $scope.addTask = function () {
        $scope.openAdd();
    }
    $scope.openAdd = function () {
        $scope.newTask = {}
        // callback for ng-click 'modal'- open Modal dialog to add a new course
        $ionicModal.fromTemplateUrl('partials/addTask.html', {
            scope : $scope
        }).then(function (modal) {
            $scope.modalAdd = modal;
            $scope.newGroup = {};
            $scope.modalAdd.show();
        });
        $scope.openModal = function() {
            $scope.modalAdd.show();
        };
        $scope.closeModal = function() {
            $scope.modalAdd.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modalAdd.remove();
        });
        $scope.ok = function () {           
            $scope.newTask.group_id = $scope.id;
//            $scope.newTask.time = $scope.mytime;
            console.log($scope);
            var promise = vmaTaskService.addTask($scope.newTask);
            promise.then(function(success) {
                $scope.message = "ADD SUCCESS!";
                    $scope.updateTasks();
                    $scope.closeModal();
                    ngNotify.set("Task added successfully", "success");
                }, function(fail) {
                    ngNotify.set(fail.data.message, 'error');
            });
        };
    };

    //OPENING THE MODAL TO EDIT A TASK
    $scope.editTask = function (task_id) {
        $scope.openEdit(task_id);
    }
    $scope.openEdit = function (task_id) {
        // callback for ng-click 'modal'- open Modal dialog to add a new course
        $ionicModal.fromTemplateUrl('partials/editTask.html', {
            scope : $scope
        }).then(function (modal) {
            $scope.modalAdd = modal;
            vmaTaskService.getTask(task_id).then(function(success) {
                $scope.editTask = success;
                if($scope.editTask.time)
                    $scope.editTask.time = new Date($scope.editTask.time);
                else
                    $scope.editTask.time = null;
            });
            $scope.modalAdd.show();
        });
        $scope.openModal = function() {
            $scope.modalAdd.show();
        };
        $scope.closeModal = function() {
            $scope.modalAdd.hide();
        };
        $scope.$on('$destroy', function() {
            $scope.modalAdd.remove();
        });
        $scope.ok = function () {
            var promise = vmaTaskService.editTask(task_id, $scope.editTask);
            promise.then(function(success) {
                    ngNotify.set("Task edited successfully", "success");
                    $scope.updateTasks();
                    $scope.closeModal();
                }, function(fail) {
                    ngNotify.set(fail.data.message, 'error');
            });
        };
    };

    //OPENING THE MODAL TO DELETE A TASK
    $scope.deleteTask = function (task_id) {
        $scope.openDelete(task_id);
    }
    $scope.openDelete = function (task_id) {
        var confirmPopup = $ionicPopup.confirm({
                title: 'Delete Message',
                template: 'Are you sure you want delete this message?'
            });
                confirmPopup.then(function(res) {
            if(res) {
                 $scope.ok();
            } else {

            }
        });

        $scope.ok = function () {
            var promise = vmaTaskService.deleteTask(task_id);
            promise.then(function(success) {
                    console.log(success);
                    window_scope.updateTasks();
                    $modalInstance.close();
                    ngNotify.set("Task deleted successfully", "success");
                }, function(fail) {
                    ngNotify.set(fail.data.message, 'error');
            });
        };
    };

    //JOINING A TASK
    $scope.joinTask = function(task_id) {
        var promise = vmaTaskService.joinTask(task_id, $scope.uid);
        promise.then(function(success) {
                $scope.updateTasks();
                ngNotify.set("Task joined successfully", "success");
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
        });
    }

    //LEAVING A TASK
    $scope.leaveTask = function(task_id) {
        var promise = vmaTaskService.leaveTaskMember(task_id, $scope.uid);
        promise.then(function(success) {
                $scope.updateTasks();
                ngNotify.set("Task left successfully", "success");
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
        });
    }

    //OPENING DATE/TIME PICKER
    $scope.openDatePicker = function () {
        $scope.tmp = {};
        $scope.tmp.newDate = $scope.newTask.time;
        $ionicPopup.show({
            template: '<datetimepicker data-ng-model="tmp.newDate"></datetimepicker>',
            title: "Task Date & Time",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                        $scope.newTask.time = $scope.tmp.newDate;
                    }
                }
            ]
        });
    };

    //OPENING DATE/TIME PICKER
    $scope.openDatePickerEdit = function () {
        $scope.tmp = {};
        $scope.tmp.newDate = $scope.editTask.time;
        $ionicPopup.show({
            template: '<datetimepicker data-ng-model="tmp.newDate"></datetimepicker>',
            title: "Task Date & Time",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                        $scope.editTask.time = $scope.tmp.newDate;
                    }
                }
            ]
        });
    };

    //PERMISSIONS
    $scope.generateActions = function(id) {
        var ionicActionArray = [
            { text: 'Edit' },
            { text: 'Delete' },
            { text: 'Leave' }
        ];
        return ionicActionArray;
    }

    //ACTION SHEET
    $scope.showActions = function(id) {
        var ionicActions = $scope.generateActions(id);
        $ionicActionSheet.show({
            buttons: ionicActions,
            titleText: 'Update Task',
            cancelText: 'Cancel',
            buttonClicked: function(index) {
//                console.log(index);
                var action = ionicActions[index];
                switch(action.text) {
                    case "Edit":
                        $scope.editTask(id);
                        break;
                    case "Delete":
                        $scope.deleteTask(id);
                        break;
                    case "Leave":
                        $scope.leaveTask(id);
                        break;
                    default:
                        console.log("BUG");
                        return true;
                }
                return true;
            }
        });
    }
}]);

vmaControllerModule.controller('message', ['$scope', '$state', '$stateParams', '$location', '$anchorScroll', '$timeout', '$ionicModal', 'vmaMessageService', 'ngNotify', 'vmaTaskService', '$ionicActionSheet', '$ionicPopup', function($scope, $state, $stateParams, $location, $anchorScroll, $timeout, $ionicModal, vmaMessageService, ngNotify, vmaTaskService, $ionicActionSheet, $ionicPopup) {
        $scope.id = $stateParams.id;
        vmaTaskService.getTask($scope.id).then(
            function(success) {
                $scope.task = success;
            });
        $scope.groupMSGs = [];
        $scope.updateMessages = function() {
            var prom = vmaMessageService.getTaskMessages(10, null, $scope.id);
            prom.then(function(success) {
                $scope.groupMSGs = success;
                $scope.scrollTo();
            }, function(fail) {
                
            });
        }
        $scope.updateMessages();

        $scope.addMsg = function() {
            vmaMessageService.addMessage($scope.msg, $scope.uid, $scope.id).then(function(success) {
                $scope.updateMessages()
            });
            $scope.msg = "";
        }

        //OPENING THE MODAL TO DELETE A MESSAGE
        $scope.deleteMessage = function(id) {
            $scope.openDelete(id);
        }
        $scope.openDelete = function (id) {
            var confirmPopup = $ionicPopup.confirm({
                    title: 'Delete Message',
                    template: 'Are you sure you want delete this message?'
                });
                    confirmPopup.then(function(res) {
                if(res) {
                     $scope.ok();
                } else {

                }
            });
            
            $scope.ok = function () {
                var promise = vmaMessageService.deleteMessage(id);
                promise.then(function(success) {
                    $scope.updateMessages();
                    ngNotify.set("Message deleted successfully!", 'success');
                }, function(fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            };
        };

        //OPENING THE MODAL TO EDIT A MESSAGE
        $scope.editMessage = function(id) {
            $scope.openEdit(id);
        }
        $scope.openEdit = function (id) {
            // callback for ng-click 'modal'- open Modal dialog to add a new course
            $ionicModal.fromTemplateUrl('partials/editMessage.html', {
                scope : $scope
            }).then(function (modal) {
                $scope.modalEdit = modal;
                vmaMessageService.getMessage(id, $scope.id).then(function(success) { $scope.message_edit = success; });
                $scope.modalEdit.show();
            });
            $scope.openModal = function() {
                $scope.modal.show();
            };
            $scope.closeModal = function() {
                $scope.modalEdit.hide();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function() {
                $scope.modalEdit.remove();
            });

            $scope.ok = function () {
                var promise = vmaMessageService.editMessage(id, $scope.message_edit);
                promise.then(function(success) {
                    ngNotify.set("Message edited successfully!", 'success');
                    $scope.updateMessages();
                    $scope.closeModal()
                }, function(fail) {
                    ngNotify.set(fail.data.message, 'error');
                });
            };
        };

        //THE SCROLLING HEADACHE FOR INPUT
            //$timeout(function() {
            //  $location.hash('messaging_input');
            //  $anchorScroll();
            //});
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if(userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
            $scope.scrollTo = function() { }
        }
        else if(userAgent.match(/Android/i)) {
            $scope.scrollTo = function() {
                $timeout(function() {
                    $location.hash('messaging_input');
                    $anchorScroll();
                }, 500);
                
                $timeout(function() {
                    $location.hash('messaging_input');
                    $anchorScroll();
                }, 2000);
            }
        } else {
            $scope.scrollTo = function() {
                $timeout(function() {
                    $location.hash('messaging_input');
                    $anchorScroll();
                }, 500);
                
                $timeout(function() {
                    $location.hash('messaging_input');
                    $anchorScroll();
                }, 2000);
            }
        }

        //PERMISSIONS
        $scope.generateActions = function(id) {
            var ionicActionArray = [
                { text: 'Edit' },
                { text: 'Delete' }
            ];
            return ionicActionArray;
        }

        //ACTION SHEET
        $scope.showActions = function(id) {
            var ionicActions = $scope.generateActions(id);
            $ionicActionSheet.show({
                buttons: ionicActions,
                titleText: 'Update Message',
                cancelText: 'Cancel',
                buttonClicked: function(index) {
    //                console.log(index);
                    var action = ionicActions[index];
                    switch(action.text) {
                        case "Edit":
                            $scope.editMessage(id);
                            break;
                        case "Delete":
                            $scope.deleteMessage(id);
                            break;
                        default:
                            console.log("BUG");
                            return true;
                    }
                    return true;
                }
            });
        }
}]);

vmaControllerModule.controller('comments', ['$scope', '$state', '$stateParams', '$ionicModal', 'vmaPostService', 'vmaCommentService', 'ngNotify', '$ionicActionSheet', '$ionicPopup', function($scope, $state, $stateParams, $ionicModal, vmaPostService, vmaCommentService, ngNotify, $ionicActionSheet, $ionicPopup) {
    var post_id = $stateParams.post_id;
    $scope.updateComments = function() {
        if($scope.post) { var count = $scope.post.comments.length; } else { var count = 10; }
        vmaPostService.getPostView(count, null, post_id).then(function(success) { $scope.post = success; });
    }
    $scope.loadMore = function() {
        vmaCommentService.getPostComments(10, $scope.post.comments[$scope.post.comments.length -1].id, post_id).then(
            function(success) { $scope.post.comments = $scope.post.comments.concat(success); }
        );
    };
    $scope.updateComments();
    
    $scope.addComment = function() {
        vmaCommentService.addComment($scope.comment.content, post_id, $scope.uid).then(function(success) {
            $scope.updateComments();
            $scope.comment.content = "";
            document.activeElement.blur();
            ngNotify.set("Commented successfully!", "success");
        }, function(fail) {
            ngNotify.set(fail.data.message, 'error');
        });
    }

    $scope.editComment = function(cid) {
        $scope.openEdit(cid);
    }
    $scope.openEdit = function (cid) {
        // callback for ng-click 'modal'- open Modal dialog to add a new course
        $ionicModal.fromTemplateUrl('partials/editComment.html', {
            scope : $scope
        }).then(function (modal) {
            $scope.modalEdit = modal;
            vmaCommentService.getComment(cid).then(function(success) { $scope.comment = success; });
            $scope.modalEdit.show();
        });
        $scope.openModal = function() {
            $scope.modal.show();
        };
        $scope.closeModal = function() {
            $scope.modalEdit.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modalEdit.remove();
        });
        $scope.ok = function () {
            var prom = vmaCommentService.editComment(cid, $scope.comment);
            prom.then(function(success) {
                ngNotify.set("Comment edited successfully!", 'success');
                $scope.comment = null;
                $scope.updateComments();
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
            $scope.closeModal();
        };
    };

    //OPEN DELETE
    $scope.deleteComment = function(cid) {
        $scope.openDelete(cid);
    }
    $scope.openDelete = function (cid) {
        var confirmPopup = $ionicPopup.confirm({
                title: 'Delete Comment',
                template: 'Are you sure you want delete this comment?'
            });
                confirmPopup.then(function(res) {
            if(res) {
                 $scope.ok();
            } else {

            }
        });
        $scope.ok = function () {
            var prom = vmaCommentService.deleteComment(cid);
            prom.then(function(success) {
                $scope.updateComments();
                ngNotify.set("Comment deleted successfully!", 'success');
            }, function(fail) {
//                console.log(fail)
                ngNotify.set(fail.data.message, 'error');
            });
        };
    };

    //PERMISSIONS
    $scope.generateActions = function(id) {
        var ionicActionArray = [
            { text: 'Edit' },
            { text: 'Delete' }
        ];
        return ionicActionArray;
    }

    //ACTION SHEET
    $scope.showActions = function(id) {
        var ionicActions = $scope.generateActions(id);
        $ionicActionSheet.show({
            buttons: ionicActions,
            titleText: 'Update Message',
            cancelText: 'Cancel',
            buttonClicked: function(index) {
//                console.log(index);
                var action = ionicActions[index];
                switch(action.text) {
                    case "Edit":
                        $scope.editComment(id);
                        break;
                    case "Delete":
                        $scope.deleteComment(id);
                        break;
                    default:
                        console.log("BUG");
                        return true;
                }
                return true;
            }
        });
    }
}]);

vmaControllerModule.controller('task', ['$scope', '$state', '$stateParams', '$ionicModal', 'vmaTaskService', function($scope, $state, $stateParams, $modal, vmaTaskService) {
    console.log(JSON.parse($stateParams.task));
    $scope.task = JSON.parse($stateParams.task);
    $scope.map = {
        sensor: true,
        size: '500x300',
        zoom: 15,
        center: $scope.task.location,
        markers: [$scope.task.location], //marker locations
        mapevents: {redirect: true, loadmap: false}
    };
}]);

vmaControllerModule.controller('efforts', ['$scope', '$state', '$stateParams', '$ionicModal', 'vmaTaskService', 'ngNotify', function($scope, $state, $stateParams, $modal, vmaTaskService, ngNotify) {
    $scope.invites = [
        {id:'3', group_name: "GROUP 3", icon: "img/temp_icon.png"},
        {id:'4', group_name: "GROUP 4", icon: "img/temp_icon.png"},
        {id:'5', group_name: "GROUP 5", icon: "img/temp_icon.png"},
        {id:'6', group_name: "GROUP 6", icon: "img/temp_icon.png"}
    ];
}]);

vmaControllerModule.controller('hours.moderation', ['$scope', '$state', '$stateParams', '$ionicModal', '$rootScope', 'ngNotify', 'vmaTaskService', 'vmaHourService', function($scope, $state, $stateParams, $modal, $rootScope, ngNotify, vmaTaskService, vmaHourService) {
    $scope.update = function() {
        vmaTaskService.getJoinTasks().then(function(success) { $scope.joinTasks = success;});
        vmaHourService.getHours(10).then(function(success) { $scope.entries = success;});
    }
    $scope.update();

    $scope.entry = [];

    $scope.approve = function(h_id) {
//        console.log("attempt approve");
        vmaHourService.approveHour(h_id);
    }

    $scope.deny = function(h_id) {
//        console.log("attempt deny");
        vmaHourService.denyHour(h_id);
    }
}]);

vmaControllerModule.controller('hoursController', ['$scope', '$state', '$stateParams', '$ionicModal', '$rootScope', 'ngNotify', 'vmaTaskService', 'vmaHourService', '$ionicPopup', function($scope, $state, $stateParams, $ionicModal, $rootScope, ngNotify, vmaTaskService, vmaHourService, $ionicPopup) {
    $scope.update = function() {
        vmaTaskService.getJoinTasks().then(function(success) { $scope.joinTasks = success;});
        vmaHourService.getMyHours(10).then(function(success) { $scope.entries = success;});
    }
    $scope.update();

    $scope.entry = [];
    
    $scope.ok = function() {
        $scope.hourEntry = {user_id: $rootScope.uid, title: $scope.entry.name, start_time: $scope.entry.inTime, duration: Math.ceil($scope.entry.duration)};
        console.log($scope.hourEntry);
        vmaHourService.addHours($scope.hourEntry).then(function(success) {
            $scope.update();
            ngNotify.set("Successfully submitted hour entry!", "success");
        },function(fail){
            ngNotify.set("Error :(", "error");
        });
        $scope.entry = [];
    }
    
    $scope.checkIn = function() {
        $scope.entry.inTime = new Date();
        $scope.checkInTimeDisplay = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
        console.log($scope.entry.inTime);
        ngNotify.set("Successfully checked in!", "success");
    }
    
    $scope.checkOut = function() {
//        if(!$scope.entry) $scope.entry = [];
        console.log($scope.entry.inTime);
        $scope.checkOutTime = new Date();
        $scope.checkOutTimeDisplay = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
        $scope.entry.duration = Math.ceil(($scope.checkOutTime - $scope.entry.inTime)/1000/60);
        console.log($scope.entry.inTime);
        console.log($scope.checkOutTime);
        console.log($scope.checkOutTime - $scope.inTime);
        ngNotify.set("Successfully checked out!", "success");
    }
    
    //OPENING THE MODAL TO DELETE A MESSAGE
    $scope.delete = function(h_id) {
        $scope.openDelete(h_id);
    }
    $scope.openDelete = function (id) {
        console.log(id);
        var modalInstance = $modal.open({
          templateUrl: 'partials/deleteHour.html',
          controller: ModalInstanceCtrlDelete,
          resolve: {
              deleteId: function() {
                  return id;
              },
              window_scope: function() {
                return $scope;
              }
          }
        });

        modalInstance.result.then(function (selectedItem) {
//          $scope.selected = selectedItem;
        }, function () {
//          What to do on dismiss
//          $log.info('Modal dismissed at: ' + new Date());
        });
};
    //Controller for the Modal PopUp Delete
    var ModalInstanceCtrlDelete = function ($scope, $modalInstance, deleteId, window_scope, vmaGroupService) {
        $scope.ok = function () {
            var promise = vmaHourService.deleteHour(deleteId);
            promise.then(function(success) {
                window_scope.update();
                ngNotify.set("Hour entry deleted successfully!", 'success');
                $modalInstance.close();
            }, function(fail) {
                ngNotify.set(fail.data.message, 'error');
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
            console.log("SCOPE - $stateChangeStart");
            $modalInstance.dismiss('cancel');
            //Prevents the switching of the state
            event.preventDefault();
        });
    };
    
    $scope.openDatePicker = function () {
        $scope.tmp = {};
//        $scope.tmp.newDate = $scope.newTask.time;
        $ionicPopup.show({
            template: '<datetimepicker data-ng-model="tmp.newDate"></datetimepicker>',
            title: "Task Date & Time",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                        $scope.entry.inTime = $scope.tmp.newDate;
                    }
                }
            ]
        });
    };
}]);

vmaControllerModule.controller('awards', function ($scope) {
//    PULL THIS IN FROM USER_DATA
    $scope.badges = [
        ["Creator", 42],
        ["Leadership", 35],
        ["Organizer", 32],
        ["Grunt", 21]
    ];
    
    $scope.total_hours = 42 + 35 + 32 + 12 + 21;
    $scope.badge1_percent = Math.round($scope.badges[0][1]/$scope.total_hours * 100);
    $scope.badge2_percent = Math.round($scope.badges[1][1]/$scope.total_hours * 100);
    $scope.badge3_percent = Math.round($scope.badges[2][1]/$scope.total_hours * 100);
    $scope.badge4_percent = Math.round($scope.badges[3][1]/$scope.total_hours * 100);
    
    $scope.chartConfig = {
        options: {
            chart: {
                type: 'pie',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false

            },
            title: {
                text: ''
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true
                    },
                    showInLegend: false
                }
            }
        },
        series: [{
            type: 'pie',
            data: $scope.badges
        }],

        loading: false
    }

});

vmaControllerModule.controller('calendar', ['$scope', '$state', 'vmaTaskService', '$compile', '$ionicModal', function($scope, $state, vmaTaskService, $compile, $modal) {
    //ACCESSES SERVER AND UPDATES THE LIST OF TASKS
    $scope.updateTasksAndDisplayCalendar = function() {
        var gPromMemb = vmaTaskService.getCalTasks($scope.id);
        gPromMemb.then(function(success) {
            $scope.calTasks = success;
            displayFullCalendar($scope.calTasks);
            $compile($('#calendar'))($scope);
        }, function(fail) {
            //console.log(fail);
        });
    }
    
    $scope.updateTasksAndDisplayCalendar();
    
    //VIEW A TASK
    $scope.viewTask = function(click_id) {
        $scope.task = vmaTaskService.getTaskView(click_id);
        $state.go("home.task", {"task" : JSON.stringify($scope.task)}, [{reload: false}]);
    }
}]);

vmaControllerModule.controller('menuCtrl', ['$scope', '$state', function($scope, $state) {
    $scope.state = $state;
}]);