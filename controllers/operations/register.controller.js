"use strict";

var PrincipalDBModel = require("../../models/mongo/models.js").principal.databaseModel;
var emailVerification = require("../../lib/emailVerification.js");
// TODO: move email sending logic to a separate module
var mandrill = require('node-mandrill')('TODO');
var handleBars = require('handlebars');
var fs = require('fs');

module.exports = {
    post: {
        json: function (req, res) {
            var user = new PrincipalDBModel({
                email: req.body.email
            });

            PrincipalDBModel.register(user, req.body.password, function (error, principal) {

                if (error) {
                    console.log(error);
                    return res.send({"success": false, "error": error});
                }

                principal.emailVerificationCode = emailVerification.generateEmailVerificationCode();
                principal.emailVerified = false;

                var emailContentTemplateSource = fs.readFileSync(__dirname + '/../../templates/email/artist_register.hbs');
                var emailContentTemplate = handleBars.compile(emailContentTemplateSource.toString());

                //Set handlebars {{}} specific data
                var data = { "username": principal.email, "user": {"id": principal.id }, "verificationCode": principal.emailVerificationCode };
                var emailContent = emailContentTemplate(data);

                mandrill('/messages/send-template', {
                    template_name: "user-information-template",
                    template_content: [{name: "main", content: emailContent}],
                    message: {
                        from_email: "noreply@app.com",
                        to: [{email: principal.email}]
                    }
                }, function(error, response) {
                    console.log(error, response);
                });

                principal.save(function (error, principal) {

                    if (error) {
                        res.send({"success": false, message: error});

                    } else {
                        res.send({"success": true, "email": principal.email, "id": principal._id});
                    }
                });
            });
        }
    }
};
