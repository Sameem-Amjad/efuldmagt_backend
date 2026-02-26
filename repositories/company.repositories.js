const Company = require('../models/company');
const User = require('../models/user');
const { sendEmail } = require('../services/MailService');
const userServices = require('../services/user.services');
const { suspendUserEmailTemplate } = require('../templates/emailTemplates');
const userRepository = require('./user.repositories');

const companyRepository = {
    async addCompany({ email, phone, companyName, address, cvr, createdBy }) { //Will be expensive function
        let company = new Company({ email, phone, companyName, address, cvr, createdBy });

        await company.save();

        return company;
    },
    async updateCompany(companyId, updatedCompany) { //Will be expensive function
        let company = await Company.findByIdAndUpdate(companyId, updatedCompany, { new: true });
        return company;
    },
    async getCompanies(filter, companyId) {
        let companies = await Company.find({ ...filter, _id: { $ne: companyId } }).lean();
        return companies;
    },
    async getSpecificCompany(companyId) {
        let company = await Company.findById(companyId);

        return company
    },
    async deleteCompany(companyId) {
        let company = await Company.findByIdAndDelete(companyId);

        return company;
    }
}

module.exports = companyRepository