const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const otpSchema = new Schema({
  phone: {
    code:{
        type: String,
    },
    number:{
        type: Number,
    },
  },
  email: {
    type: String,
    unique: true,
  },
  emailVerification: {
    type: Boolean,
    default: false,
  },
  numberVerification: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otp_expiry_time: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("otp", otpSchema, "otps");
