const jwt = require("jsonwebtoken")
const notificationServices = require("./notification.services")
const { sendEmail } = require("./MailService")
const mongoose = require("mongoose")
const NotificationSetting = require("../models/notificationSettings")
const User = require("../models/user")
const Fuldmagt = require("../models/fuldmagt")
const Company = require("../models/company")
const fuldmagtFormRepository = require("../repositories/fuldmagtForm.repositories")
const createHttpError = require("http-errors")
const fuldmagtRepository = require("../repositories/fuldmagt.repositories")
const fuldmagtRequestRepository = require("../repositories/fuldmagtRequest.repositories")
const { revokedFuldmagtEmailTemplate,
    createFuldmagtEmailTemplate,
    createFuldmagtRequestTemplate } = require("../templates/emailTemplates")
const userServices = require("./user.services")
const Notification = require("../models/notification")

async function verifyAdditionalFields(fuldmagtForm, additionalFieldsData) {

    for (let i = 0; i < fuldmagtForm.additionalFields.length; i++) {
        if (fuldmagtForm.additionalFieldsType[i] == "headline" || fuldmagtForm.additionalFieldsType[i] == "note" ||
            fuldmagtForm.additionalFieldsType[i] == "textField" || fuldmagtForm.additionalFieldsType[i] == "textArea" ||
            fuldmagtForm.additionalFieldsType[i] == "radioButtons"
        ) {
            if (!(additionalFieldsData[i] instanceof String || typeof additionalFieldsData[i] == "string")) {
                throw createHttpError.BadRequest("Data for field " + fuldmagtForm.additionalFields[i] + " is not correct")
            }
        }
        else if (
            fuldmagtForm.additionalFieldsType[i] == "date"
        ) {

            try {
                additionalFieldsData[i] = new Date(additionalFieldsData[i])
            }
            catch (err) {
                throw createHttpError.BadRequest("Data for field " + fuldmagtForm.additionalFields[i] + " is not correct")
            }
        }
        else if (
            fuldmagtForm.additionalFieldsType[i] == "checkBoxes"
        ) {
            if (!Array.isArray(additionalFieldsData[i])) {
                throw createHttpError.BadRequest("Data for field " + fuldmagtForm.additionalFields[i] + " is not correct")
            }
        }
    }
}

