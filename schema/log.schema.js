const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = new Schema({
    method: String,
    url: String,
    message: String,
    user: Number,
    userIp: String,
    timestamp: Date,
    body: JSON
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
