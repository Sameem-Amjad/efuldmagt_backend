const Company = require("../models/company");
const cryptoJs = require("crypto-js");
const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const companyRepository = require("../repositories/company.repositories");
const userRepository = require("../repositories/user.repositories");
const { sendEmail } = require("./MailService");

const companyServices = {
  async verifyCompanyCredentials(otp, encryptedOTPToken) {
    //Decrypt OTP Token
    let otpToken = cryptoJs.AES.decrypt(encryptedOTPToken, process.env.ENCRYPTION_KEY).toString(cryptoJs.enc.Utf8);
    //Verify Token for Temparing
    let otpTokenDecrypted = null
    try {
      otpTokenDecrypted = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
    }
    catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw createHttpError.Unauthorized("Token has expired");
      } else if (err.name === 'JsonWebTokenError') {
        throw createHttpError.Unauthorized("Invalid Token");
      } else {
        throw createHttpError.Unauthorized("Invalid or Expired Token");
      }
    }

    if (otp != otpTokenDecrypted.otp)
      throw createHttpError.BadRequest("OTP doesn't match");

    if (await this.getCompanyByCredentials(otpTokenDecrypted.credentials))
      throw createHttpError.Conflict("Company with given credentials already exists");

    //getting equal make a jwt for making account//
    let credentialsToken = jwt.sign(otpTokenDecrypted.credentials, process.env.ADD_COMPANY_TOKEN);

    return credentialsToken
  },
  async reactivateCompanyByAdmin(companyId) {
    let updatedCompany = {
      deleted: false
      , locked: false,
      adminLocked: false
    }
    let company = await companyRepository.updateCompany(companyId, updatedCompany);

    if (!company) {
      throw createHttpError.NotFound("Company with given id not found");
    }
    return company;
  },
  async addCompanyByUser(userId, emailCredentialsToken, phoneCredentialsToken, companyName, address, cvr) {
    let existsingCompany = await Company.findOne({
      cvr: cvr
    });
    if (existsingCompany) {
      throw new createHttpError.Conflict("Company with given CVR already exists");
    }
    let companyData = {
      companyName,
      address,
      cvr
    }

    let user = await User.findById(userId);

    if (!user)
      throw new createHttpError.NotFound("User not found");

    if (user.company)
      throw new createHttpError.Conflict("User already have a company assigned to account");

    //Check if user has passed jwt or email in the token//
    let emailCredentials = {}
    try {
      emailCredentials = jwt.verify(emailCredentialsToken, process.env.ADD_COMPANY_TOKEN);
    }
    catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw createHttpError.Unauthorized("Token has expired");
      }
      if (user.email == emailCredentialsToken) {
        emailCredentials.email = user.email;
      }
    }

    //Check if user has passed jwt or phone in the token//
    let phoneCredentials = {}
    try {
      phoneCredentials = jwt.verify(phoneCredentialsToken, process.env.ADD_COMPANY_TOKEN);
    }
    catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw createHttpError.Unauthorized("Token has expired");
      }
      if (user.phone.countryCode == phoneCredentialsToken.countryCode
        && user.phone.number == phoneCredentialsToken.number) {
        phoneCredentials.phone = user.phone;
      }
    }

    if (!emailCredentials.email)
      throw new createHttpError.BadRequest("Provided email credentials are incorrect");
    if (!phoneCredentials.phone)
      throw new createHttpError.BadRequest("Provided phone credentials are incorrect");

    companyData.email = emailCredentials.email;
    companyData.phone = phoneCredentials.phone;


    companyData.createdBy = user._id;
    let registeredCompany = new Company(companyData);

    await registeredCompany.save();

    return { user, registeredCompany };
  },
  async updateCompanyByUser(companyId, updatedCompany) {
    let company = companyRepository.updateCompany(companyId, updatedCompany);

    if (!company)
      throw new createHttpError.NotFound("Company not found");

    return company;
  },
  async getCompanyByCredentials(credentials) {
    let company = null;

    if (credentials.email) {
      company = await Company.findOne({ email: credentials.email });
    }
    else if (credentials.phone) {
      company = await Company.findOne({
        phone: {
          countryCode: credentials.phone.countryCode,
          number: parseInt(credentials.phone.number)
        }
      })
    }

    return company;
  },
  async getSpecificCompany(companyId) {

    // Find the company(s) matching the query
    let company = await companyRepository.getSpecificCompany(companyId);

    // Handle the case where no company is found
    if (!company)
      throw new createHttpError.NotFound("Company doesn't exist with given id");
    if (company.locked) {
      throw new createHttpError.Forbidden("Company is locked. Please contact support.");
    }
    if (company.adminLocked) {
      throw new createHttpError.Forbidden("Company is locked by admin. Please contact support.");
    }
    // Respond with the found company(s)
    return company;
  },
  async getCompanies(query, company) {
    // Destructure query parameters from request
    const { q, cvr, companyName, email, number, } = query;
    // Initialize an empty filter object
    let filter = {};

    // Check for the "q" parameter - search across email, number, and name
    if (q) {
      filter = {
        $or: [
          { companyName: { $regex: q, $options: 'i' } }, // case-insensitive substring match for email
          { email: { $regex: q, $options: 'i' } },  // case-insensitive substring match for name
        ]
      };
    }

    // If "companyName" is provided, search by name
    if (companyName) {
      filter.companyName = new RegExp(companyName, 'i'); // case-insensitive search for name
    }

    // If "email" is provided, search by email
    if (email) {
      filter.email = new RegExp(email, 'i'); // case-insensitive search for email
    }

    // If "number" is provided, search by number
    if (number) {
      filter["phone.number"] = number; // exact match for number
    }

    if (cvr) {
      filter.cvr = cvr; // exact match for number
    }
    // filter.locked = false;
    let companies = await companyRepository.getCompanies(filter, company);

    // Send back the results
    return companies;
  },
  async addCompanyUnverified(userId, email, phone, companyName, address, cvr) {
    let companyData = {
      companyName,
      address,
      cvr,
      email,
      phone
    }
    let existsingCompany = await Company.findOne({
      cvr: cvr
    });
    if (existsingCompany) {
      throw new createHttpError.Conflict("Company with given CVR already exists");
    }
    let user = await User.findById(userId);

    if (!user)
      throw new createHttpError.NotFound("User not found");

    if (user.company)
      throw new createHttpError.Conflict("Already a company exists at user account");

    companyData.createdBy = user._id;

    let registeredCompany = new Company(companyData);
    user.company = registeredCompany._id;

    await registeredCompany.save();
    await user.save();

    return { user, registeredCompany }
  },
  async addCompanyByAdmin({ email, phone, companyName, address, cvr }) {
    let existsingCompany = await Company.findOne({
      cvr: cvr
    });
    if (existsingCompany) {
      throw new createHttpError.Conflict("Company with given CVR already exists");
    }
    let company = await companyRepository.addCompany({ email, phone, companyName, address, cvr })

    return company;
  },
  async assignCompany(userId, companyId) {
    let user = await User.findById(userId);

    if (!user)
      throw new createHttpError.NotFound("User not found");

    if (user.company)
      throw new createHttpError.Conflict("User has already been assigned a company");

    let company = await Company.findById(companyId);

    if (!company)
      throw new createHttpError.NotFound("Company not found");
    if (company.locked) {
      throw new createHttpError.Forbidden("Company is locked. Please contact support.");
    }
    if (company.adminLocked) {
      throw new createHttpError.Forbidden("Company is locked by admin. Please contact support.");
    }

    user.company = company._id;

    await user.save();

    return company;
  },

  async deleteCompanyByAdmin(companyId) {

    let updatedCompany = {
      deleted: true
    }

    let company = await companyRepository.getSpecificCompany(companyId);
    if (!company) {
      throw createHttpError.NotFound("Company with given id not found");
    }
    await companyRepository.deleteCompany(companyId);

    // //Later: Delete all users associated with this company//
    // let users = await User.find({ company: companyId });
    // users.forEach(async (user) => {
    //   await userRepository.hardDeleteUser(user._id);

    // });
    return company;
  },

  async updateCompanyByAdmin(id, updatedCompany) {
    let company = await companyRepository.updateCompany(id, updatedCompany);

    if (!company)
      throw new createHttpError.NotFound("Company not found");

    return company;
  },

  async getCompanySignature(companyId) {
    let company = await Company.findById(companyId);

    if (!company)
      throw new createHttpError.NotFound("Company not found");
    if (company.locked) {
      throw new createHttpError.Forbidden("Company is locked. Please contact support.");
    }
    if (company.adminLocked) {
      throw new createHttpError.Forbidden("Company is locked by admin. Please contact support.");
    }
    if (!company.signature)
      throw new createHttpError.NotFound("Company signature doesn't exist");

    return company.signature;
  },

  async updateCompanySignature(companyId, signature) {
    const company = await Company.findById(companyId);

    if (!company)
      throw new createHttpError.NotFound("Company not found");

    if (company.locked) {
      throw new createHttpError.Forbidden("Company is locked. Please contact support.");
    }
    if (company.adminLocked) {
      throw new createHttpError.Forbidden("Company is locked by admin. Please contact support.");
    }

    company.signature = signature;

    await company.save()

    return company.signature;
  },
  async getCompanyById(companyId) {
    let company = await Company.findById(companyId);
    return company;
  }
}

module.exports = companyServices