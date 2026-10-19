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
  },
  // Public-demo admin: can read, add and edit, but not delete (see demoGuard).
  noDelete: {
    type: Boolean,
    default: false
  }
});

const Admin =  mongoose.model("admin", adminSchema, "admins");
module.exports = Admin;
