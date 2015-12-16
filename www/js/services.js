'use strict';

var vmaServices = angular.module('vmaServicesModule', ['restangular']);
vmaServices.factory('vmaUserService', function (Restangular, $q, $filter) {
    var allUsers;
    var promAllUsers;
    var myUser;
    var updating;
    return {
        updateUsers: //ACCESSES SERVER AND UPDATES THE LIST OF USERS
            function (update) {
                if (update || (!allUsers && !updating)) {
                    promAllUsers = Restangular.all("users").getList();
                    updating = true;
                    promAllUsers.then(function (success) {
                        updating = false;
                        success = Restangular.stripRestangular(success);
                        allUsers = success;
                    }, function (fail) {

                    });
                    return promAllUsers;
                } else if (updating) {
                    return promAllUsers;
                } else {
                    var defer = $q.defer();
                    defer.resolve("DONE");
                    return defer.promise;
                }
            },
        getAllUsers: function () {
            return this.updateUsers().then(function () {
                return allUsers;
            });
        },
        getMyUser: function () {
            return Restangular.all("users").all("myUser").getList();
        },
        getUser: function (user_id) {
            return this.updateUsers().then(function () {
                return $filter('getById')(allUsers, user_id);
            });
        },
        getMyRole: function () {
            return Restangular.all("users").all("myRole").getList().then(function (success) {
                return success[0];
            });
        },
        addUser: function (user) {
            return Restangular.all("users").post(user);
        },
        editUser: function (id, user) {
            return Restangular.all("users").all(id).post(user);
        },
        deleteUser: function (uid) {
            return Restangular.all("users").all(uid).remove();
        },
        getAvatarPath: function (id) {
            return this.getMyUser(id).then(function (s) {
                s = s[0];
                return "http://housuggest.org/CoreVMA/users/" + s.picturePath + "/" + s.profile_picture_filename;
            });
        }
    }
});

vmaServices.factory('vmaGroupService', function (Restangular, $q, $filter, $rootScope) {
    var allGroups;
    var manGroups;
    var metaGroups;
    var promAllGroups;
    var updating;
    return {
        updateGroups: //ACCESSES SERVER AND UPDATES THE LIST OF GROUPS
            function (update) {
                if (update || ((!allGroups || !manGroups) && !updating)) {
                    updating = true;
                    var gPromByMan = Restangular.all("locations").one("byManager").getList();
                    gPromByMan.then(function (success) {
                        success = Restangular.stripRestangular(success);
                        manGroups = success;
                        $rootScope.isMan = manGroups.length > 0;
                    });
                    var gPromMaster = Restangular.all("locations").getList();
                    gPromMaster.then(function (success) {
                        success = Restangular.stripRestangular(success);
                        allGroups = success;
                    });
                    promAllGroups = $q.all([gPromByMan, gPromMaster]).then(function () {
                        updating = false;
                    });
                    return promAllGroups;
                } else if (updating) {
                    return promAllGroups;
                } else {
                    var defer = $q.defer();
                    defer.resolve("DONE");
                    return defer.promise;
                }
            },
        getAllGroups: function (update) {
            return this.updateGroups(update).then(function () {
                return allGroups;
            });
        },
        getManGroups: function () {
            return this.updateGroups().then(function () {
                return manGroups;
            });
        },
        getMetaGroups: function (update) {
            return this.getAllGroups(update).then(function (success) {
                var result = [];
                success.forEach(function (allGroup) {
                    var manGroup = $filter('getById')(manGroups, allGroup.id);
                    if (manGroup)
                        allGroup.isManager = true;
                    result.push(allGroup);
                });
                metaGroups = result;
                return result;
            });
        },
        getGroup: function (group_id) {
            return this.updateGroups().then(function () {
                return $filter('getById')(allGroups, group_id);
            });
        },
        getGroupMeta: function (group_id, update) {
            return this.getMetaGroups(update).then(function (success) {
                var group = $filter('getById')(success, group_id);
                group.joined = !!$filter('getById')((manGroups), group_id);
                return group;
            });
        },
        addGroup: function (group) {
            return Restangular.all("locations").post(group);
        },
        editGroup: function (id, group) {
            delete group.isGroup;
            delete group.isManager;
            return Restangular.all("locations").all(id).post(group);
        },
        deleteGroup: function (gid) {
            return Restangular.all("locations").all(gid).remove();
        },
        joinGroup: function (gid, uid) {
            return Restangular.all("locations").all(gid).all("MEMBER").all(uid).post();
        },
        isManager: function (gid) {
            return this.getManGroups().then(function () {
                var group = $filter('getById')(manGroups, gid);
                return !!group;
            }, function () {
                return false;
            });
        },
        leaveGroupManager: function (gid, uid) {
            return Restangular.all("locations").all(gid).all("MANAGER").all(uid).remove().then(function (success) {
            });
        },
        leaveGroupMember: function (gid, uid) {
            return this.leaveGroupManager(gid, uid).then(function () {
                return Restangular.all("locations").all(gid).all("MEMBER").all(uid).remove().then(function (success) {
                });
            });
        },
        clear: function () {
            allGroups = null;
            manGroups = null;
            metaGroups = null;
            promAllGroups = null;
            updating = null;
        }
    }
});

