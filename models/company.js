const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const companySchema = new Schema({
  createdBy: {
    type: mongoose.Schema.ObjectId,
    sparse: true,
    unique: true,
    ref: "user",
  },
  cvr: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        // Check if the value is a number and has exactly 8 digits
        // console.log('cvr value', value)
        if (!/^\d{8}$/.test(value)) {
          return false;
        }
        return true;
      },
      message: "CVR must be exactly 8 digits",
    },
  },
  companyName: {
    type: String,
    required: true,
  },
  address: {
    address: { type: String, required: true },
    addressLine: { type: String, required: true },
    postalCode: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    setPrimary: {
      type: Boolean,
      default: false,
    },
  },
  image: {
    type: String,
    required: true,
    default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL64bgMndf3C2L2fHF7HJlJIRp9F4K8o75fQ&s"
  },
  phone: {
    countryCode: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
      unique: true
    },
  },
  signature: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  locked: {
    type: Boolean,
    default: false
  },
  adminLocked: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Company = mongoose.model("company", companySchema, "companies");
module.exports = Company;
