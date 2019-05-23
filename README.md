# backend-organization-api
A backend API to use CRUD operations for organizations built using nodejs and expressjs

## Tech stack
* Node.js : A JavaScript runtime built on Chrome's V8 JavaScript engine. Brings JavaScript to the server
* MongoDB : A document-based open source database
* Express.js : A fast, minimalist web framework for Node.js

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

## Node JS dependencies
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

## Installing MongoDB
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
