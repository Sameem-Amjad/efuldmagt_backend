
const Joi = require('joi');

const verifyAddPackageSchema = Joi.object({
    type: Joi.string().valid("send", "request").required().messages({
      'string.valid': 'type value is not correct.',
      'string.empty': 'Type is required.'
    }),
  
    title: Joi.string().required().messages({
      'string.empty': 'Title is required.'
    }),
  
    accountType: Joi.string().valid('user', 'company').default('user').messages({
      'any.only': 'Account type must be either "user" or "admin".'
    }),
  
    receiverId: Joi.string().allow('').messages({
      'string.empty': 'Receiver ID cannot be empty.'
    }),
  
    expiry: Joi.date().iso().required().messages({
      'date.base': 'Expiry must be a valid ISO date format.',
      'any.required': 'Expiry date is required.'
    }),
  
    recieverName: Joi.string().when('receiverId', {
        is: '',
        then: Joi.string().required().messages({
          'string.empty': 'Receiver name is required when receiverId is empty.'
        }),
        otherwise: Joi.string().empty('').messages({
          'string.empty': 'Receiver name should be empty when receiverId is provided.'
        })
    }),
  
    recieverDOB: Joi.date().iso().when('receiverId', {
        is: '',
        then: Joi.date().required().messages({
          'date.base': 'Receiver date of birth must be a valid ISO date format when receiverId is empty.',
          'any.required': 'Receiver date of birth is required when receiverId is empty.'
        }),
        otherwise: Joi.date().empty('').messages({
          'date.base': 'Receiver date of birth should be empty when receiverId is provided.'
        })
    }),
    
  
    recieverEmail: Joi.string().email().when('receiverId', {
        is: '',
        then: Joi.string().email().required().messages({
          'string.email': 'Receiver email must be a valid email address when receiverId is empty.',
          'string.empty': 'Receiver email is required when receiverId is empty.'
        }),
        otherwise: Joi.string().email().empty('').messages({
          'string.email': 'Receiver email should be empty when receiverId is provided.',
          'string.empty': 'Receiver email should be empty when receiverId is provided.'
        })
      }),
  
    receiverCountryCode: Joi.string().min(2).max(4).when('receiverId', {
      is: '',
      then: Joi.required().messages({
        'string.min': 'Receiver country code must be at least 2 characters.',
        'string.max': 'Receiver country code must be no more than 4 characters.',
        'string.empty': 'Receiver country code is required when receiverId is not provided.'
      }),
      otherwise: Joi.string().empty('').messages({
        'string.empty': 'Receiver countryCode should be empty when receiverId is provided.'
      })
    }),
  
    receiverPhoneNumber: Joi.string().when('receiverId', {
      is: '',
      then: Joi.required().messages({
        'string.empty': 'Receiver phone number is required when receiverId is not provided.'
      }),
      otherwise: Joi.string().empty('').messages({
        'string.empty': 'Receiver phone Number should be empty when receiverId is provided.'
      })
    })
  });

  module.exports = {verifyAddPackageSchema}