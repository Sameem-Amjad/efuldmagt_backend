const express = require("express");
const authGuard = require("../middleware/authGuard.middleware");
const generalRouter = express.Router();
const { errorHandler } = require("../handlers/error.handlers");
const awsController = require("../controller/aws.controllers");
const cvrController = require("../controller/checkCvr.controllers");

//File Upload Link Generation//
generalRouter.post('/get-presigned-url',
    errorHandler(awsController.getPresignedUrl)
);

generalRouter.get('/check-cvr-by-name-or-number',
    authGuard("user"),
    errorHandler(cvrController.checkCVRCompanyByNameOrNumber)
);

generalRouter.get('/check-cvr-by-name-or-number-by-admin',
    authGuard("admin"),
    errorHandler(cvrController.checkCVRCompanyByNameOrNumber)
);

module.exports = generalRouter;