// Define the Joi schema for validation

const Joi = require("joi");

const passwordSchema = Joi.object({
  oldPin: Joi.number().integer().min(1000).max(9999).required().messages({
    "number.base": "Password must be a number ",
    "number.integer": "Password must be an integer",
    "number.min": "Password must be exactly 4 digits long",
    "number.max": "Password must be exactly 4 digits long",
  }),
  newPin: Joi.number().integer().min(1000).max(9999).required().messages({
    "number.base": "Password must be a number",
    "number.integer": "Password must be an integer",
    "number.min": "Password must be exactly 4 digits long",
    "number.max": "Password must be exactly 4 digits long",
  }),
});

module.exports = { passwordSchema };
