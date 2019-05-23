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