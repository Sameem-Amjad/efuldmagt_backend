const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const fuldmagtSchema = new Schema({
  fuldmagtFormId: {
    type: mongoose.Schema.ObjectId,
    ref: "fuldmagtForm",
    required: true
  },
  accountType: {
    type: String,
    enum: ["user", "company"],
  },
  giverModel: {
    type: String,
    enum: ["user", "company"],
    default: "user"
  },
  fuldmagtGiverId: {
    type: mongoose.Schema.ObjectId,
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
  fuldmagtGiverSignature: {
    type: String,
    required: true
  },
  agentSignature: {
    type: String
  },
  revoked: {
    type: Boolean,
    default: false
  },
  revokedDate: {
    type: Date
  },
  expiry: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
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
    default: null
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  fuldmagtDocumentsLink: [{
    fuldmagtIssueDate: {
      type: Date,
      // required: true
    },
    fuldmagtDocumentLink: {
      type: String,
      // required: true
    },
    fuldmagtDocumentKey: {
      type: String,
      // required: true
    }
  }]
});

const Fuldmagt = mongoose.model("fuldmagt", fuldmagtSchema, "fuldmagts");

module.exports = Fuldmagt
