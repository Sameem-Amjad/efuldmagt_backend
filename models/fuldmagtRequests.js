const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const fuldmagtRequestSchema = new Schema({
  fuldmagtFormId: {
    type: mongoose.Schema.ObjectId,
    ref: "fuldmagtForm",
    required: true
  },
  accountType: {
    type: String,
    enum: ["user", "company"],
    default: "user"
  },
  giverModel: {
    type: String,
    enum: ["user", "company"],
    default: "user"
  },
  fuldmagtGiverId: {
    type: Schema.ObjectId,
    refPath: 'giverModel', // Dynamic reference based on giverModel
  },
  fuldmagtGiverImage: {
    type: String,
    required: true
  },
  fuldmagtGiverName: {
    type: String,
    required: true
  },
  fuldmagtGiverEmail: {
    type: String,
    required: true
  },
  fuldmagtGiverPhone: {
    type: {
      countryCode: String,
      number: Number,
    },
    required: true
  },
  agentModel: {
    type: String,
    enum: ["user", "company"],
    default: "user"
  },
  agentId: {
    type: mongoose.Schema.ObjectId,
    refPath: "agentModel",
  },
  agentName: {
    type: String,
    required: true
  },
  agentDOB: {
    type: Date
  },
  agentEmail: {
    type: String,
    required: true
  },
  agentPhone: {
    type: {
      countryCode: String,
      number: Number,
    },
    required: true
  },
  expiry: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  additionalFieldsData: {
    type: [Object],
    required: true
  },
  fuldmagtStatement: {
    type: String,
    required: true
  },
  requestStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
});

const FuldmagtRequest = mongoose.model("fuldmagtRequest", fuldmagtRequestSchema, "fuldmagtRequests");

module.exports = FuldmagtRequest
