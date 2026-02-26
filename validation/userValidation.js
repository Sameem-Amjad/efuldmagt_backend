// Define the Joi schema for validation

const Joi = require('joi');

const userSchema = Joi.object({
    email: Joi.string().email().messages({
      "string.email": "Must be a valid email address",
      "any.required": "Email is required",
    }),
    phone: Joi.object({
      countryCode: Joi.string().required().messages({
        "string.empty": "Country code is required",
        "any.required": "Country code is required",
      }),
      number: Joi.number()
        .required()
        .messages({
          "string.pattern.base": "Must be a valid phone number",
          "string.empty": "Phone number is required",
          "any.required": "Phone number is required",
        }),
    }),
    name: Joi.object({
      firstName: Joi.string().required().messages({
        "string.empty": "First name is required",
        "any.required": "First name is required",
      }),
      lastName: Joi.string().required().messages({
        "string.empty": "Last name is required",
        "any.required": "Last name is required",
      }),
    }).required(),
    address: Joi.object({
      address: Joi.string().required().messages({
        "string.empty": "Address is required",
        "any.required": "Address is required",
      }),
      addressLine: Joi.string().required().messages({
        "string.empty": "Address line is required",
        "any.required": "Address line is required",
      }),
      postalCode: Joi.string().required().messages({
        "string.empty": "Postal code is required",
        "any.required": "Postal code is required",
      }),
      city: Joi.string().required().messages({
        "string.empty": "City is required",
        "any.required": "City is required",
      }),
      country: Joi.string().required().messages({
        "string.empty": "Country is required",
        "any.required": "Country is required",
      }),
    }).required(),
    pin: Joi.string().min(4).max(4)
  });

  module.exports = { userSchema };

  