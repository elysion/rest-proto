var _ = require('underscore'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    process = require('process');

process.on('uncaughtException', function (err) {
    console.log('REST backend Caught an exception: ', err, err.stack);
});

(function () {
    "use strict";

    var express = require('express'),
        mongoose = require('mongoose');

    var app = express();

    // Settings
    global.app = app;

    // TODO: cookies should not be needed for the REST backend => remove
    app.configure(function () {
        app.use(express.cookieParser());
        app.use(express.cookieSession({ secret: '7dd5f8f02fb52fea4cb440eddbe88eaf' })); // has to be before router
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(app.router);
    });

    // Database
    app.set('db-uri', 'mongodb://localhost/rest-proto');
    mongoose.connect(app.set('db-uri'));

    // TODO: MongoDB specific => move to models?
    // Access the mongoose-dbref module and install everything
    var dbref = require("mongoose-dbref");
    var utils = dbref.utils;
    var loaded = dbref.install(mongoose);
    var PrincipalDBModel = require('./models/mongo/models').principal.databaseModel;
    passport.use(new LocalStrategy(PrincipalDBModel.authenticate()));
    passport.serializeUser(PrincipalDBModel.serializeUser());
    passport.deserializeUser(PrincipalDBModel.deserializeUser());

    // Routes
    require('./routes/routes.js')(app);

    // Start the App
    var port = process.env.npm_package_config_restPort || 3000;
    app.listen(port);
    console.log('Server started, port ' + port);
})();
