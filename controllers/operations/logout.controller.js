"use strict";

module.exports = {
    get: {
        json: function (req, res) {
            req.logout();
            res.send("Logged out");
        }
    }
};
