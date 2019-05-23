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