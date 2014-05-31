var _ = require('underscore'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    DBRef = mongoose.SchemaTypes.DBRef,
    fs = require('fs');

var createDefaultModelFromMongooseModel = require("./defaultModel.js");

var _models = {};

var files = fs.readdirSync(__dirname + '/../schemas/');
// TODO: refactor to use forEach
for (var i in files) {
    var definition = require('../schemas/' + files[i]);
    console.log('Schema Loaded: ', definition);

    var modelName = getModelNameFromFilename(modelName, files[i]);

    // TODO: how to return errors as this does not use a callback
    // Create default model
    var newModel = generateDefaultModel(modelName, definition);
    newModel["definition"] = definition;

    // TODO: is there need to do these asynchronously?
    var customModelLocation = "customModels/" + modelName + ".model";

    console.log("Trying to load custom model for " + modelName + " from ./" + customModelLocation);

    // Check if custom model exists
    if (fs.existsSync(__dirname + "/../models/" + customModelLocation + ".js")) {
        console.log("Overriding default behaviour for " + modelName);
        // Overwrite default model methods with custom model stuff
        var customModel = require("./" + customModelLocation);

        console.log("Custom model: ", customModel);

        if (customModel.find) {
            newModel.find = customModel.find;
        }
        if (customModel.create) {
            newModel.create = customModel.create;
        }
        if (customModel.update) {
            newModel.update = customModel.update;
        }
        if (customModel.remove) {
            newModel.remove = customModel.remove;
        }
    } else {
        console.log("Using default behaviour for " + modelName);
    }

    _models[modelName] = newModel;
}

function getModelNameFromFilename(filename) {
    return files[i].substr(0, files[i].indexOf("."));
}

function generateDefaultModel(modelName, schemaJSON) {
    var mongoDBSchemaDescription = {};

    for (var propertyName in schemaJSON) {
        if (propertyName[0] == "_") continue;

        var schemaProperty = schemaJSON[propertyName];
        var type = defineSchemaType(schemaProperty.type);
        mongoDBSchemaDescription[propertyName] = {
            "type": type
        };
    }

    var newSchema = Schema(mongoDBSchemaDescription);

    _.each(schemaJSON._plugins, function (options) {
        console.log("Loading plugin " + options.name + " for model: " + modelName);
        console.log("Options:", options);
        var plugin = require(options.name);
        newSchema.plugin(plugin, options.pluginParameters);
        _.each(options.schemaProperties, function (property, index) {
            newSchema[property.name] = property.value;
        });
    });

    console.log("Running initializations if any");

    _.each(schemaJSON._initialization, function (property, index) {
        console.log("Initialization for " + modelName, property);
        newSchema[property.function](property.value);
    });

    var model = mongoose.model(modelName, newSchema);

    return createDefaultModelFromMongooseModel(model);
}

function defineSchemaType(string) {
    var type = null;
    switch (string) {
        case "ObjectId":
            type = ObjectId;
            break;
        case "[ObjectId]":
            type = [ObjectId];
        case "DBRef":
            type = DBRef;
            break;
        case "[DBRef]":
            type = [DBRef];
            break;
        case "Array":
            type = Array;
            break;
        case "Date":
            type = Date;
            break;
        case "Boolean":
            type = Boolean;
            break;
        case "Number":
            type = Number;
            break;
        case "String":
            type = String;
            break;
        default:
            console.log("Unidentified type: " + string);
    }
    return type || String;
}

module.exports = _models;
