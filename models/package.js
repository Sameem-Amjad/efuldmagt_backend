const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const packageSchema = new Schema({
  accountType: {
    type: String,
    required: true, // values: user, company
    enum: ["user", "company"],
  },
  title: {
    type:String,
    required: true
  },
  postImage: {
    type: String,
    required: true
  },
  senderId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    refPath: 'accountType', // Dynamic reference based on accountType
  },
  expiry: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["send", "request"]
  },
  revoked:{
    type: Boolean,
    default: false
  },
  revokedDate:{
    type: Date
  },
  receiverId: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
  },
  receiverName: {
    type: String,
    required: true
  },
  receiverDOB: {
    type: Date
  },
  receiverEmail: {
    type: String,
    required: true
  },
  receiverPhone: {
    type:{
      countryCode: String,
      number: Number,
    },
    required: true
  },
  signature: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedDate: {
    type: Date,
  }
});
const Package = mongoose.model("package", packageSchema, "packages");
module.exports = Package;
