# backend-organization-api
A backend API to use CRUD operations for organizations built using nodejs and expressjs

## Prerequisites
* Node.js : A JavaScript runtime built on Chrome's V8 JavaScript engine. Brings JavaScript to the server
* MongoDB : A document-based open source database
* Express.js : A fast, minimalist web framework for Node.js
* [Postman](https://www.getpostman.com/) : For testing the HTTP endpoints 

Please make sure that the tech stack are installed before moving on.

## Initiating the application
To initiate the project create an empty folder for the project:

```shell
$ mkdir backend-organization-api
```

Change into that newly created folder:

```shell
$ cd backend-organization-api
```

Now let's create a **package.json** inside that folder:

```shell
$ npm init -y
```

### Node JS Dependencies
To first set up this application there are few dependencies that we will be using which are: 
* express : Fast, lightweight web framework for Node.js
* body-parser : Node.js body parsing middleware (Basically if you need to access the req.body you will need this)
* cors : CORS is a node.js package for providing an Express middleware that can be used to enable CORS with various options. Cross-origin resource sharing (CORS) is a mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served.
* mongoose : A Node.js framework which lets us access MongoDB in an object-oriented way.
* dotenv : Module that loads environment variables from a `.env` file into `process.env`

Now that the **package.json** is available in the project folder, add the dependcies we needed :

```shell
$ npm install express body-parser cors mongoose dotenv
```

* nodemon : Utility that will monitor for any changes in the source code and automatically restart the server (execute with -g for it to install globally)

```shell
$ npm install -g nodemon
```

Inside the folder create a new file named **server.js** and insert the following : 

```javascript
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

app.use(cors());
app.use(bodyParser.json());

app.listen(process.env.app_port, ()=>{
    console.log(`Server is running on port ${process.env.app_port}`);
})
```

### Installing MongoDB
On MacOS this task can be completed using the command :

```shell
$ brew install mongodb
```

For Linux/Windows you can follow the instruction from 
[MongDB installation](https://docs.mongodb.com/manual/administration/install-community/)

We will then create a data directory which is use by MongoDB"

```shell
$ mkdir -p /data/db
```

Execute the following command to start up MongoDB:

```shell
$ mongod
```

### Creating a new MongoDB Database
The next step is to create a database instance, connect to the database server using the MongoDB client on the command line:

```shell
$ mongo
```

After the client has started, use the following command to create a new database with the name **organization**:

```
use organization
```

### Creating a new user for organization database
We will create a user with admin privileges and only accessible to the organization database by running the following in mongo:

```
db.createUser(
    {
        user: "*your user*",
        pwd: "*your password*",
        roles:[{
            role: "userAdmin",
            db: "organization"
        }]
    }
)
```

This will be later on use for mongoose authentication

### Connecting to MongoDB by using Mongoose
Add in the following in **server.js** : 

```javascript
dotenv.config();

// database
var options = {
    user: process.env.db_user,
    pass: process.env.db_pass
}
mongoose.connect(`mongodb://${options.user}:${options.pass}@${process.env.host}:${process.env.db_port}/${process.env.db_name}`, {useNewUrlParser: true});
const connection = mongoose.connection;
connection.once('open', ()=>{
    console.log('MongoDB database connection established successfully')
})
```

### Creating a Mongoose Schema
By using Mongoose we are able to access the MongoDB database in object-oriented way. Create a new file **organization.model.js** and insert the following lines to create a schema :

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let organization = new Schema({
    name: {type: String},
    comments: [{type: String}],
    member: [{
        username: String,
        followers: Number,
        following: Number,
        avatar: String,
        active: Boolean
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('organization', organization);
```

### Implementing the Server Endpoints
To set up the endpoints we need to create an instance of the Express Router by adding the following lines : 

```javascript
const infoRoutes = express.Router();
```

This will call the mongoose schema we created in **organization.model.js** by adding in **server.js** :

```javascript
let organization = require('./organization.model');
```

The router will be added as a middleware and will take contril of request starting with path /orgs :

```javascript
app.use('/orgs', infoRoutes);
```

First of all in the database currently there are no information, we can start with creating an endpoint which will create and insert into the database :

```javascript
infoRoutes.route('/add').post((req, res)=>{
    let org = new organization(req.body);
    org.save()
        .then(org=>{
            res.status(200).json({'Organization': 'Successfully added'});
        })
        .catch(err=>{
            res.status(400).send('Adding new organization failed');
        });
});
```

First of all we need to add an endpoint which is delivering all available organization items :

```javascript
infoRoutes.route('/').get((req, res)=>{
    organization.find((err, org)=>{
        if(err){
            console.log(err);
        }else{
            res.json(org);
        }
    });
});
```
In this case we’re calling organization.find to retrieve a list of all todo items from the MongoDB database. Again the call of the find methods takes one argument: a callback function which is executed once the result is available. Here we’re making sure that the results (available in organization) are added in JSON format to the response body by calling res.json(org)

Next endpoint we will retrieve is */:name*. This path is to retrieve a specific organization by providing a name. The codes are as follow :

```javascript
infoRoutes.route('/:name').get((req, res)=>{
    let name = req.params.name;
    organization.find({name: new RegExp('^' + name + '$', "i")}, (err, org)=>{
        res.json(org);
    });
})
```
The name can be ass via *req.params.name*. We will then proceed with *organization.find* to retrieve the item based on it's name and will be attached to HTTP response in JSON format.

Next, we will add an endpoint that is to retrieve all the members of a particulared organization and ordered the result in descending order based on the number of followers

```javascript
infoRoutes.route('/:name/members').get((req, res)=>{
    let name = req.params.name;
    organization.aggregate([
        {"$unwind": "$member"},
        {"$match": {"name": name}},
        {"$sort": {"member.followers": -1}},
        {"$group": {
            "_id": "$_id",
            "member": {
                "$push": "$member"
            }
        }}
    ]).exec((err, org)=>{
        res.json(org);
    })  
});
```
We will create a one(1) endpoint for the comments for a particular organization which will be handling HTTP requests for GET, POST and DELETE. The same as before we will be using name to search for the organization :

```javascript
infoRoutes.all('/:name/comments', (req, res)=>{
    if(req.method === 'GET'){
        // retrieve all the comment registered against the organization
        let name = req.params.name;
        organization.find(
            {
                $and: [
                    {name: new RegExp('^' + name + '$', "i")}, 
                    {'isDeleted': false} 
                ]
            }, 
            {'_id': 0,'comments': 1, 'isDeleted': 1}, 
            (err, org)=>{
                res.json(org);
            }
        );
    }else if (req.method === 'POST'){
        // add new comment for an organization
        organization.findOneAndUpdate(
            {name: new RegExp('^' + req.params.name + '$', "i")},
            {$push: {
                'comments': req.body.comments
                }
            },
            {safe: true, upsert: true},
            (err, org)=>{
                if(err){
                    console.log(err);
                }else{
                    res.status(200).send('Comments added!');
                }
            }
        );
    }else if(req.method === 'DELETE'){
        // soft delete
        organization.findOneAndUpdate(
            {name: new RegExp('^' + req.params.name + '$', "i")},
            {$set: {
                'isDeleted': true
                }
            },
            {safe: true, upsert: true},
            (err, org)=>{
                if(err){
                    console.log(err);
                }else{
                    res.status(200).send('Comments deleted!');
                }
            }
        );
    }
})
```

Here you can see that all of the request are accessing the same endpoint, and we will check what type of request it is based on *req.method*. In DELETE request, we are not actually removing it from the document (mongoDB) instead we are trying to achieve a "soft delete" which we are updating the flag (defined in the mongoose schema we created) and it will not return any comments from that particular organization when the flag (isDeleted) has set to true. This is so that later on there are available for emergency retrieval. 

### Securing the sensitive information
From the code you can see that there is a dependency that is called dotenv. This is so that the module can load environment variables from a `.env` file into `process.env`.
In the root of your project folder, create a `.env` file and insert as follow :

```env
NODE_ENV=development
app_port=5000
host=localhost
db_port=27017
db_name=organization
db_user= <your username created in the beginning>
db_pass= <your password>
```

From the **server.js** you can access the information stored in the `.env` file by accessing thru javascript `process.env` :

```javascript
dotenv.config();

var options = {
    user: process.env.db_user,
    pass: process.env.db_pass
}
```

And from mongoose you can see that the information is not revealed but rather just access thru the variables :

```javascript
mongoose.connect(`mongodb://${options.user}:${options.pass}@${process.env.host}:${process.env.db_port}/${process.env.db_name}`, {useNewUrlParser: true});
```

Finally, in the following you can see the complete code of server.js and organization.model.js :

```javascript
// server.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
app.use(cors());
app.use(bodyParser.json());

// database
var options = {
    user: process.env.db_user,
    pass: process.env.db_pass
}
mongoose.connect(`mongodb://${options.user}:${options.pass}@${process.env.host}:${process.env.db_port}/${process.env.db_name}`, {useNewUrlParser: true});
const connection = mongoose.connection;
connection.once('open', ()=>{
    console.log('MongoDB database connection established successfully')
})

// app
app.listen(process.env.app_port, ()=>{
    console.log(`Server is running on port ${process.env.app_port}`);
})

// server endpoints
const infoRoutes = express.Router();
let organization = require('./organization.model');
app.use('/orgs', infoRoutes);

// retrieve list of all user from all organization 
infoRoutes.route('/').get((req, res)=>{
    organization.find((err, org)=>{
        if(err){
            console.log(err);
        }else{
            res.json(org);
        }
    });
});

// retrieve the information of an organization
infoRoutes.route('/:name').get((req, res)=>{
    let name = req.params.name;
    organization.find({name: new RegExp('^' + name + '$', "i")}, (err, org)=>{
        res.json(org);
    });
})

// retrieve all the members of an organization ordered by number of followers 
// in descending order
infoRoutes.route('/:name/members').get((req, res)=>{
    let name = req.params.name;
    organization.aggregate([
        {"$unwind": "$member"},
        {"$match": {"name": name}},
        {"$sort": {"member.followers": -1}},
        {"$group": {
            "_id": "$_id",
            "member": {
                "$push": "$member"
            }
        }}
    ]).exec((err, org)=>{
        res.json(org);
    })  
});

infoRoutes.all('/:name/comments', (req, res)=>{
    if(req.method === 'GET'){
        // retrieve all the comment registered against the organization
        let name = req.params.name;
        organization.find(
            {
                $and: [
                    {name: new RegExp('^' + name + '$', "i")}, 
                    {'isDeleted': false} 
                ]
            }, 
            {'_id': 0,'comments': 1, 'isDeleted': 1}, 
            (err, org)=>{
                res.json(org);
            }
        );
    }else if (req.method === 'POST'){
        // add new comment for an organization
        organization.findOneAndUpdate(
            {name: new RegExp('^' + req.params.name + '$', "i")},
            {$push: {
                'comments': req.body.comments
                }
            },
            {safe: true, upsert: true},
            (err, org)=>{
                if(err){
                    console.log(err);
                }else{
                    res.status(200).send('Comments added!');
                }
            }
        );
    }else if(req.method === 'DELETE'){
        // soft delete
        organization.findOneAndUpdate(
            {name: new RegExp('^' + req.params.name + '$', "i")},
            {$set: {
                'isDeleted': true
                }
            },
            {safe: true, upsert: true},
            (err, org)=>{
                if(err){
                    console.log(err);
                }else{
                    res.status(200).send('Comments deleted!');
                }
            }
        );
    }
})

// add new organization
infoRoutes.route('/add').post((req, res)=>{
    let org = new organization(req.body);
    org.save()
        .then(org=>{
            res.status(200).json({'Organization': 'Successfully added'});
        })
        .catch(err=>{
            res.status(400).send('Adding new organization failed');
        });
});
```

```javascript
// organization.model.js for mongoose schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let organization = new Schema({
    name: {type: String},
    comments: [{type: String}],
    member: [{
        username: String,
        followers: Number,
        following: Number,
        avatar: String,
        active: Boolean
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('organization', organization);
```