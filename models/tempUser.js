const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tempUserSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours in seconds
    }
});

const TempUser = mongoose.model('TempUser', tempUserSchema);

module.exports = TempUser;