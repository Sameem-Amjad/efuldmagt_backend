
const Joi = require('joi');


const verifyCreateFuldmagt = Joi.object({
  fuldmagtFormId: Joi.string().messages({
    'string.empty': 'fuldmagtFormId ID cannot be empty.'
  }),

  fuldmagtGiverSignature: Joi.string().required().messages({
    'string.empty': 'fuldmagtGiverSignature cannot be empty.'
  }),

  additionalFieldsData: Joi.array().required(),

  accountType: Joi.string().valid('user', 'company').default('user').messages({
    'any.only': 'Account type must be either "user" or "company".'
  }),

  agentId: Joi.string().allow('').messages({
    'string.empty': 'agent ID cannot be empty.'
  }),

  expiry: Joi.date().iso().required().messages({
    'date.base': 'Expiry must be a valid ISO date format.',
    'any.required': 'Expiry date is required.'
  }),

  agentName: Joi.string().when('agentId', {
    is: '',
    then: Joi.string().required().messages({
      'string.empty': 'agent name is required when agentId is empty.'
    }),
    otherwise: Joi.string().empty('').messages({
      'string.empty': 'agent name should be empty when agentId is provided.'
    })
  }),

  agentDOB: Joi.date().iso().when('agentId', {
    is: '',
    then: Joi.date().required().messages({
      'date.base': 'agent date of birth must be a valid ISO date format when agentId is empty.',
      'any.required': 'agent date of birth is required when agentId is empty.'
    }),
    otherwise: Joi.date().empty('').messages({
      'date.base': 'agent date of birth should be empty when agentId is provided.'
    })
  }),


  agentEmail: Joi.string().email().when('agentId', {
    is: '',
    then: Joi.string().email().required().messages({
      'string.email': 'agent email must be a valid email address when agentId is empty.',
      'string.empty': 'agent email is required when agentId is empty.'
    }),
    otherwise: Joi.string().email().empty('').messages({
      'string.email': 'agent email should be empty when agentId is provided.',
      'string.empty': 'agent email should be empty when agentId is provided.'
    })
  }),

  agentCountryCode: Joi.string().min(2).max(4).when('agentId', {
    is: '',
    then: Joi.required().messages({
      'string.min': 'agent country code must be at least 2 characters.',
      'string.max': 'agent country code must be no more than 4 characters.',
      'string.empty': 'agent country code is required when agentId is not provided.'
    }),
    otherwise: Joi.string().empty('').messages({
      'string.empty': 'agent countryCode should be empty when agentId is provided.'
    })
  }),

  agentPhoneNumber: Joi.string().when('agentId', {
    is: '',
    then: Joi.required().messages({
      'string.empty': 'agent phone number is required when agentId is not provided.'
    }),
    otherwise: Joi.string().empty('').messages({
      'string.empty': 'agent phone Number should be empty when agentId is provided.'
    })
  }),
  //verify url link
  fuldmagtDocumentLink: Joi.string().uri().optional().messages({
    'string.empty': 'fuldmagtDocumentLink cannot be empty.',
    'string.uri': 'fuldmagtDocumentLink must be a valid URI.'
  }),
  fuldmagtDocumentKey: Joi.string().optional().messages({
    'string.empty': 'fuldmagtDocumentKey cannot be empty.'
  }),
  isRequestedByCompany: Joi.boolean().default(false)

});

const verifyRequestFuldmagt = Joi.object({
  fuldmagtFormId: Joi.string().messages({
    'string.empty': 'fuldmagtFormId ID cannot be empty.'
  }),

  additionalFieldsData: Joi.array().required(),

  accountType: Joi.string().valid('user', 'company').default('user').messages({
    'any.only': 'Account type must be either "user" or "admin".'
  }),

  fuldmagtGiverId: Joi.string().allow('').messages({
    'string.empty': 'fuldmagtGiver ID cannot be empty.'
  }),

  expiry: Joi.date().iso().required().messages({
    'date.base': 'Expiry must be a valid ISO date format.',
    'any.required': 'Expiry date is required.'
  }),

  fuldmagtGiverName: Joi.string().when('fuldmagtGiverId', {
    is: '',
    then: Joi.string().required().messages({
      'string.empty': 'fuldmagtGiver name is required when fuldmagtGiverId is empty.'
    }),
    otherwise: Joi.string().empty('').messages({
      'string.empty': 'fuldmagtGiver name should be empty when fuldmagtGiverId is provided.'
    })
  }),

  fuldmagtGiverDOB: Joi.date().iso().when('fuldmagtGiverId', {
    is: '',
    then: Joi.date().required().messages({
      'date.base': 'fuldmagtGiver date of birth must be a valid ISO date format when fuldmagtGiverId is empty.',
      'any.required': 'fuldmagtGiver date of birth is required when fuldmagtGiverId is empty.'
    }),
    otherwise: Joi.date().empty('').messages({
      'date.base': 'fuldmagtGiver date of birth should be empty when fuldmagtGiverId is provided.'
    })
  }),


  fuldmagtGiverEmail: Joi.string().email().when('fuldmagtGiverId', {
    is: '',
    then: Joi.string().email().required().messages({
      'string.email': 'fuldmagtGiver email must be a valid email address when fuldmagtGiverId is empty.',
      'string.empty': 'fuldmagtGiver email is required when fuldmagtGiverId is empty.'
    }),
    otherwise: Joi.string().email().empty('').messages({
      'string.email': 'fuldmagtGiver email should be empty when fuldmagtGiverId is provided.',
      'string.empty': 'fuldmagtGiver email should be empty when fuldmagtGiverId is provided.'
    })
  }),

  fuldmagtGiverCountryCode: Joi.string().min(2).max(4).when('fuldmagtGiverId', {
    is: '',
    then: Joi.required().messages({
      'string.min': 'fuldmagtGiver country code must be at least 2 characters.',
      'string.max': 'fuldmagtGiver country code must be no more than 4 characters.',
      'string.empty': 'fuldmagtGiver country code is required when fuldmagtGiverId is not provided.'
    }),
    otherwise: Joi.string().empty('').messages({
      'string.empty': 'fuldmagtGiver countryCode should be empty when fuldmagtGiverId is provided.'
    })
  }),

  fuldmagtGiverPhoneNumber: Joi.string().when('fuldmagtGiverId', {
    is: '',
    then: Joi.required().messages({
      'string.empty': 'fuldmagtGiver phone number is required when fuldmagtGiverId is not provided.'
    }),
    otherwise: Joi.string().empty('').messages({
      'string.empty': 'fuldmagtGiver phone Number should be empty when fuldmagtGiverId is provided.'
    })
  }),

  isRequestedByCompany: Joi.boolean().default(false)
});
module.exports = { verifyCreateFuldmagt, verifyRequestFuldmagt }