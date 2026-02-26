const express = require("express");
const Company = require('../models/company')

// controlers
const companyController = require("../controller/company.controllers");

// middleware
const { upload, uploadFileToS3Bucket } = require("../services/S3_ServiceStorage.js");
const authGuard = require("../middleware/authGuard.middleware");
const { decode64FileMiddleware } = require("../middleware/decode64.middleware");
const { errorHandler } = require("../handlers/error.handlers");

const companyRouter = express.Router();

// routes
companyRouter.post("/verifyCompanyCredentials",
    authGuard("user"),
    errorHandler(companyController.verifyCompanyCredentials));
companyRouter.post("/register",
    authGuard("user"),
    errorHandler(companyController.addCompanyByUser));
companyRouter.post("/registerUnverified",
    authGuard("user"),
    errorHandler(companyController.addCompanyUnverified));
companyRouter.put("/assignCompany/:id",
    authGuard("company"),
    errorHandler(companyController.assignCompany));

companyRouter.get("/getCompany/:id",
    errorHandler(companyController.getSpecificCompany));

companyRouter.put("/update",
    authGuard("company"),
    errorHandler(companyController.updateCompanyByUser));
companyRouter.get("/getSignature/:id",
    errorHandler(companyController.getCompanySignature));
companyRouter.get("/getCompanies",
    authGuard("company"),
    errorHandler(companyController.getCompanies));
// add signature route
companyRouter.put('/uploadSignature/',
    upload.single('file'),
    decode64FileMiddleware('file'),
    authGuard("company"),
    async (req, res, next) => {
        try {
            const id = req.company; // Extract id from request parameters
            await uploadFileToS3Bucket(Company, id)(req, res, next); // Pass id to uploadFileToS3Bucket function
        } catch (error) {
            console.error('Error handling file upload to Firebase:', error);
            res.status(500).send({ success: false, message: 'Failed to handle file upload' });
        }
    },
    errorHandler(companyController.updateCompanySignature)
);



module.exports = companyRouter;
