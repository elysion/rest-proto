"use strict";

var PrincipalDBModel = require("../../models/mongo/models.js").principal.databaseModel;
// TODO: remove mandrill dependency
var mandrill = require('node-mandrill')('TODO');
var handleBars = require('handlebars');
var fs = require('fs');
var uuid = require('node-uuid');

module.exports = {
    post: {
        json: function (req, res) {
            var email = req.body.email;
            var password = req.body.password;

            var user = PrincipalDBModel.find({email: req.body.email}, function(error, foundPrincipals) {
                if (error) {
                    console.log(error);
                    return res.send({"success": false, "error": error});
                }
                if (!foundPrincipals || !Array.isArray(foundPrincipals || foundPrincipals.length == 0)) {
                    return res.send({"success": false, "error": "Principal not found for email: " + email});
                }

                var principal = foundPrincipals[0];

                // If there is no password defined in the request, generate a new one using uuid
                if (password === undefined) {
                    password = uuid.v4();
                }

                principal.setPassword(password, function(error, principal) {
                    if (error) {
                        return res.send({"success": false, "error": error});
                    }

                    principal.save(function(error) {
                        if (error) {
                            return res.send({"success": false, "error": error});
                        }

                        var passwordResetTemplateSource =
                            fs.readFileSync(__dirname + '/../../templates/email/password_reset.hbs');
                        var passwordResetTemplate = handleBars.compile(passwordResetTemplateSource.toString());

                        var data = { "password": password };
                        var emailContent = passwordResetTemplate(data);

                        mandrill('/messages/send-template', {
                            template_name: "user-information-template", // TODO: set correct template
                            template_content: [{name: "main", content: emailContent}],
                            message: {
                                from_email: "noreply@app.com",
                                to: [{email: principal.email}]
                                // to: "contact@app.com" // TODO: Replace with the upper for production!
                            }
                        }, function(error, response) {
                            console.log(error, response);
                            return res.send({"success": true});
                        });
                    });
                });
            });
        }
    }
};
