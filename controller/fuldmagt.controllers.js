
const User = require("../models/user");
const Company = require("../models/company");
const jwt = require("jsonwebtoken");
const { verifyCreateFuldmagt, verifyRequestFuldmagt } = require("../schemas/fuldmagt");
const Fuldmagt = require("../models/fuldmagt");
const fuldmagtServices = require("../services/fuldmagt.services");
const FulmagtForm = require("../models/fuldmagtForm");
const createHttpError = require("http-errors");
const { dataResponse } = require("../utils/responses");
const { getFuldmagts } = require("../repositories/fuldmagt.repositories");
const Notification = require("../models/notification");
const { deleteFileFromS3 } = require("../services/S3_ServiceStorage");
const fuldmagtController = {
    async createFuldmagt(req, res, next) {
        let validate = verifyCreateFuldmagt.validate(req.body);

        if (validate.error) {
            throw createHttpError.BadRequest(validate.error.message);
        }

        let fuldmagtData = {
            ...req.body,
            agentPhone: {
                countryCode: req.body.agentCountryCode,
                number: req.body.agentPhoneNumber
            }
        }

        let userId = req.user
        let companyId = req.company

        let fuldmagt = await fuldmagtServices.createFuldmagt(userId, companyId, fuldmagtData)

        return res.status(200).send(dataResponse("fuldmagt has been added successfully", { fuldmagt }))
    },

    async requestFuldmagt(req, res, next) {
        let validate = verifyRequestFuldmagt.validate(req.body);

        if (validate.error) {
            throw createHttpError.BadRequest(validate.error.message);
        }
        let fuldmagtData = {
            ...req.body,
            fuldmagtGiverPhone: {
                countryCode: req.body.fuldmagtGiverCountryCode,
                number: req.body.fuldmagtGiverPhoneNumber
            }
        }

        let userId = req.user;

        let fuldmagtRequest = await fuldmagtServices.requestFuldmagt(userId, fuldmagtData);

        return res.status(200).send(dataResponse("fuldmagt request has been added successfully", { fuldmagtRequest }))
    },

    async approveFuldmagtRequest(req, res, next) {
        let userId = req.user;
        let companyId = req.company;
        let fuldmagtRequestId = req.params.id;
        let { signature, fuldmagtDocumentLink = "", fuldmagtDocumentKey = "" } = req.body;

        let fuldmagt = await fuldmagtServices.approveFuldmagtRequest(userId, companyId, fuldmagtRequestId, signature, fuldmagtDocumentLink, fuldmagtDocumentKey);

        return res.status(200).send(dataResponse("Fuldmagt has been approved successfully", { fuldmagt }))
    },

    async rejectFuldmagtRequest(req, res, next) {
        let userId = req.user;
        let companyId = req.company;
        let fuldmagtRequestId = req.params.id;

        let fuldmagtRequest = await fuldmagtServices.rejectFuldmagtRequest(userId, companyId, fuldmagtRequestId);

        return res.status(200).send(dataResponse("Fuldmagt Request has been rejected successfully", { fuldmagtRequest }))
    },

    async getUserfuldmagts(req, res, next) {
        let userId = req.user;
        let companyId = req.company;
        let isCompany = req.query.isCompany === 'true' ? true : false;
        let fuldmagts = await fuldmagtServices.getUserFuldmagts(userId, companyId, isCompany);

        return res.status(200).send(dataResponse("Fuldmagts have been successfully fetched", { fuldmagts }))
    },

    async getSpecificFuldmagtRequest(req, res, next) {
        let fuldmagtId = req.params.id;
        let userId = req.user;
        let companyId = req.company;

        let fuldmagtRequest = await fuldmagtServices.getSpecificFuldmagtRequest(fuldmagtId, userId, companyId);

        return res.status(200).send(dataResponse("Fuldmagt Request has been successfully fetched", { fuldmagtRequest }))
    },
    async getSpecificFuldmagtRequestByAdmin(req, res, next) {
        let fuldmagtRequestId = req.params.id;

        let fuldmagtRequest = await fuldmagtServices.getSpecificFuldmagtRequestByAdmin(fuldmagtRequestId);

        return res.status(200).send(dataResponse("Fuldmagt Request has been successfully fetched", { fuldmagtRequest }))
    },

    async getSpecificFuldmagt(req, res, next) {
        let fuldmagtId = req.params.id;
        let userId = req.user;
        let companyId = req.company;

        let fuldmagt = await fuldmagtServices.getSpecificFuldmagt(fuldmagtId, userId, companyId);

        return res.status(200).send(dataResponse("Fuldmagt has been successfully fetched", { fuldmagt }))
    },

    async getSpecificFuldmagtByAdmin(req, res, next) {
        let fuldmagtId = req.params.id;

        let fuldmagt = await fuldmagtServices.getSpecificFuldmagtByAdmin(fuldmagtId);

        return res.status(200).send(dataResponse("Fuldmagt has been successfully fetched", { fuldmagt }))
    },

    async issueAgain(req, res, next) {
        let fuldmagtId = req.params.id;
        let userId = req.user;
        let companyId = req.company;
        let fuldmagtDocumentLink = req.body.fuldmagtDocumentLink;

        let fuldmagt = await fuldmagtServices.issueAgainFuldmagt(userId, companyId, fuldmagtId, fuldmagtDocumentLink);

        return res.status(200).send(dataResponse("Fuldmagt has been issued again", { fuldmagt }))
    },
    async issueRequestAgain(req, res, next) {
        let fuldmagtRequestId = req.params.id;
        let userId = req.user;
        let companyId = req.company;

        let fuldmagtRequest = await fuldmagtServices.issueAgainFuldmagtRequest(userId, fuldmagtRequestId, companyId);

        return res.status(200).send(dataResponse("Fuldmagt Request has been issued again", { fuldmagtRequest }))
    },
    async getFuldmagtsByAdmin(req, res, next) {
        let fuldmagts = await fuldmagtServices.getFuldmagtsByAdmin();
        return res.status(200).send(dataResponse("Fuldmagts have been successfully fetched", { fuldmagts }))
    },
    async getSpecificFuldmagtByAdmin(req, res, next) {
        let fuldmagtId = req.params.id;
        let fuldmagt = await fuldmagtServices.getSpecificFuldmagtByAdmin(fuldmagtId);
        return res.status(200).send(dataResponse("Fuldmagt has been successfully fetched", { fuldmagt }))
    },
    async revokeFuldmagt(req, res, next) {
        //Making a Body for fuldmagt Body//
        let fuldmagtId = req.params.id;

        let userId = req.user;

        let companyId = req.company;

        let fuldmagt = await fuldmagtServices.revokeFuldmagt(userId, companyId, fuldmagtId);

        return res.status(200).send(dataResponse("Fuldmagt has been revoked successfully", { fuldmagt }))
    },
    async updateFuldmagt(req, res, next) {
        try {
            //Making a Body for fuldmagt Body//
            let fuldmagtId = req.params.id;
            let fuldmagtData = {
                ...req.body
            }
            if (req.signatureUrl) {
                fuldmagtData.signature = req.signatureUrl;
            }
            if (req.postImageUrl) {
                fuldmagtData.postImage = req.postImageUrl;
            }
            if (req.body.agentCountryCode && req.body.agentNumber) {
                fuldmagtData.phone = {
                    countryCode: req.body.agentCountryCode,
                    number: req.body.agentNumber
                }
            }

            //As Fuldmagt is getting updated, so it won't be revoked anymore and it is also not acknowledged//
            fuldmagtData.revoked = false;
            fuldmagtData.revokedDate = null;
            fuldmagtData.acknowledged = false;
            fuldmagtData.acknowledgedDate = null;
            //If we have agent Id, then Fetch agent Data//
            let agentId = req.body.agentId;
            if (agentId) {
                let agent = await User.findById(agentId);

                if (!agent) {
                    return res.status(404).send({
                        "success": false,
                        "message": "agent not found by given Id"
                    })
                }

                fuldmagtData.agentName = agent.name.firstName + " " + agent.name.lastName;
                fuldmagtData.agentPhone = agent.phone,
                    fuldmagtData.agentDOB = agent.dateOfBirth,
                    fuldmagtData.agentEmail = agent.email
            }

            //Check if User has 
            //Account Type Check//
            let fuldmagtGiver = await User.findById(req.user);

            if (fuldmagtData.accountType == "user") {
                fuldmagtData.fuldmagtGiverId = fuldmagtGiver._id;
                fuldmagtData.fuldmagtGiverName = fuldmagtGiver.name.firstName + " " + fuldmagtGiver.name.lastName;
            } else if (fuldmagtData.accountType == "company") {
                if (!req.company)
                    return res.status(400).send({
                        success: false,
                        message: "Company is not registered on user"
                    })

                let company = await Company.findById(req.company);
                fuldmagtData.fuldmagtGiverId = company._id;
                fuldmagtData.fuldmagtGiverName = company.companyName;
            }
            //Check if fuldmagt belongs to user or not//
            let fuldmagt = await Fuldmagt.findById(fuldmagtId);
            if (!fuldmagt) {
                return res.status(404).send({
                    "success": false,
                    "message": "fuldmagt with given id doesn't exist"
                })
            }

            if (fuldmagt.fuldmagtGiverId != req.user && fuldmagt.fuldmagtGiverId != req.company) {
                return res.status(401).send({
                    "success": false,
                    "message": "You don't have access to given fuldmagt"
                })
            }

            let updatedfuldmagt = await Fuldmagt.findByIdAndUpdate(fuldmagtId, fuldmagtData, { new: true })

            let fuldmagtToken = jwt.sign({ fuldmagtId: updatedfuldmagt._id }, process.env.FULDMAGT_TOKEN)

            // console.log(fuldmagtToken);

            return res.status(200).send({
                success: true,
                message: "fuldmagt has been updated successfully",
                data: {
                    fuldmagt: updatedfuldmagt
                }
            })
        }
        catch (err) {
            return res.status(500).send({
                success: false,
                message: err.message
            });
        }
    },
    async acknowledgeFuldmagtById(req, res, next) {
        let fuldmagtId = req.params.id;

        let userId = req.user;
        let companyId = req.company;

        let { agentSignature } = req.body;
        let fuldmagt = await fuldmagtServices.acknowledgeFuldmagt(userId, companyId, fuldmagtId, agentSignature);

        return res.status(200).send(dataResponse("Fuldmagt has been acknowledged successfully", { fuldmagt }))
    },
    async getSpecificfuldmagt(req, res, next) {
        let userId = req.user;
        let companyId = req.company;
        let fuldmagtId = req.params.id;

        let fuldmagt = await fuldmagtServices.getSpecificFuldmagt(fuldmagtId, userId, companyId);

        return res.status(200).send(dataResponse("fuldmagt has been fetched", { fuldmagt }))
    },

    async allowUserFuldmagtForm(req, res, next) {
        try {
            let {
                userId,
                fulmagtFormId
            } = req.body;

            let user = await User.findById(userId);

            if (!user)
                return res.status(404).send({
                    message: "User with current id not found"
                });

            let fuldmagtForm = await FulmagtForm.findById(fulmagtFormId);

            if (!fuldmagtForm)
                return res.status(404).send({
                    message: "Fuldmagt form with given id not found"
                });



        }
        catch (err) {
            return res.status(500).send({
                success: false,
                message: err.message
            });
        }
    },
    async getUserfuldmagtForms(req, res, next) {
        try {
            let userId = req.user;
            let companyId = req.company;

            let fuldmagtForms = await FulmagtForm.find({
                $or: [
                    { allowedUsers: userId },
                    { allowedCompanies: companyId }
                ]
            });

            return res.status(200).send({
                message: "Fulmagt Forms Received",
                data: {
                    fuldmagtForms
                }
            })
        }
        catch (err) {
            return res.status(500).send({
                success: false,
                message: err.message
            });
        }
    },
    async deleteSpecificFuldmagtByAdmin(req, res, next) {
        try {
            let fuldmagtId = req.params.id;

            let fuldmagt = await Fuldmagt.findById(fuldmagtId);

            if (!fuldmagt) {
                let fuldmagtRequest = await fuldmagtServices.deleteSpecificFuldmagtRequestByAdmin(fuldmagtId);
                if (fuldmagtRequest) {
                    return res.status(400).send({
                        success: true,
                        message: " Fuldmagt Request deleted successfully"
                    });
                }
            }
            if (fuldmagt.fuldmagtDocumentsLink.length > 0) {
                fuldmagt.fuldmagtDocumentsLink.forEach(async (document) => {
                    let documentKey = document.fuldmagtDocumentKey;
                    //Delete from S3 Bucket
                    if (documentKey)
                        await deleteFileFromS3(documentKey);
                })
            }
            await Fuldmagt.findByIdAndDelete(fuldmagtId);
            await Notification.deleteMany({ "data.fuldmagtId": mongoose.Types.ObjectId(fuldmagtId) });

            return res.status(200).send({
                success: true,
                message: "Fuldmagt deleted successfully"
            });
        }
        catch (err) {
            return res.status(500).send({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = fuldmagtController