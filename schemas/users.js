const Joi = require('joi');

const mobileLoginSchema = Joi.object({
  credentials: Joi.object({
    email: Joi.string().email().message('Invalid email format'),
    phone: Joi.object({
      countryCode: Joi.string().pattern(/^\+\d{1,3}$/).message('Invalid country code format').required(),
      number: Joi.number().integer().message('Phone number must be number').required(),
    })
  }).xor('email', 'phone').required().messages({
    'object.missing': 'Either email or phone must be provided in credentials',
  }),

  pin: Joi.string().pattern(/^[0-9]{4}$/).message('Pin should be exactly 4 digits').required(),

  deviceId: Joi.string().optional().messages({
    'string.base': 'deviceId must be a string',
    'any.optional': 'deviceId is optional'
  })
});

const verifyDevicePinSchema = Joi.object({
  deviceId: Joi.string().required().messages({
    'string.base': 'deviceId must be a string',
    'any.required': 'deviceId is required'
  }),
  pin: Joi.string().pattern(/^[0-9]{4}$/).message('Pin should be exactly 4 digits').required(),
  refreshToken: Joi.string().required().messages({
    'string.base': 'deviceId must be a string',
    'any.required': 'deviceId is required'
  })
})

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.base': 'refreshToken must be a string',
    'any.required': 'refreshToken is required'
  })
})

module.exports = { mobileLoginSchema, verifyDevicePinSchema, refreshTokenSchema };