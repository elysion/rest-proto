"use strict";

var PrincipalDBModel = require("../../models/mongo/models.js").principal.databaseModel,
    passport = require("passport"),
    Principal = require("../../models/mongo/models.js").principal;

module.exports = {
    post: {
        json: function (req, res) {
            var authenticate = PrincipalDBModel.authenticate();

            authenticate(req.body.username, req.body.password, function (err, user, message) {
                if (err) console.log(err);

                if (user) {
                    res.send({"username": user.email, "id": user._id});
                } else {
                    res.send({"error": err, "message": message});
                }
            });
        }
    }
};
