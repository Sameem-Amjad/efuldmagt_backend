const jwt = require("jsonwebtoken");
const fuldmagtFormServices = require("../services/fuldmagtForm.services");
const { dataResponse } = require("../utils/responses");
const { uploadFileObjectToS3Bucket } = require("../services/S3_ServiceStorage.js");
const fuldmagtFormRepository = require("../repositories/fuldmagtForm.repositories.js");

const fuldmagtFormController = {
  async checkFuldmagtFormTitle(req, res, next) {
    let { title } = req.params;
    let isTitleExists = await fuldmagtFormServices.isFuldmagtFormTitleExists(title);
    if (isTitleExists) {
      return res.status(400).send(dataResponse("Fuldmagt Form title already exists"));
    }
    return res.status(200).send(dataResponse("Fuldmagt Form title is available"));
  },
  // ----------------- register FuldmagtForm By User -----------------
  async addFuldmagtForm(req, res, next) {

    let { title, additionalFields, additionalFieldsType, additionalFieldsObject,
      isAgentSignRequired, fuldmagtStatement, fuldmagt_image, purchaseType, icon, exceptUsers, exceptCompanies, selectedUsers, selectedCompanies, visibleTo } = req.body;
    // console.log(visibleTo);
    let fuldmagtForm = await fuldmagtFormServices.createFuldmagtForm({
      title, additionalFields, additionalFieldsType, additionalFieldsObject,
      isAgentSignRequired, fuldmagtStatement, purchaseType, icon, fuldmagt_image, exceptUsers, exceptCompanies, selectedUsers, selectedCompanies, visibleTo
    });


    return res.status(200).send(dataResponse("Fuldmagt Form has been created", { fuldmagtForm }))
  },

  // ----------------- edit FuldmagtForm By User -----------------
  async editFuldmagtForm(req, res, next) {
    let { fuldmagtformId } = req.query
    let { title, additionalFields, additionalFieldsType, additionalFieldsObject,
      isAgentSignRequired, fuldmagtStatement, fuldmagt_image, purchaseType, icon, exceptUsers, exceptCompanies, selectedUsers, selectedCompanies, visibleTo } = req.body;
    // console.log(visibleTo);
    let isTitleExists = await fuldmagtFormRepository.isFuldmagtFormTitleExistsById(title, fuldmagtformId);
    if (isTitleExists) {
      return res.status(400).send(dataResponse("Fuldmagt Form title already exists"));
    }
    let fuldmagtForm = await fuldmagtFormServices.editFuldmagtForm({
      fuldmagtformId,
      title, additionalFields, additionalFieldsType, additionalFieldsObject,
      isAgentSignRequired, fuldmagtStatement, purchaseType, icon, fuldmagt_image, exceptUsers, exceptCompanies, selectedUsers, selectedCompanies, visibleTo
    });


    return res.status(200).send(dataResponse("Fuldmagt Form has been edited successfully", { fuldmagtForm }))
  },

  // ......................update visibility fuldmagtForm  By User.............................
  async updateFuldmagtForm(req, res) {
    let { id: fuldmagtFormId } = req.params;
    let { visibileTo, userIds, companyIds } = req.body;
    let fuldmagtForm = await fuldmagtFormServices.updateFuldmagtForm(fuldmagtFormId, { visibileTo, userIds, companyIds });

    return res.status(200).send(dataResponse("Fuldmagt Form has been updated", { fuldmagtForm }))
  },
  // .................. get fuldmagtForm .............................
  async getFuldmagtForms(req, res) {
    let fuldmagtForms = await fuldmagtFormServices.getFuldmagtForms();

    return res.status(200).send(dataResponse("Fuldmagt Froms has been retrieved", { fuldmagtForms }))
  },

  async getFuldmagtFormsWithPagination(req, res) {
    let { page, limit, title } = req.query;
    let data = await fuldmagtFormServices.getFuldmagtFormsWithPagination(page, limit, title);

    return res.status(200).send(dataResponse("Fuldmagt Froms has been retrieved", {
      fuldmagtForms: data.fuldmagtForms, page: data.page, limit: data.limit, totalPages: data.totalPages, hasNextPage: data.hasNextPage, hasPrevPage: data.hasPrevPage
    }))
  },
  // ---------------Query Companies---------------------------
  async getSpecificFuldmagtForm(req, res) {
  },
  // ---------------Add FuldmagtForm Unverified--------------------// This is just for testing and may be later useful for admin panel//
  async deleteFuldmagtForm(req, res) {
    let { id: fuldmagtFormId } = req.params;
    let fuldmagtForm = await fuldmagtFormServices.deleteFuldmagtForm(fuldmagtFormId);
    return res.status(200).send(dataResponse("FuldmagtForm has been deleted successfully", {}));
  },
  async getFuldmagtFormsByUser(req, res) {
    let userId = req.user;
    let { isCompany } = req.query;
    let companyId = req.company;


    let fuldmagtForms = await fuldmagtFormServices.getFuldmagtFormsByUser(userId, isCompany, companyId);

    return res.status(200).send(dataResponse("Fuldmagt Forms has been retrieved", { fuldmagtForms }))
  },
  async getSpecificFuldmagtFormByUser(req, res) {
    let { id } = req.params;
    let userId = req.user;

    let fuldmagtForm = await fuldmagtFormServices.getSpecificFuldmagtFormByUser(userId, id);

    return res.status(200).send(dataResponse("Fuldmagt Form has been retrieved", { fuldmagtForm }))
  }
};

module.exports = fuldmagtFormController;
