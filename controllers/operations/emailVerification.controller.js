"use strict";

var Principal = require("../../models/mongo/models.js").principal,
    passport = require("passport"),
    uuid = require('node-uuid');

module.exports = {
    post: {
        json: function (req, res) {

            if (!req.body.id || !req.body.code) {
                return res.send({success: false, message: "ID or code missing!"});

            } else {
                Principal.find({_id: req.body.id}, function (error, principals) {

                    if (error) {
                        return res.send(error);

                    } else {
                        if (principals[0].emailVerificationCode === req.body.code) {
                            Principal.update(principals[0].id, {emailVerified: true}, function (error, principal) {

                                if (error) {
                                    return res.send(error);

                                } else {
                                    return res.send(principal);
                                }
                            });

                        } else {
                            return res.send({success: false, message: "Code does not match!"});
                        }
                    }
                });
            }
        }
    }
};
