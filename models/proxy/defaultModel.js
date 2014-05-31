var _ = require("underscore"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId


// TODO: add lastModified & created dates to object
module.exports = function (dbModel) {
    return {
        /**
         }
         Creates one new item to model.
         @returns created item.
         */
        create: function (o, callback) {
            if (!o && !callback) return;
            if (!o) callback(null);
            // Model.create(doc, fn)
            console.log('create:', o);
            dbModel.create(o, function (err, obj) {
                if (err && callback) {
                    callback(err);
                } else if (callback) {
                    callback(obj);
                }
            });
        },
        /**
         *    Finds anything from model.
         *    @returns item found or null or error message if something went wrong.
         */
        find: function (o, callback) {
            var found = false;

            if (!callback) return;
            if (!o) {
                // Find all
                dbModel.find(function (err, objs) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, objs);
                    }
                });
            } else {
                // Model.find(conditions, [fields], [options], [callback])
                dbModel.find(o, function (err, obj) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, obj);
                    }
                });
            }
        },
        /**
         *    Updates one item in the model.
         *    @returns item updated or null or error message if something went wrong.
         */
        update: function (id, updateInfo, callback) {
            if (!callback) return;
            if (!updateInfo) callback(null);
            // Model.update(conditions, update, [options], [callback])
            delete updateInfo._id; // Can't update ObjectId

            dbModel.update({ _id: id }, updateInfo, function (error, numAffected) {
                if (error) {
                    callback(error);
                } else if (numAffected != 1) {
                    callback("Affected document count does not match one! Was: " + numAffected);
                } else {
                    callback(null, numAffected);
                }
            });
        },

        /**
         *    Updates one item in the model.
         *    @returns item updated or null or error message if something went wrong.
         */
        updateAll: function (filter, o, callback) {
            if (!callback) return;
            if (!o) callback(null);
            // Model.update(conditions, update, [options], [callback])
            delete o._id; // Can't update ObjectId
            dbModel.update(filter, o, {multi: true}, function (err, obj) {
                if (err) {
                    callback(err);
                } else {
                    callback(obj);
                }
            });
        },

        /**
         *    Removes one item in the model.
         *    Returns item removed or null or error message if something went wrong.
         */
        remove: function (id, callback) {
            if (!callback) return;
            if (!id) callback(null);
            // Model.remove(conditions, [callback])
            dbModel.remove({ _id: id }, function (err, obj) {
                if (err) {
                    callback(err);
                } else {
                    callback(obj);
                }
            });
        },

        /**
         *    Removes all items in the model.
         *    @returns true or error message if something went wrong.
         */
        removeAll: function (filter, callback) {
            if (!callback) return;
            // Model.remove(conditions, [callback])
            dbModel.remove(filter, function (err, obj) {
                if (err) {
                    callback(err);
                } else {
                    callback(true);
                }
            });
        },

        /**
         * Make a text search to the database model.
         * @returns Mongoose text search result object
         */
        search: function (string, options, callback) {
            dbModel.textSearch(string, options, function (err, output) {
                if (err) callback(err);

                callback(output);
            });
        },

        /**
         * Returns the mongoose model that is used in this implementation
         */
        databaseModel: dbModel
    };
}