const fuldmagtServices = {
    async requestFuldmagt(userId, fuldmagtRequestData) {
        let isRequestedByCompany = fuldmagtRequestData.isRequestedByCompany || false;
        delete fuldmagtRequestData.isRequestedByCompany;
        let fuldmagtGiverId = fuldmagtRequestData.fuldmagtGiverId;
        let fuldmagtGiver = null;
        let isFuldmagtGiverNew = false;
        let newPin = "1234";
        let companyUser = null;
        let fuldmagtGivercompanyUser = null;
        if (fuldmagtGiverId) {
            fuldmagtGiver = await User.findById(fuldmagtGiverId);
            if (!fuldmagtGiver) {
                fuldmagtGiver = await Company.findById(fuldmagtGiverId);
                if (fuldmagtGiver) {
                    fuldmagtGivercompanyUser = await User.findOne({ _id: fuldmagtGiver.createdBy });
                }
                if (!fuldmagtGiver) {
                    throw createHttpError.NotFound("Fuldmagt Giver not found by given Id")
                }
            }

            fuldmagtRequestData.fuldmagtGiverName = fuldmagtGiver.cvr ? fuldmagtGiver.companyName : (fuldmagtGiver.name.firstName + " " + fuldmagtGiver.name.lastName);
            fuldmagtRequestData.fuldmagtGiverPhone = fuldmagtGiver.phone,
                fuldmagtRequestData.fuldmagtGiverDOB = fuldmagtGiver.cvr ? fuldmagtGivercompanyUser.dateOfBirth : fuldmagtGiver.dateOfBirth,
                fuldmagtRequestData.fuldmagtGiverEmail = fuldmagtGiver.email,
                fuldmagtRequestData.fuldmagtGiverImage = fuldmagtGiver.image
        }
        else {
            let newFuldmagtGiver = {
                name: {
                    firstName: fuldmagtRequestData.fuldmagtGiverName.split(" ")[0],
                    lastName: fuldmagtRequestData.fuldmagtGiverName.split(" ")[1] || ""
                },
                email: fuldmagtRequestData.fuldmagtGiverEmail,
                phone: fuldmagtRequestData.fuldmagtGiverPhone,
                dateOfBirth: fuldmagtRequestData.fuldmagtGiverDOB,
                pin: newPin
            };

            fuldmagtGiver = await userServices.createUserByAdmin(newFuldmagtGiver);
            isFuldmagtGiverNew = true;
            fuldmagtRequestData.fuldmagtGiverId = fuldmagtGiver._id.toString();
            fuldmagtGiverId = fuldmagtGiver._id.toString();
        }

        let agent = await User.findById(userId);
        if (isRequestedByCompany) {
            agent = await Company.findOne({ createdBy: userId });
            if (!agent) {
                throw createHttpError.NotFound("Agent not found by given Id");
            }
            companyUser = await User.findOne({ _id: agent.createdBy });
        }
        fuldmagtRequestData.accountType = agent.cvr ? "company" : "user";
        fuldmagtRequestData.agentId = agent._id;
        fuldmagtRequestData.agentName = agent.cvr ? agent.companyName : (agent.name.firstName + " " + agent.name.lastName);
        fuldmagtRequestData.agentDOB = agent.cvr ? companyUser.dateOfBirth : agent.dateOfBirth;
        fuldmagtRequestData.agentEmail = agent.email;
        fuldmagtRequestData.agentPhone = agent.phone;
        //Verifying Additional Fields//
        let fuldmagtForm = await fuldmagtFormRepository.getSpecificFuldmagtForm(fuldmagtRequestData.fuldmagtFormId);

        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found by given Id")
        }
        await verifyAdditionalFields(fuldmagtForm, fuldmagtRequestData.additionalFieldsData);

        fuldmagtRequestData.fuldmagtStatement = fuldmagtForm.fuldmagtStatement;

        let fuldmagtRequest = await fuldmagtRequestRepository.createFuldmagtRequest(fuldmagtRequestData);

        notificationServices.notifyFuldmagtRequest(isFuldmagtGiverNew, {
            fuldmagtGiverName: fuldmagtRequestData.fuldmagtGiverName,
            fuldmagtRequestId: fuldmagtRequest._id,
            fuldmagtGiverId: fuldmagtGiverId,
            fuldmagtGiverEmail: fuldmagtRequestData.fuldmagtGiverEmail,
            agentName: fuldmagtRequestData.agentName,
            title: fuldmagtForm.title,
            agentImage: agent.image,
            createdAt: fuldmagtRequest.createdAt,
            newPin: isFuldmagtGiverNew ? newPin : null
        });

        return fuldmagtRequest;
    },
    async createFuldmagt(userId, companyId, fuldmagtData) {
        //Setting Up Agent//
        let agentId = fuldmagtData.agentId;

        if ((userId && userId.toString() === agentId.toString()) || (companyId && companyId.toString() === agentId.toString())) {
            throw createHttpError.NotFound("You can't send fludmagt to yourself")
        }
        let agent = null;
        let newPin = "1234";
        let isAgentNew = false;
        if (agentId) {
            agent = await User.findById(agentId);
            if (!agent) {
                agent = await Company.findById(agentId);

                if (!agent) {
                    throw createHttpError.NotFound("Agent not found by given Id")
                }
                fuldmagtData.agentName = agent.companyName;
                fuldmagtData.agentPhone = agent.phone;
                fuldmagtData.agentEmail = agent.email;
                let userByEmail = await User.findOne({ _id: agent.createdBy });
                fuldmagtData.agentDOB = userByEmail.dateOfBirth

            } else {
                fuldmagtData.agentName = agent.name.firstName + " " + agent.name.lastName;
                fuldmagtData.agentPhone = agent.phone,
                    fuldmagtData.agentDOB = agent.dateOfBirth,
                    fuldmagtData.agentEmail = agent.email
            }
        }
        else {
            let newAgent = {
                name: {
                    firstName: fuldmagtData.agentName.split(" ")[0],
                    lastName: fuldmagtData.agentName.split(" ")[1] || ""
                },
                email: fuldmagtData.agentEmail,
                phone: fuldmagtData.agentPhone,
                dateOfBirth: fuldmagtData.agentDOB,
                pin: newPin
            };

            let agent = await userServices.createUserByAdmin(newAgent);
            isAgentNew = true;
            agentId = agent._id.toString();
        }

        //Setting Up Fuldmagt Giver//
        let fuldmagtGiver = await User.findById(userId);
        if (fuldmagtData.accountType == "user") {
            fuldmagtData.fuldmagtGiverImage = fuldmagtGiver.image;
            fuldmagtData.fuldmagtGiverId = fuldmagtGiver._id;
            fuldmagtData.fuldmagtGiverName = fuldmagtGiver.name.firstName + " " + fuldmagtGiver.name.lastName
        } else if (fuldmagtData.accountType == "company") {
            if (!companyId)
                throw createHttpError.BadRequest("Company is not registered on user")

            let company = await Company.findById(companyId);
            if (!company)
                throw createHttpError.NotFound("Company not found by given Id");
            if (company.locked) {
                throw createHttpError.Forbidden("Company is locked. Please contact support.");
            }
            if (company.adminLocked) {
                throw createHttpError.Forbidden("Company is locked by admin. Please contact support.");
            }
            fuldmagtData.fuldmagtGiverImage = fuldmagtGiver.image;
            fuldmagtData.fuldmagtGiverId = company._id;
            fuldmagtData.fuldmagtGiverName = company.companyName;
        }

        //--------------Matching Additional Fields from Fuldmagt Form///
        let fuldmagtForm = await fuldmagtFormRepository.getSpecificFuldmagtForm(fuldmagtData.fuldmagtFormId);

        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found by given Id")
        }

        await verifyAdditionalFields(fuldmagtForm, fuldmagtData.additionalFieldsData);

        fuldmagtData.fuldmagtStatement = fuldmagtForm.fuldmagtStatement;


        let fuldmagt = await fuldmagtRepository.createFuldmagt(
            {
                fuldmagtDocumentKey: fuldmagtData?.fuldmagtDocumentKey || "",
                fuldmagtDocumentLink: fuldmagtData?.fuldmagtDocumentLink || "",
                fuldmagtFormId: fuldmagtData.fuldmagtFormId,
                additionalFieldsData: fuldmagtData.additionalFieldsData,
                accountType: fuldmagtData.accountType,
                expiry: fuldmagtData.expiry,
                fuldmagtGiverSignature: fuldmagtData.fuldmagtGiverSignature,
                agentId: agentId,
                agentName: fuldmagtData.agentName,
                agentDOB: fuldmagtData.agentDOB,
                agentEmail: fuldmagtData.agentEmail,
                agentPhone: fuldmagtData.agentPhone,
                fuldmagtGiverId: fuldmagtData.fuldmagtGiverId,
                fuldmagtGiverName: fuldmagtData.fuldmagtGiverName,
                fuldmagtGiverImage: fuldmagtData.fuldmagtGiverImage,
                revoked: false,
                revokedDate: null,
                fuldmagtStatement: fuldmagtData.fuldmagtStatement,

            });

        //let fuldmagt = new Fuldmagt(fuldmagtData);

        notificationServices.notifyFuldmagtCreation(isAgentNew, {
            fuldmagtGiverName: fuldmagtData.fuldmagtGiverName,
            fuldmagtId: fuldmagt._id,
            agentEmail: fuldmagtData.agentEmail,
            agentId: agentId,
            agentName: fuldmagtData.agentName,
            fuldmagtGiverImage: fuldmagtData.fuldmagtGiverImage,
            title: fuldmagtForm.title,
            newPin: isAgentNew ? newPin : null,
            createdAt: fuldmagt.createdAt
        });

        return fuldmagt;
    },
    async approveFuldmagtRequest(userId, companyId, fuldmagtRequestId, signature, fuldmagtDocumentLink = "", fuldmagtDocumentKey = "") {
        let fuldmagtRequest = await fuldmagtRequestRepository.getSpecificFuldmagtRequest(fuldmagtRequestId);
        if (!fuldmagtRequest)
            throw createHttpError.NotFound("Fuldmagt Request not found by given Id")

        if (!fuldmagtRequest.fuldmagtGiverId)
            throw createHttpError.Unauthorized("Fuldmagt Request is not assigned to any user")

        let fuldmagtRequestAccess = false;
        if (userId && fuldmagtRequest.fuldmagtGiverId.toString() == userId.toString()) {
            fuldmagtRequestAccess = true;
        }
        if (companyId && fuldmagtRequest.fuldmagtGiverId.toString() == companyId.toString()) {
            fuldmagtRequestAccess = true;
        }

        if (!fuldmagtRequestAccess) {
            throw createHttpError.Unauthorized("You don't have access to this fuldmagt request")
        }

        if (fuldmagtRequest.requestStatus != "pending") {
            throw createHttpError.BadRequest("Fuldmagt Request is not in pending state")
        }

        let fuldmagtData = {
            fuldmagtDocumentKey: fuldmagtDocumentKey || "",
            fuldmagtDocumentLink: fuldmagtDocumentLink || "",
            fuldmagtFormId: fuldmagtRequest.fuldmagtFormId,
            additionalFieldsData: fuldmagtRequest.additionalFieldsData,
            accountType: fuldmagtRequest.fuldmagtGiverId == userId ? "user" : "company",
            fuldmagtGiverId: fuldmagtRequest.fuldmagtGiverId,
            fuldmagtGiverName: fuldmagtRequest.fuldmagtGiverName,
            fuldmagtGiverImage: fuldmagtRequest.fuldmagtGiverImage,
            agentId: fuldmagtRequest.agentId,
            agentName: fuldmagtRequest.agentName,
            agentDOB: fuldmagtRequest.agentDOB,
            agentEmail: fuldmagtRequest.agentEmail,
            agentPhone: fuldmagtRequest.agentPhone,
            fuldmagtGiverSignature: signature,
            agentSignature: null,
            expiry: fuldmagtRequest.expiry,
            fuldmagtStatement: fuldmagtRequest.fuldmagtStatement,
            requestStatus: "approved"
        }

        let fuldmagt = await fuldmagtRepository.createFuldmagt(fuldmagtData);
        await fuldmagtRequestRepository.deleteFuldmagtRequest(fuldmagtRequestId);


        let fuldmagtForm = await fuldmagtFormRepository.getSpecificFuldmagtForm(fuldmagtRequest.fuldmagtFormId);

        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found by given Id")
        }

        notificationServices.notifyFuldmagtRequestApproval({
            fuldmagtGiverName: fuldmagtRequest.fuldmagtGiverName,
            fuldmagtRequestId: fuldmagtRequestId,
            agentEmail: fuldmagtRequest.agentEmail,
            agentId: fuldmagtRequest.agentId,
            agentName: fuldmagtRequest.agentName,
            title: fuldmagtForm.title,
            fuldmagtGiverImage: fuldmagtRequest.fuldmagtGiverImage,
            acceptedAt: new Date()
        });

        return fuldmagt;
    },

    async rejectFuldmagtRequest(userId, companyId, fuldmagtRequestId) {
        let fuldmagtRequest = await fuldmagtRequestRepository.getSpecificFuldmagtRequest(fuldmagtRequestId);

        if (!fuldmagtRequest)
            throw createHttpError.NotFound("Fuldmagt Request not found by given Id")

        if (!fuldmagtRequest.fuldmagtGiverId)
            throw createHttpError.Unauthorized("Fuldmagt Request is not assigned to any user")

        let fuldmagtRequestAccess = false;
        if (userId && fuldmagtRequest.fuldmagtGiverId.toString() == userId.toString()) {
            fuldmagtRequestAccess = true;
        }
        if (companyId && fuldmagtRequest.fuldmagtGiverId.toString() == companyId.toString()) {
            fuldmagtRequestAccess = true;
        }

        if (!fuldmagtRequestAccess) {
            throw createHttpError.Unauthorized("You don't have access to this fuldmagt request")
        }

        let updatedFuldmagtRequest = await fuldmagtRequestRepository.updateFuldmagtRequest(fuldmagtRequestId, { requestStatus: "rejected" });

        let fuldmagtForm = await fuldmagtFormRepository.getSpecificFuldmagtForm(fuldmagtRequest.fuldmagtFormId);

        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found by given Id")
        }

        notificationServices.notifyFuldmagtRequestRejection({
            fuldmagtGiverName: fuldmagtRequest.fuldmagtGiverName,
            fuldmagtRequestId: fuldmagtRequestId,
            agentEmail: fuldmagtRequest.agentEmail,
            agentId: fuldmagtRequest.agentId,
            agentName: fuldmagtRequest.agentName,
            title: fuldmagtForm.title,
            fuldmagtGiverImage: fuldmagtRequest.fuldmagtGiverImage,
            rejectedAt: new Date()
        });

        return updatedFuldmagtRequest;
    },

    async getSpecificFuldmagtRequest(fuldmagtRequestId, userId, companyId) {
        let fuldmagtRequest = await fuldmagtRequestRepository.getSpecificFuldmagtRequest(fuldmagtRequestId);

        if (!fuldmagtRequest) {
            throw createHttpError.NotFound("Fuldmagt Request not found by given Id")
        }

        let fuldmagtRequestAccess = false;
        if (userId && fuldmagtRequest.fuldmagtGiverId.toString() == userId.toString()) {
            fuldmagtRequestAccess = true;
        }
        if (companyId && fuldmagtRequest.fuldmagtGiverId.toString() == companyId.toString()) {
            fuldmagtRequestAccess = true;
        }
        let fuldmagtRequestAgentAccess = false;
        if (userId && fuldmagtRequest.agentId.toString() == userId.toString()) {
            fuldmagtRequestAgentAccess = true;
        }
        if (companyId && fuldmagtRequest.agentId.toString() == companyId.toString()) {
            fuldmagtRequestAgentAccess = true;
        }

        if (!fuldmagtRequestAccess && !fuldmagtRequestAgentAccess) {
            throw createHttpError.Unauthorized("You don't have access to this fuldmagt request")
        }

        fuldmagtRequest = fuldmagtRequest;

        fuldmagtRequest.satus = (fuldmagtRequest.agentId != userId) ? "received_request" : "sent_request";

        return fuldmagtRequest;
    },

    async getSpecificFuldmagtRequestByAdmin(fuldmagtRequestId) {
        let fuldmagtRequest = await fuldmagtRequestRepository.getSpecificFuldmagtRequest(fuldmagtRequestId);

        if (!fuldmagtRequest) {
            throw createHttpError.NotFound("Fuldmagt Request not found by given Id")
        }

        return fuldmagtRequest;
    },

    async getSpecificFuldmagt(fuldmagtId, userId, companyId) {
        let fuldmagt = await fuldmagtRepository.getSpecificFuldmagt(fuldmagtId);
        if (!fuldmagt) {
            throw createHttpError.NotFound("Fuldmagt not found by given Id")
        }

        let fuldmagtAccess = false;
        if (userId && fuldmagt.fuldmagtGiverId.toString() == userId.toString()) {
            fuldmagtAccess = true;
        }
        if (companyId && fuldmagt.fuldmagtGiverId.toString() == companyId.toString()) {
            fuldmagtAccess = true;
        }
        let fuldmagtAgentAccess = false;
        if (userId && fuldmagt.agentId.toString() == userId.toString()) {
            fuldmagtAgentAccess = true;
        }
        if (companyId && fuldmagt.agentId.toString() == companyId.toString()) {
            fuldmagtAgentAccess = true;
        }

        if (!fuldmagtAccess && !fuldmagtAgentAccess) {
            throw createHttpError.Unauthorized("You don't have access to this fuldmagt")
        }

        return fuldmagt;
    },

    async getUserFuldmagts(userId, companyId, isCompany) {
        let fuldmagts = await fuldmagtRepository.getUserFuldmagts(userId, companyId, isCompany);
        fuldmagts = fuldmagts.map(fuldmagt => {
            fuldmagt.isRequest = false;
            return fuldmagt;
        })
        let fuldmagtRequests = await fuldmagtRequestRepository.getUserFuldmagtRequests(userId, companyId, isCompany);
        //add isRequest to fuldmagtRequests
        fuldmagtRequests = fuldmagtRequests.map(request => {
            request.isRequest = true;
            return request;
        })
        //Sorting All Fuldmagts and Fuldmagt Requests by Created At//
        let allFuldmagts = [];
        while (fuldmagts.length > 0 && fuldmagtRequests.length > 0) {
            if (fuldmagts[0].createdAt > fuldmagtRequests[0].createdAt) {
                allFuldmagts.push(fuldmagts.shift());
            }
            else {
                allFuldmagts.push(fuldmagtRequests.shift());
            }
        }
        while (fuldmagts.length > 0) {
            allFuldmagts.push(fuldmagts.shift());
        }
        while (fuldmagtRequests.length > 0) {
            allFuldmagts.push(fuldmagtRequests.shift());
        }
        // delete fuldmagt.fuldmagtDocumentsLink.fuldmagtDocumentKey
        allFuldmagts.forEach(fuldmagt => {
            if (fuldmagt.fuldmagtDocumentsLink && fuldmagt.fuldmagtDocumentsLink.length > 0) {
                fuldmagt.fuldmagtDocumentsLink = fuldmagt.fuldmagtDocumentsLink.map(doc => {
                    return {
                        fuldmagtIssueDate: doc.fuldmagtIssueDate,
                        fuldmagtDocumentLink: doc.fuldmagtDocumentLink,
                        _id: doc._id
                    }
                });
            }
        });

        return allFuldmagts;
    },

    async issueAgainFuldmagt(userId, companyId, fuldmagtId, fuldmagtDocumentLink) {
        let fuldmagt = await fuldmagtRepository.getSpecificFuldmagt(fuldmagtId);

        if (!fuldmagt) {
            throw createHttpError.NotFound("Fuldmagt not found by given Id")
        }

        let fuldmagtAccess = false;
        if (userId && fuldmagt.fuldmagtGiverId.toString() == userId.toString()) {
            fuldmagtAccess = true;
        }
        if (companyId && fuldmagt.fuldmagtGiverId.toString() == companyId.toString()) {
            fuldmagtAccess = true;
        }

        if (!fuldmagtAccess) {
            throw createHttpError.Unauthorized("You don't have access to this fuldmagt")
        }

        // if (fuldmagt.revoked) {
        //     throw createHttpError.BadRequest("Cannot issue again a revoked fuldmagt")
        // }

        if (fuldmagt.acknowledged) {
            throw createHttpError.BadRequest("Cannot issue again an acknowledged fuldmagt")
        }

        fuldmagt.revoked = false;
        fuldmagt.revokedDate = null;
        fuldmagt.acknowledged = false;
        fuldmagt.acknowledgedDate = null;
        fuldmagt.createdAt = new Date();
        fuldmagt.expiry = new Date(fuldmagt.createdAt.getTime() + 3 * 60 * 60 * 1000);
        fuldmagt.fuldmagtDocumentsLink.push({
            _id: new mongoose.Types.ObjectId(),
            fuldmagtIssueDate: new Date(),
            fuldmagtDocumentLink: fuldmagtDocumentLink
        });

        await fuldmagtRepository.updateFuldmagt(fuldmagtId, fuldmagt);

        let fuldmagtForm = await fuldmagtFormRepository.getSpecificFuldmagtForm(fuldmagt.fuldmagtFormId);

        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found by given Id")
        }

        //{fuldmagtGiverName, fuldmagtId, agentEmail, agentId, agentName, title, fuldmagtGiverImage, reissuedAt}
        notificationServices.notifyFuldmagtReissue({
            fuldmagtGiverName: fuldmagt.fuldmagtGiverName,
            fuldmagtId: fuldmagtId,
            agentEmail: fuldmagt.agentEmail,
            agentId: fuldmagt.agentId,
            agentName: fuldmagt.agentName,
            title: fuldmagtForm.title,
            fuldmagtGiverImage: fuldmagt.fuldmagtGiverImage,
            reissuedAt: new Date()
        });

        return fuldmagt;
    },
    async issueAgainFuldmagtRequest(userId, fuldmagtRequestId, companyId) {
        let fuldmagtRequest = await fuldmagtRequestRepository.getSpecificFuldmagtRequest(fuldmagtRequestId);
        if (!fuldmagtRequest) {
            throw createHttpError.NotFound("Fuldmagt Request not found by given Id")
        }

        let fuldmagtRequestAgentAccess = false;
        if (userId && fuldmagtRequest.agentId.toString() == userId.toString()) {
            fuldmagtRequestAgentAccess = true;
        }
        if (companyId && fuldmagtRequest.agentId.toString() == companyId.toString()) {
            fuldmagtRequestAgentAccess = true;
        }

        if (!fuldmagtRequestAgentAccess) {
            throw createHttpError.Unauthorized("You don't have access to this fuldmagt request")
        }

        fuldmagtRequest.createdAt = new Date();
        fuldmagtRequest.requestStatus = "pending";
        fuldmagtRequest.expiry = new Date(fuldmagtRequest.createdAt.getTime() + 3 * 60 * 60 * 1000);
        await fuldmagtRequestRepository.updateFuldmagtRequest(fuldmagtRequestId, fuldmagtRequest);

        let fuldmagtForm = await fuldmagtFormRepository.getSpecificFuldmagtForm(fuldmagtRequest.fuldmagtFormId);
        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found by given Id")
        }

        notificationServices.notifyFuldmagtRequestReissue({
            fuldmagtGiverName: fuldmagtRequest.fuldmagtGiverName,
            fuldmagtRequestId: fuldmagtRequestId,
            fuldmagtGiverEmail: fuldmagtRequest.fuldmagtGiverEmail,
            fuldmagtGiverId: fuldmagtRequest.fuldmagtGiverId,
            agentName: fuldmagtRequest.agentName,
            title: fuldmagtForm.title,
            agentImage: fuldmagtRequest.agentImage,
            reissuedAt: new Date()
        });
        return fuldmagtRequest;
    },
    async getFuldmagtsByAdmin() {
        let fuldmagts = await fuldmagtRepository.getFuldmagts();
        let fuldmagtRequests = await fuldmagtRequestRepository.getFuldmagtRequests();

        //Sorting All Fuldmagts and Fuldmagt Requests by Created At//
        let allFuldmagts = [];
        while (fuldmagts.length > 0 && fuldmagtRequests.length > 0) {
            if (fuldmagts[0].createdAt > fuldmagtRequests[0].createdAt) {
                allFuldmagts.push(fuldmagts.shift());
            }
            else {
                allFuldmagts.push(fuldmagtRequests.shift());
            }
        }
        while (fuldmagts.length > 0) {
            allFuldmagts.push(fuldmagts.shift());
        }
        while (fuldmagtRequests.length > 0) {
            allFuldmagts.push(fuldmagtRequests.shift());
        }
        return allFuldmagts;
    },
    async getSpecificFuldmagtByAdmin(fuldmagtId) {
        let fuldmagt = await fuldmagtRepository.getSpecificFuldmagt(fuldmagtId);

        if (!fuldmagt) {
            throw createHttpError.NotFound("Fuldmagt not found by given Id")
        }

        return fuldmagt;
    },
    async acknowledgeFuldmagt(userId, companyId, fuldmagtId, agentSignature) {
        let fuldmagt = await fuldmagtRepository.getSpecificFuldmagt(fuldmagtId);

        if (!fuldmagt) {
            throw createHttpError.NotFound("Fuldmagt not found by given Id")
        }

        if (new Date() > fuldmagt.expiry) {
            throw createHttpError.BadRequest("fuldmagt cannot be acknowledged as it has exceeded expiry date")
        }

        if (fuldmagt.acknowledged) {
            throw createHttpError.BadRequest("fuldmagt has already been acknowledged")
        }

        if (fuldmagt.revoked) {
            throw createHttpError.BadRequest("fuldmagt has already been revoked")
        }

        let fuldmagtAgentAccess = false;
        if (userId && fuldmagt.agentId.toString() == userId.toString()) {
            fuldmagtAgentAccess = true;
        }
        if (companyId && fuldmagt.agentId.toString() == companyId.toString()) {
            fuldmagtAgentAccess = true;
        }

        if (!fuldmagtAgentAccess) {
            throw createHttpError.Unauthorized("You don't have access to this fuldmagt")
        }

        if (!agentSignature && fuldmagt.isAgentSignRequired) {
            throw createHttpError.BadRequest("agent signature is required to acknowledge the fuldmagt")
        }
        // console.log("agentSignature", agentSignature);
        let updatedFuldmagt = await fuldmagtRepository.updateFuldmagt(fuldmagtId, { acknowledged: true, agentSignature: agentSignature });

        let agent = await User.findById(fuldmagt.agentId);
        if (!agent) {
            agent = await Company.findById(fuldmagt.agentId);
            if (!agent) {
                throw createHttpError.NotFound("Agent not found by given Id");
            }
        }
        let fuldmagtForm = await fuldmagtFormRepository.getSpecificFuldmagtForm(fuldmagt.fuldmagtFormId);

        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found by given Id")
        }

        let fuldmagtGiver = await User.findById(fuldmagt.fuldmagtGiverId);
        // console.log("fuldmagtGiver", fuldmagtGiver);
        if (!fuldmagtGiver) {
            fuldmagtGiver = await Company.findById(fuldmagt.fuldmagtGiverId);

            if (!fuldmagtGiver) {
                throw createHttpError.NotFound("Fuldmagt Giver not found by given Id");
            }
            // console.log("fuldmagtGiver", fuldmagtGiver);
            if (fuldmagtGiver && fuldmagtGiver.createdBy) {
                // console.log("fuldmagtGiver email", fuldmagtGiver.createdBy);
                fuldmagtGiver = await User.findOne({ _id: fuldmagtGiver.createdBy });
            }
        }
        // console.log("fuldmagtGiver after", fuldmagtGiver);
        if (!fuldmagt.fuldmagtGiverEmail) {
            // console.log("setting fuldmagtGiverEmail", fuldmagtGiver.email);
            fuldmagt.fuldmagtGiverEmail = fuldmagtGiver.email;
        }
        // console.log("fuldmagtGiverEmail", fuldmagt.fuldmagtGiverEmail);
        notificationServices.notifyFuldmagtAcknowledgement({
            fuldmagtGiverName: fuldmagt.fuldmagtGiverName,
            fuldmagtId: fuldmagt._id,
            fuldmagtGiverEmail: fuldmagt.fuldmagtGiverEmail,
            fuldmagtGiverId: fuldmagt.fuldmagtGiverId,
            agentName: fuldmagt.agentName,
            title: fuldmagtForm.title,
            agentImage: agent.image,
            createdAt: fuldmagt.createdAt
        });

        return updatedFuldmagt
    },

    async revokeFuldmagt(userId, companyId, fuldmagtId) {
        //Check if fuldmagt belongs to user or not//
        let fuldmagt = await Fuldmagt.findById(fuldmagtId);
        if (!fuldmagt) {
            throw createHttpError.NotFound("fuldmagt with given id doesn't exist")
        }

        if (fuldmagt.acknowledged) {
            throw createHttpError.BadRequest("fuldmagt has already been acknowledged")
        }

        if (fuldmagt.revoked) {
            throw createHttpError.BadRequest("fuldmagt has already been revoked")
        }

        if (new Date() > fuldmagt.expiry) {
            throw createHttpError.BadRequest("fuldmagt cannot be revoked as it has exceeded expiry date")
        }

        let fuldmagtAccess = false;
        if (userId && fuldmagt.fuldmagtGiverId.toString() == userId.toString()) {
            fuldmagtAccess = true;
        }
        if (companyId && fuldmagt.fuldmagtGiverId.toString() == companyId.toString()) {
            fuldmagtAccess = true;
        }

        if (!fuldmagtAccess) {
            throw createHttpError.Unauthorized("You don't have access to given fuldmagt")
        }

        let fuldmagtForm = await fuldmagtFormRepository.getSpecificFuldmagtForm(fuldmagt.fuldmagtFormId);

        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found by given Id")
        }


        fuldmagt.revoked = true;
        fuldmagt.revokedDate = new Date();

        await fuldmagt.save();

        notificationServices.notifyFuldmagtRevoke({
            fuldmagtGiverName: fuldmagt.fuldmagtGiverName,
            fuldmagtId: fuldmagt._id,
            agentEmail: fuldmagt.agentEmail,
            agentId: fuldmagt.agentId,
            agentName: fuldmagt.agentName,
            title: fuldmagtForm.title,
            fuldmagtGiverImage: fuldmagt.fuldmagtGiverImage
        });

        return fuldmagt;
    },
    async deleteSpecificFuldmagtRequestByAdmin(fuldmagtId) {
        let fuldmagtRequest = await fuldmagtRequestRepository.deleteSpecificFuldmagtRequestByAdmin(fuldmagtId);
        await Notification.deleteMany({ "data.fuldmagtRequestId": mongoose.Types.ObjectId(fuldmagtId) });
        if (!fuldmagtRequest) {
            throw createHttpError.NotFound("Fuldmagt Request not found by given Id");
        }
        return await fuldmagtRequestRepository.deleteFuldmagtRequest(fuldmagtId);
    }
}

module.exports = fuldmagtServices