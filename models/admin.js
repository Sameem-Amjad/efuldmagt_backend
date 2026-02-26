const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const adminSchema = new Schema({
  name: {
    type: String, required: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    required: true
  }
});

const Admin =  mongoose.model("admin", adminSchema, "admins");
module.exports = Admin;
