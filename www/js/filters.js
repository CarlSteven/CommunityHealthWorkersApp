'use strict';

/* Filters */
var vmaFilterModule = angular.module('vmaFilterModule', []);

vmaFilterModule.filter('getById', function () {
    return function (input, id) {
        var i = 0, len = input.length;
        for (; i < len; i++) {
            if (+input[i].id == +id) {
                return input[i];
            }
        }
        return null;
    }
});

vmaFilterModule.filter('getByName', function () {
    return function (input, name) {
        var i = 0, len = input.length;
        for (; i < len; i++) {
            if (input[i].name == name) {
                return input[i];
            }
        }
        return null;
    }
});

vmaFilterModule.filter('getTasksByGroupId', function () {
    return function (input, id) {
        var returnArray = [];
        var i = 0, len = input.length;
        for (; i < len; i++) {
            if (+input[i].location_id == +id) {
                returnArray.push(input[i]);
            }
        }
        return returnArray;
    }
});

vmaFilterModule.filter('getByGroupId', function () {
    return function (input, id) {
        var returnArray = [];
        var i = 0, len = input.length;
        for (; i < len; i++) {
            if (+input[i].group_id == +id) {
                returnArray.push(input[i]);
            }
        }
        return returnArray;
    }
});

vmaFilterModule.filter('removeJoined', function () {
    return function (input) {
        var returnArray = [];
        var i = 0, len = input.length;
        for (; i < len; i++) {
            if (!input[i].joined) {
                returnArray.push(input[i]);
            }
        }
        return returnArray;
    }
});

vmaFilterModule.filter('convertToIndex', function () {//id=badgeconfig
    return function (input, id) {
        var returnArray = [];
        if (input == null || id == null) {
            return null;
        }
        var i = 0, len = input.length;
        for (; i < len; i++) {
            for (var a = 0; a < id.length; a++) {
                if (id[a] === (input[i]).name) {
                    returnArray.push(a);
                }
            }
        }
        return returnArray;
    }
});

vmaFilterModule.filter('selectCores', function () { //array of what the user wants, and array have.COMPARE the two for similarities
    return function (classes, output) {
        var returnArray = [];
        if (output == null || classes == null || output.length == 0) {
            return classes;
        }
        for (var i = 0; i < classes.length; i++) {
            var added = false;
            if (classes[i].cores != null && !added && classes[i].cores.length != 0) {
                for (var j = 0; j < classes[i].cores.length && !added; j++) {
                    for (var a = 0; a < output.length && !added; a++) {
                        if ((output[a]) == (classes[i].cores[j])) {
                            returnArray.push(classes[i]);
                            added = true;
                        }
                    }
                }
            } else if (classes[i].cores.length == 0) {
                returnArray.push(classes[i]);
            }
        }

        return returnArray;
    }
});
