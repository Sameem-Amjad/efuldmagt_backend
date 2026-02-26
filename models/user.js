const { type } = require("@hapi/joi/lib/extend");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
  name: {
    firstName: { type: String, required: true },
    lastName: { type: String, default: "" },
  },
  address: {
    address: { type: String, default: "" },
    addressLine: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    setPrimary: { type: Boolean, default: false },
  },
  image: {
    type: String,
    required: true,
    default:
      "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_640.png",
  },
  phone: {
    countryCode: { type: String, trim: true, required: true },
    number: { type: Number, trim: true, required: true }
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    required: true,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  dateOfBirth: {
    type: Date,
  },
  pin: {
    type: String,
  },
  loginAttempt: {
    type: Number,
    default: 0,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  adminLocked: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  signature: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deviceId: {
    type: String,
  },
  refreshTokens: {
    type: [String],
    default: [],
    required: true,
  },
  notificationIds: {
    type: [String],
    default: [],
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "company",
    default: null,
  },
  mitIdVerified: {
    type: Boolean,
    default: false,
  },
  mitIdData: {
    type: Object, // stores MitID details like CPR, name, etc.
    default: null,
  },
  lastUpdatedPassword: {
    type: Date,
    default: null,
  }
});

// ✅ Compound unique index
userSchema.index(
  { 'phone.countryCode': 1, 'phone.number': 1 },
  { unique: true }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  // Skip check if phone fields are unchanged
  if (!this.isModified('phone')) return next();

  const existingUser = await this.constructor.findOne({
    'phone.countryCode': this.phone.countryCode,
    'phone.number': this.phone.number,
    _id: { $ne: this._id }, // 👈 ignore the same user
  });

  if (existingUser) {
    const err = new Error('Phone number already registered');
    err.statusCode = 409;
    return next(err);
  }

  next();
});


const User = mongoose.model("user", userSchema, "users");
module.exports = User;
