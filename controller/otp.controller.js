const Joi = require("joi");
const userServices = require("../services/user.services");

// Define Joi schema for email validation
const { dataResponse } = require("../utils/responses");

const otpController = {
    // ......................send otp ............................
    async sendOTPToCredentials(req, res, next) {
        const credentials = req.body;

        let resBody = await userServices.sendOTPToCredentials(credentials);

        return res.status(200).json(dataResponse("OTP has been sent successfully", resBody));
    },
    async sendForgotPasswordOTPToCredentials(req, res, next) {
        const credentials = req.body;

        let resBody = await userServices.sendForgotPasswordOTPToCredentials(credentials);

        return res.status(200).json(dataResponse("OTP has been sent successfully", resBody));
    },

    async verifySignupOtp(req, res, next) {
        const { otp, encryptedOTPToken } = req.body;

        //getting equal make a jwt for making account//
        let credentialsToken = await userServices.verifySignupOtp(otp, encryptedOTPToken);

        return res.status(200).send(dataResponse("Otp has been verified successfully", { credentialsToken }));
    },
    async verifyForgotPasswordOtp(req, res, next) {
        const { otp, encryptedOTPToken } = req.body;

        let resBody = await userServices.verifyForgotPasswordOtp(encryptedOTPToken, otp);

        res.status(200).json(dataResponse("Otp has been verified successfully", resBody));
    },
    async verifyUpdateEmailOtp(req, res, next) {
        const userId = req.user;
        const { otp, encryptedOTPToken } = req.body;

        let user = await userServices.verifyUpdateEmailOtp(userId, otp, encryptedOTPToken);

        res.status(200).json(dataResponse("Email has been changed successfully", { updatedUser: user }));
    },
    async verifyUpdatePhoneNumberOtp(req, res, next) {
        const userId = req.user;
        const { otp, encryptedOTPToken } = req.body;

        let user = await userServices.verifyUpdatePhoneNumberOtp(userId, otp, encryptedOTPToken);

        res.status(200).json(dataResponse("Phone number has been changed successfully", { updatedUser: user }));
    }
};

module.exports = otpController;
