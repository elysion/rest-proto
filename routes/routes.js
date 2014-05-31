"use strict";

var _ = require('underscore'),
    controllers = require('../controllers/controllers');

// TODO: add patch
var supportedMethods = ['get', 'post', 'put', 'delete'];

module.exports = function (app) {

    _.each(controllers.resources, function (controller, controllerName) {
        console.log("Adding routings for controller: ", controllerName);

        // TODO: remove plural
        // might want to use the collection name of mongoose, some plurals will look better
        var resourceRootPath = "/resources/" + controllerName + "s";

        _.each(controller, function (handler, relativePath) {
            if (relativePath == "/definition") {
                console.log("Routing: get " + resourceRootPath + "/definition");
                app["get"](resourceRootPath + "/definition", handler["get"].json);
                return;
            }

            _.each(supportedMethods, function (method) {
                if (handler[method] && handler[method].json) {
                    console.log("Routing: " + method + " " + resourceRootPath + relativePath);
                    if (handler[method].authenticate) {
                        console.log("Routing with authentication");
                        app[method](resourceRootPath + relativePath, handler[method].authenticate, handler[method].json);
                    } else {
                        console.log("Routing without authentication");
                        app[method](resourceRootPath + relativePath, handler[method].json);
                    }
                }
            });
        });
    });

    _.each(controllers.operations, function (handler, operationName) {
        _.each(supportedMethods, function (method) {
            if (handler[method] && handler[method].json) {
                console.log("Routing: " + method + " /operations/" + operationName)
                if (handler[method].authenticate) {
                    console.log("Routing with authentication");
                    app[method]("/operations/" + operationName, handler[method].authenticate, handler[method].json);
                } else {
                    console.log("Routing without authentication");
                    app[method]("/operations/" + operationName, handler[method].json)
                }
            }
            // TODO: might need a more generic way of assigning handlers for different content types
        });
    });
};
