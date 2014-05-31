"use strict";

var _ = require('underscore'),
    fs = require('fs'),
    models = require('../models/mongo/models')

var createDefaultControllerFromModel = require("./resources/defaultController.js");

function resourcesControllers(models) {
    var controllers = {};

    _.each(models, function (model, modelName) { // })for(var modelName in models) {

        var controllerName = modelName;

        // TODO: how to return errors as this does not use a callback
        // add callback system... is there possibility for errors?
        // Create default model
        var newController = generateDefaultController(controllerName, model);

        // TODO: is there need to do these asynchronously?
        // Program startup: no. Everywhere else: yes.
        var customControllerLocation = "customControllers/" + controllerName + ".controller";

        console.log("Trying to load custom controller for " + controllerName + " from ./" + customControllerLocation);

        if (fs.existsSync(__dirname + "/../controllers/" + customControllerLocation + ".js")) {
            console.log("Overriding default behaviour for " + controllerName);

            var customController = require("./" + customControllerLocation)(model);

            console.log("Custom controller: ", customController);

            _.extend(newController, customController);
        } else {
            console.log("Using default behaviour for " + controllerName);
        }

        controllers[controllerName] = newController;
    });

    return controllers;
}

function operationsControllers() {
    var controllers = {},
        files = fs.readdirSync(__dirname + '/../controllers/operations');
    console.log('Operations: ', files);
    _.each(files, function (fileName, index) {
        var operationsController = require("./operations/" + fileName),
            controllerName = fileName.split('.controller.js')[0];
        controllers[controllerName] = operationsController;
    });
    return controllers;
}

var _controllers = {
    resources: resourcesControllers(models),
    operations: operationsControllers()
};

module.exports = _controllers; // { controllers: _controllers }

function generateDefaultController(name, model) {
    // we should create the markup based on the content type
    return createDefaultControllerFromModel(model);
}
