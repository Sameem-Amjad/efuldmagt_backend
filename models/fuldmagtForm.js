const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const fuldmagtFormSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  icon: {
    type: String,
    required: true,
  },
  fuldmagt_image: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  selectedUsers: {
    type: [{ type: mongoose.Schema.ObjectId, ref: "user" }],
    default: [],
  },
  selectedCompanies: {
    type: [{ type: mongoose.Schema.ObjectId, ref: "company" }],
    default: [],
  },
  exceptUsers: {
    type: Boolean,
    required: true,
    default: false,
  },
  exceptCompanies: {
    type: Boolean,
    required: true,
    default: false,
  },
  additionalFields: {
    type: [String],
    required: true,
  },
  additionalFieldsType: {
    type: [
      {
        type: String,
        enum: [
          "headline",
          "note",
          "textField",
          "textArea",
          "date",
          "radioButtons",
          "checkBoxes",
        ],
      },
    ],
    required: true,
  },
  isAgentSignRequired: {
    type: Boolean,
    required: true,
    default: false,
  },
  additionalFieldsObject: {
    type: [Object],
    required: true,
  },
  purchaseType: {
    type: String,
    required: true,
    default: "Tier 1",
    enum: [
      "Free",
      "Tier 1",
      "Tier 3",
      "Tier 5",
      "Tier 7",
      "Tier 10",
      "Tier 12",
      "Tier 14",
      "Tier 16",
      "Tier 18",
      "Tier 20",
      "Tier 30",
      "Tier 40",
      "Tier 50",
      "Tier 60",
      "Tier 80",
      "Tier 100",
      "Tier 120",
      "Tier 140",
      "Tier 160",
      "Tier 200",
    ],
  },
  price: {
    //DKK
    type: Number,
    required: true,
  },
  fuldmagtStatement: {
    type: String,
    required: true,
  },
  visibleTo: {
    type: String,
    enum: ["specificUsers", "allUsers", "specificCompanies", "allCompanies", "everyone", "specificUsersAndCompanies"],
    required: true
  },
  isAdminDeleted: {
    type: Boolean,
    default: false,
  },
});
let FuldmagtForm = mongoose.model(
  "fuldmagtForm",
  fuldmagtFormSchema,
  "fuldmagtForms"
);

module.exports = FuldmagtForm;