vmaServices.factory('vmaTaskService', function (Restangular, $q, $filter, vmaGroupService) {
    var allTasks;
    var subTasks = [];
    var metaTasks = [];
    var memTasks = [];
    var updating;
    var promAllTasks;
    return {
        updateTasks: //ACCESSES SERVER AND UPDATES THE LIST OF TASKS
            function (refresh) {
                if (refresh || ((!allTasks || !memTasks) && !updating)) {
                    updating = true;
                    console.log("TASKS UPDATED");

                    var gPromMaster = Restangular.all("classes").getList();
                    gPromMaster.then(function (success) {
                        success = Restangular.stripRestangular(success);
                        allTasks = success;
                        return allTasks;
                    }, function (fail) {
                    });

                    var gProm = Restangular.all("classes").one("byMembership").getList();

                    gProm.then(function (success) {
                        success = Restangular.stripRestangular(success);
                        memTasks = success;
                    });

                    promAllTasks = $q.all([gProm, gPromMaster]).then(function () {
                        updating = false;
                    });
                    return promAllTasks;
                } else if (updating) {
                    return promAllTasks;
                } else {
                    var defer = $q.defer();
                    defer.resolve(allTasks);
                    return defer.promise;
                }
            },
        getMetaTasks: function (update) {
            return this.getSubtractedTasks(update).then(function () {
                var result = [];
                memTasks.forEach(function (obj) {
                    obj.isMember = true;
                    result.push(obj);
                });
                subTasks.forEach(function (obj) {
                    obj.isTask = true;
                    result.push(obj);
                });
                metaTasks = result;
                metaTasks.forEach(function (task) {
                    if (task.time) {
                    } else {
                        task.datetime = "No Time Specified";
                    }
                    //task.isMan = vmaGroupService.isManager(task.group_id);
                });
                return metaTasks;
            });
        },
        getAllTasksGroup: function (gid, update) {
            return this.updateTasks(update).then(function () {
                return $filter('getTasksByGroupId')(allTasks, gid);
            });
        },
        getSubtractedTasks: function (update) {
            return this.updateTasks(update).then(function () {
                var assignedGroupsIds = {};
                var groupsIds = {};
                var result = [];

                var assignedGroups = memTasks;
                var groups = allTasks;

                assignedGroups.forEach(function (el, i) {
                    assignedGroupsIds[el.id] = assignedGroups[i];
                });

                groups.forEach(function (el, i) {
                    groupsIds[el.id] = groups[i];
                });

                for (var i in groupsIds) {
                    if (!assignedGroupsIds.hasOwnProperty(i)) {
                        result.push(groupsIds[i]);
                    }
                }
                subTasks = result;
                return result;
            });
        },
        getMetaTasksGroup: function (gid, update) {
            return this.getMetaTasks(update).then(function (success) {
                return vmaGroupService.isManager(gid).then(function (isMan) {
                    var result = $filter('getTasksByGroupId')(success, gid);
                    //FORMATTING DATE/TIME
                    result.forEach(function (obj) {
                        if (obj.time) {
                            obj.datetime = obj.time;
                        } else {
                            obj.time = "No Time Specified";
                        }
                    });
                    if (!isMan) {
                        return result;
                    } else {
                        result.forEach(function (obj) {
                            obj.isGroupManager = true;
                        });
                        return result;
                    }
                });
            });
        },
        getJoinTasks: function () {
            return Restangular.all("classes").all("byMembership").getList().then(function (s) {
                s.forEach(function (s2) {
                    s2.isMember = true;
                });
                return s;
            });
        },
        getCalTasks: function () {
            return this.updateTasks(true).then(function () {
                var result = [];
                allTasks.forEach(function (entry) {
                    if (entry.time && entry.active == 1) {
                        var URL = "#/taskview/" + entry.id;
                        URL = encodeURI(URL);
                        result.push({"title": entry.name, "start": entry.time, "url": URL});
                    }
                });
                return result;
            });
        },
        getTask: function (task_id, update) {
            return this.updateTasks(update).then(function () {
                return $filter('getById')(allTasks, task_id);
            });
        },
        getTaskPure: function (task_id) {
            return Restangular.all("classes").get(task_id);
        },
        getTaskByName: function (task_name, update) {
            return this.updateTasks(update).then(function () {
                return $filter('getByName')(allTasks, task_name);
            });
        },
        getTaskView: function (task_id, update) {
            return this.updateTasks(update).then(function (success) {
                var task = $filter('getById')(success, task_id);
                if (task.time) {

                } else {
                    task.time = "No Time Specified";
                }
                return task;
            });
        },
        addTask: function (task) {
            task.time = $filter('date')(Date.parse(task.time), 'yyyy-MM-ddTHH:mmZ');
            return Restangular.all("classes").post(task);
        },
        addTaskList: function (taskList, location_id, badgeConfig) {
            if (taskList)
                taskList.forEach(function (task) {
                    task.time = $filter('date')(Date.parse(task.time), 'yyyy-MM-ddTHH:mmZ');
                    task.location_id = location_id;
                    task.active = (task.active === "TRUE") ? "1" : "0";
                    task.forCHW = (task.forCHW === "TRUE") ? "1" : "0";
                    task.forCredit = (task.forCredit === "TRUE") ? "1" : "0";
                    if (!task.cores)
                        task.cores = [];
                    else {
                        var cores = task.cores.replace(/"/g, '').split(", ");
                        var coreIdArr = [];
                        cores.forEach(function (core) {
                            coreIdArr.push(badgeConfig.indexOf(core));
                        });
                        task.cores = coreIdArr;
                    }
                });
            return Restangular.all("classes").all("list").post(taskList);
        },
        editTask: function (id, task) {
            task.time = $filter('date')(Date.parse(task.time), 'yyyy-MM-ddTHH:mmZ');
            return Restangular.all("classes").all(id).post(task);
        },
        deleteTask: function (tid) {
            return Restangular.all("classes").all(tid).remove();
        },
        joinTask: function (tid, uid) {
            return Restangular.all("classes").all(tid).all("MEMBER").all(uid).post();
        },
        leaveTaskManager: function (tid, uid) {
            return Restangular.all("classes").all(tid).all("MEMBER").all(uid).remove().then(function (success) {
            });
        },
        leaveTaskMember: function (tid, uid) {
            return this.leaveTaskManager(tid, uid).then(function () {
                return Restangular.all("classes").all(tid).all("MEMBER").all(uid).remove().then(function (success) {
                });
            });
        },
        markFinished: function (tid) {
            return Restangular.all("classes").all(tid).post({"finished": 1})
        },
        markUnFinished: function (tid) {
            return Restangular.all("classes").all(tid).post({"finished": 0})
        }
    }
});

vmaServices.factory('vmaHourService', function (Restangular, vmaTaskService, vmaUserService, $q) {
    return {
        getMyHours: function (numHours, startindex, gid, pending) {
            return Restangular.all("hours").all("myHours").getList({
                "numberOfHours": numHours,
                "startIndex": startindex,
                "group_id": gid,
                "onlyPending": pending
            });
        },
        getMyHoursWithTasks: function (numHours, startindex, gid, pending) {
            return Restangular.all("hours").all("myHours").getList({
                "numberOfHours": numHours,
                "startIndex": startindex,
                "group_id": gid,
                "onlyPending": pending
            }).then(function (success) {
                var badgesObj = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0};
                var promiseArray = [];
                success.forEach(function (hour) {
                    var id = hour.task_id;
                    if (hour.approved) {
                        if (id != undefined)
                            promiseArray.push(vmaTasksService.getTask(id).then(function (success) {
                                if (success != undefined) {
                                    if (success.badge_id === undefined) success.badge_id = 4;
                                    badgesObj[success.badge_id]++;
                                }
                            }));
                        else {
                            badgesObj[4]++;
                        }
                    }
                });
                var deferred = $q.all(promiseArray);
                return deferred.then(function () {
                    return badgesObj;
                });
            });
        },
        getHours: function (numHours, startindex, gid, pending) {
            return Restangular.all("hours").getList({
                "numberOfHours": numHours,
                "startIndex": startindex,
                "group_id": gid,
                "onlyPending": pending
            }).then(function (success) {
                success = Restangular.stripRestangular(success);
                success.forEach(function (hour) {
                    vmaUserService.getUser(hour.user_id).then(function (success) {
                        hour.user = success;
                    });
                });
                return success;
            });
        },
        addHours: function (hour) {
            return Restangular.all("hours").post(hour);
        },
        getHour: function (h_id) {
            return Restangular.all("hours").get(h_id);
        },
        editHours: function (id, hour) {
            return Restangular.all("hours").all(id).post(hour);
        },
        deleteHour: function (id) {
            return Restangular.all("hours").all(id).remove();
        },
        approveHour: function (id) {
            return Restangular.all("hours").all("approve").all(id).post(null, {"isApproved": true});
        },
        denyHour: function (id) {
            return Restangular.all("hours").all("approve").all(id).post(null, {"isApproved": false});
        }
    }
});

vmaServices.factory('Camera', function (Restangular, $q) {
    return {
        getPicture: function (options) {
            var q = $q.defer();

            navigator.camera.getPicture(function (result) {
                // Do any magic you need
                q.resolve(result);
            }, function (err) {
                q.reject(err);
            }, options);

            return q.promise;
        }
    }
});
