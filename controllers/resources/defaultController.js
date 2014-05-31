"use strict";

var _ = require("underscore"),
    SearchResults = require("../../lib/searchResults.js"),
    SearchResult = require("../../lib/searchResult.js"),
    passport = require("passport");

function removeSpecialPropertiesFromFilterObject(filterObject) {
    _.each(filterObject, function (value, propertyName, object) {
        if (propertyName.indexOf('_') === 0) {
            delete object[propertyName];
        }
    });

    return filterObject;
}

// TODO: these conversions are MongoDB specific -> move to models
function reformatFilters(filterObject) {
    var result = {};
    _.each(filterObject, function(values, propertyName, object) {
        if (!result[propertyName]) {
            result[propertyName] = {};
        }

        if (!Array.isArray(values)) {
            values = [values];
        }

        _.each(values, function(value) {
            if (value.indexOf('>=') === 0) {
                result[propertyName]["$gte"] = value.substring(2);
            } else if (value.indexOf('<=') === 0) {
                result[propertyName]["$lte"] = value.substring(2);
            } else if (value.indexOf('>') === 0) {
                result[propertyName]["$gt"] = value.substring(1);
            } else if (value.indexOf('<') === 0) {
                result[propertyName]["$lt"] = value.substring(1);
            } else {
                result[propertyName] = value;
            }
        });
    });

    return result;
}

function stripPrivateData(dataObject) {
    var strippedData = {}

    // TODO: MongoDB specific? Move to models?
    strippedData['id'] = dataObject['_id'];

    for (var property in dataObject) {
        if (property[0] != "_") {
            strippedData[property] = dataObject[property]
        }
    }
    return strippedData;
}

function fetchReferencedDocuments(document, modelDefinition, propertiesToFetch, callback) {
    if (_.isString(propertiesToFetch)) {
        propertiesToFetch = [propertiesToFetch]
    }

    var propertyDataFetched = _.after(propertiesToFetch.length, function () {
        callback(document);
        return;
    });

    _.each(propertiesToFetch, function (propertyToBeFetched) {
        var resultObjectData = document[propertyToBeFetched];

        if (!modelDefinition[propertyToBeFetched]) {
            propertyDataFetched();
            return;
        }

        var referencedCollectionName =
            modelDefinition[propertyToBeFetched].referencedCollection;

        if (!referencedCollectionName || resultObjectData === undefined) {
            propertyDataFetched();
            return;
        }

        // TODO: MongoDB specific => move to configuration
        var referencedModel = require('../../models/mongo/models')[referencedCollectionName];

        var fetchListOfDocuments = Array.isArray(resultObjectData);

        var documentsToFetch = fetchListOfDocuments ?
            resultObjectData.length : 1;

        var propertyDocumentFetched = _.after(documentsToFetch, function () {
            propertyDataFetched();
        });

        if (fetchListOfDocuments) {
            document[propertyToBeFetched] = Array();

            _.each(resultObjectData, function (documentId) {
                referencedModel.find({_id: documentId},
                    function (error, foundDocuments) {
                        if (error) {
                            console.log(error)
                            propertyDocumentFetched();
                            return;
                        }

                        if (!foundDocuments || !Array.isArray(foundDocuments) ||
                            foundDocuments.length != 1 || !foundDocuments[0].toObject) {
                            console.log("Error fetching document with id", documentId);
                            propertyDocumentFetched();
                            return;
                        }

                        document[propertyToBeFetched].push(
                            stripPrivateData(foundDocuments[0].toObject()));
                        propertyDocumentFetched();
                    });
            });
        } else {
            referencedModel.find({_id: resultObjectData},
                function (error, foundDocuments) {
                    if (error) {
                        console.log(error);
                        propertyDocumentFetched();
                        return;
                    }

                    if (!foundDocuments || !Array.isArray(foundDocuments) ||
                        foundDocuments.length != 1 || !foundDocuments[0].toObject) {
                        //console.log("Error fetching document with id", documentId);
                        propertyDocumentFetched();
                        return;
                    }

                    document[propertyToBeFetched] =
                        stripPrivateData(foundDocuments[0].toObject());

                    propertyDocumentFetched();
                });
        }
    });
}

