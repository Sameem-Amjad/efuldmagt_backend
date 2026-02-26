const fuldmagtFormRepository = require("../repositories/fuldmagtForm.repositories");

const priceTiersDKK = {
  Free: 0,
  "Tier 1": 9,
  "Tier 3": 17,
  "Tier 5": 25,
  "Tier 7": 35,
  "Tier 10": 45,
  "Tier 12": 59,
  "Tier 14": 69,
  "Tier 16": 79,
  "Tier 18": 89,
  "Tier 20": 99,
  "Tier 30": 149,
  "Tier 40": 199,
  "Tier 50": 249,
  "Tier 60": 299,
  "Tier 80": 399,
  "Tier 100": 499,
  "Tier 120": 599,
  "Tier 140": 699,
  "Tier 160": 799,
  "Tier 200": 999,
};

const fuldmagtFormServices = {
  async createFuldmagtForm({
    title,
    additionalFields,
    additionalFieldsType,
    additionalFieldsObject,
    isAgentSignRequired,
    fuldmagtStatement,
    purchaseType,
    icon,
    fuldmagt_image,
    exceptUsers,
    exceptCompanies,
    selectedUsers,
    selectedCompanies,
    visibleTo
  }) {
    const tiers = Object.keys(priceTiersDKK);
    if (!tiers.includes(purchaseType)) {
      throw new Error("Invalid purchase type");
    }

    let price = priceTiersDKK[purchaseType];
    // console.log(visibleTo);
    let fulmagtForm = await fuldmagtFormRepository.createFuldmagtForm({
      title,
      price,
      additionalFields,
      additionalFieldsType,
      additionalFieldsObject,
      isAgentSignRequired,
      fuldmagtStatement,
      purchaseType,
      icon,
      fuldmagt_image,
      exceptUsers,
      exceptCompanies,
      selectedUsers,
      selectedCompanies,
      visibleTo
    });

    return fulmagtForm;
  },

  async editFuldmagtForm({
    fuldmagtformId,
    title,
    additionalFields,
    additionalFieldsType,
    additionalFieldsObject,
    isAgentSignRequired,
    fuldmagtStatement,
    purchaseType,
    icon,
    fuldmagt_image,
    exceptUsers,
    exceptCompanies,
    selectedUsers,
    selectedCompanies,
    visibleTo
  }) {
    const tiers = Object.keys(priceTiersDKK);
    if (!tiers.includes(purchaseType)) {
      throw new Error("Invalid purchase type");
    }

    let price = priceTiersDKK[purchaseType];
    console.log(visibleTo);
    let fulmagtForm = await fuldmagtFormRepository.editFuldmagtForm({
      fuldmagtformId,
      title,
      price,
      additionalFields,
      additionalFieldsType,
      additionalFieldsObject,
      isAgentSignRequired,
      fuldmagtStatement,
      purchaseType,
      icon,
      fuldmagt_image,
      exceptUsers,
      exceptCompanies,
      selectedUsers,
      selectedCompanies,
      visibleTo
    });

    return fulmagtForm;
  },

  async getFuldmagtForms() {
    let fuldmagtForms = await fuldmagtFormRepository.getFuldmagtForms();

    return fuldmagtForms;
  },

  async getFuldmagtFormsWithPagination(page, limit, title) {
    let data = await fuldmagtFormRepository.getFuldmagtFormsWithPagination(page, limit, title);
    return data;
  },

  async getFuldmagtFormsByUser(userId, isCompany = false, companyId = null) {
    let fuldmagtForms = await fuldmagtFormRepository.getFuldmagtFormsByUser(
      userId,
      isCompany,
      companyId
    );

    return fuldmagtForms;
  },

  async getSpecificFuldmagtFormByUser(userId, fuldmagtId) {
    let fuldmagtForm =
      await fuldmagtFormRepository.getSpecificFuldmagtFormByUser(
        userId,
        fuldmagtId
      );

    return fuldmagtForm;
  },
  async isFuldmagtFormTitleExists(title) {
    let isExists = await fuldmagtFormRepository.isFuldmagtFormTitleExists(title);
    return isExists;
  },
  async updateFuldmagtForm(fuldmagtFormId, { visibileTo, userIds, companyIds }) {
    let fuldmagtForm = await fuldmagtFormRepository.updateVisibility(fuldmagtFormId, { visibileTo, userIds, companyIds });
    return fuldmagtForm;
  },

  async deleteFuldmagtForm(fuldmagtFormId) {
    let fuldmagtForm = await fuldmagtFormRepository.deleteFuldmagtForm(fuldmagtFormId);
    return fuldmagtForm;
  }
};

module.exports = fuldmagtFormServices;
