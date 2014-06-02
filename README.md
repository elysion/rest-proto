# REST backend for rapid prototyping

A server implemented with Node.js that can be used for rapid generation of a REST(ish) APIs. The example server
implementation can be used to expose a MongoDB database as a REST backend. The implementation provides basic CRUD
operations as well as filtering, text search (with MongoDB text search) and basic user credential management. There
are a couple of more advanced features supported by the implementation that are not that common in REST backends:

* Filtering supports comparison operators.
* A referenced resource can be inlined to the response.
* Properties of resources can be accessed directly using the /resources/resource/property url.

The goal of this project is to provide an easy to setup and use, but yet versatile REST backend implementation that
can be used as reference for other REST backend implementations. However, at least currently, JSON is used as the
format of the resource documents and thus the implementation is not purely RESTful.

The backend was originally implemented as a part of http://http://beatsy.co. Many thanks to Anssi Uimonen for allowing
us to open source the project! The original implementation team consisted of: Anssi Uimonen (@anssiuimonen),
Viljami Peltola (@viljami), Miko Kiiski (@elysion) and Joni Saarela (@Jonzki).

## TODO

* Clean up code! The current implementation is messy to put it lightly.
** Remove plural from resource paths.
* Remove Mandrill dependency.
* Implement tests.
* Add validation for incoming data.
* Replace PUT to resource path (e.g. resources/foobars/) with PATCH.
* Add partial update for individual resource (e.t. /resources/foobars/{id}) with POST.
* Add oauth & basic auth.
* Add statistics gathering.
* Implement proxy models (probably have to be implemented with blocking requests?).
* Parametrize search so that it can be used for proxy also,
* Implement proper error handling.
* Implement accepts header handling.

## REST API

The REST API is divided into two separate parts: resources and operations.
* Resources represent the data in the database.
* Operations are used for things like login, logout, etc. that do not represent specific entities within the system.

Resources can be accessed by making HTTP requests to the /resources/ path. Operations are available from the
/operations/ path. The file names of the operations controllers in /rest/controllers/operations are used for the paths
i.e. login.controller.js will be called when an HTTP request is made to /operations/login/.

The REST API defines seven different cases for accessing resources:

1. GET to /resources/foobars/
  * This lists all the foobars in the system.
2. POST to /resources/foobars/
  * Add a new foobar to the system.
3. PUT to /resources/foobars/
  * Update ALL foobars in the system. The fields to be updated and the values to be set are specified in the request
    body.
4. DELETE to /resources/foobars/
  * Delete ALL foobars in the system.

5. GET to /resources/foobars/102398123098
  * Get foobar with id 102398123098.
6. PUT to /resources/foobars/102398123098
  * Update foobar with id 102398123098.
7. DELETE to /resources/foobars/102398123098
  * Delete foobar with id 102398123098.

The core idea of the backend is to rapidly develop a REST backend that interfaces with a database, other services,
the filesystem etc. When a new resources are added or changes are made to existing resources, minimal changes should be
required to be made to the code. In the case of the example MongoDB implementation, only one schema definition file
needs to be added / changed.

If custom handling of data is needed for a resource, a custom controller file can be added to
/rest/controllers/customControllers. To override the default behaviour of resource handling, add a controller to the
aforementioned folder with a name matching the name of the resource (e.g. in the case of the MongoDB implementation, the
controller should be named according to the schema JSON file in models/mongo/schemas).

## MongoDB example implementation

The process from schema to REST API:
1. All the json files in the schemas folder are read. These are used to create the database schemas and models.
2. A controller that handles access to the model is created using /rest/controllers/resources/defaultController.js.
3. If a custom controller for the model is found under /rest/controllers/customControllers/, the behaviour defined
   in the defaultController.js is overridden with the custom handler implementation. The custom controller is loaded
   according to the name of the schema json file name i.e. for artist.json the controllers.js logic tries to load a file
   named artist.controller.js.
4. Routes for the controllers instantiated in controllers.js are iterated in routes.js and app.routes is updated
   accordingly. This means that i.e. trying to access /resources/artists/ the request is forwarded to the artist
   controller methods (custom or default).

What all the above means is that by adding a foobar.json to models/mongo/schemas/ folder you add a foobar resource to
the REST API making it possible to add new foobars to the database by making a POST request to /resources/foobars,
fetching the list of all foobars by making a GET request to /resources/foobars etc.

## Authentication

Passport-local-mongoose is used for user authentication. This node module creates hashes and salts for password storage.
This is however not currently used for authentication as such, but rather provided as an example on how to store
credentials and check that they are valid.

## Default Routes

* http://localhost:3000/operations/printRoutes/ - see all routes
* http://localhost:3000/resources/users/?q=search_string - search users using free text search
* http://localhost:3000/resources/users/ - all users ( GET )
* http://localhost:3000/resources/users/ - create an user ( POST )
* http://localhost:3000/resources/users/ - delete all users ( DELETE )
* http://localhost:3000/resources/users/:id - update one user ( PUT )
* http://localhost:3000/resources/users/:id - delete one users ( DELETE )
* http://localhost:3000/resources/users/definition/ - user schema definition

## Folders

 * controller - control logic
 * lib - libraries and helpers
 * models - model implementations
 * routes - urls of the app
 * scripts - utility script files used for e.g. starting the server and repairing MongoDB
 * templates - handlebars templates

## Dependencies

 * nodejs
 * npm
 * mongodb

## Setup

    npm install

## Running

    start mongodb with mongod --setParameter textSearchEnabled=true, if not already running
    npm start


