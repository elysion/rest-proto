"use strict";

var Principal = require("../models/mongo/models.js").principal,
    uuid = require('node-uuid');

module.exports = {
    generateEmailVerificationCode: function () {
        return uuid.v4();
    }
};