module.exports = function (model) {
    var controller = {};

    controller["/"] = {
        get: {
            json: function (req, res) {
                if (req.query._q) {
                    var searchString = req.query._q;
                    var searchOptions = {};
                    var fetch = req.query._fetch;

                    req.query = removeSpecialPropertiesFromFilterObject(req.query);
                    req.query = reformatFilters(req.query);

                    if (req.query.length > 1) {
                        // additional query parameters passed in addition to q => define filters for the text search
                        searchOptions.filter = req.query;
                    }

                    model.search(searchString, searchOptions, function(data) {
                        var results = new SearchResults;

                        if (!data.stats.nfound) {
                            console.log("No results returned. Is text search enabled?");
                            return res.send([]);
                        }

                        results.total = data.stats.nfound;

                        var resultFetched = _.after(results.total, function() {
                            res.send(results);
                        });

                        _.each(data.results, function(result, index) {
                            var searchResult = new SearchResult;
                            searchResult.score = result.score;

                            searchResult.object = stripPrivateData(result.obj.toObject());

                            if (_.isString(fetch)) {
                                fetch = [fetch];
                            }

                            if (fetch && fetch.length > 0) {
                                fetchReferencedDocuments(result.obj, model.definition, fetch,
                                        function(document) {
                                    results.results.push(document);
                                    resultFetched();
                                });
                            } else {
                                results.results.push(searchResult);
                                resultFetched();
                            }
                        });
                    });
                } else {
                    var fetch = req.query._fetch;
                    req.query = removeSpecialPropertiesFromFilterObject(req.query);
                    req.query = reformatFilters(req.query);

                    model.find( req.query, function ( err, data ) {
                        if (err) {
                            return res.send(err);
                        }

                        var results = [];

                        var resultFetched = _.after(data.length, function() {
                            return res.send(results);
                        });

                        _.each(data, function(result, index) {
                            var strippedDocument = stripPrivateData(result.toObject());

                            if (_.isString(fetch)) {
                                fetch = [fetch];
                            }

                            if (fetch && fetch.length > 0) {
                                fetchReferencedDocuments(strippedDocument, model.definition, fetch,
                                    function(document) {
                                        results.push(strippedDocument);
                                        resultFetched();
                                    });
                            } else {
                                results.push(strippedDocument);
                                resultFetched();
                            }
                        });
                    });
                }
            }
        },
        post: {
            json: function (req, res) {
                if (req.body) {
                    model.create(req.body, function (data) {
                        res.send(stripPrivateData(data.toObject()));
                    });
                }
            }
        },
        put: {
            json: function (req, res) {
                model.updateAll(req.query, req.body, function (data) {
                    res.send(data);
                });
            }
        },
        'delete': {
            json: function (req, res) {
                if (req.query) {
                    model.removeAll(req.query, function (data) {
                        res.send(data);
                    });
                }
            }
        }
    }

    controller["/definition"] = {
        get: {
            json: function (req, res) {
                console.log("Returning definition");
                res.send(model.definition);
            }
        }
    }

    controller["/:id"] = {
        get: {
            json: function (req, res) {
                console.log("Trying to find with index: " + req.params.id)
                var fetch = req.query._fetch;

                // TODO: refactor to use findOne
                model.find({"_id": req.params.id}, function (err, foundDocuments) {
                    if (foundDocuments === undefined || foundDocuments.length != 1 || err) {
                        console.log(err);
                        res.send(404, err);
                    } else {
                        var document = stripPrivateData(foundDocuments[0].toObject());

                        // If only one fetch parameter is defined, it will show as a string here.
                        // Thus we need to make an array from the parameter.
                        if (_.isString(fetch)) {
                            fetch = [fetch];
                        }

                        if (fetch && fetch.length > 0) {
                            fetchReferencedDocuments(document, model.definition, fetch,
                                function(documentWithFetchedProperties) {
                                    res.send(documentWithFetchedProperties);
                                });
                        } else {
                            res.send(document);
                        }
                    }
                });
            }
        },
        post: {
            json: function (req, res) {
                console.error('Request makes no sense!');
            }
        },
        put: {
            json: function (req, res) {
                console.log("Trying to update " + req.params.id + " with: ", req.body)

                model.update(req.params.id, req.body, function (data) {
                    res.send(data);
                });
            }
        },
        'delete': {
            json: function (req, res) {
                console.log("Trying to delete " + req.params.id)

                model.remove(req.params.id, function (data) {
                    res.send(data);
                });
            }
        }
    }

    controller["/:id/:property"] = {
        get: {
            json: function (req, res) {
                console.log("Trying to get " + req.params.property + " from index: " + req.params.id)

                model.find({"_id": req.params.id}, function (data) {
                    console.log(data)
                    if (data && data[0] && data[0][req.params.property]) {
                        if (_.isString(fetch)) {
                            fetch = [fetch];
                        }

                        if (fetch && fetch.length > 0) {
                            fetchReferencedDocuments(result, model.definition, fetch,
                                function(document) {
                                    results.push(result);
                                    resultFetched();
                                });
                        } else {
                            results.push(result);
                            resultFetched();
                        }
                        res.send(data[0][req.params.property]);
                    } else {
                        res.send({});
                    }
                });
            }
        },
        post: {
            json: function (req, res) {
                console.log("POST not implemented for properties. Use POST for object.")
            }
        },
        put: {
            json: function (req, res) {
                console.log("PUT not implemented for properties. Use PUT for object.")
            }
        },
        'delete': {
            json: function (req, res) {
                console.log("DELETE makes no sense for property! Maybe you want to use DELETE for the object?")
            }
        }
    }

    return controller
};
