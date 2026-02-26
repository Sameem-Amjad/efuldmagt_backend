const express = require("express");

// Otp Controller
const userOtpController = require("../controller/otp.controller");
const userController = require("../controller/user.controllers");

const {
  upload,
  uploadFileToS3Bucket,
  uploadFileObjectToS3Bucket,
} = require("../services/S3_ServiceStorage.js");
const User = require("../models/user");
const authGuard = require("../middleware/authGuard.middleware");
const notificationController = require("../controller/notification.controllers");
const {
  decode64FileMiddleware,
  decode64FilesMiddleware,
} = require("../middleware/decode64.middleware");
const { errorHandler } = require("../handlers/error.handlers");
const fuldmagtFormController = require("../controller/fuldmagtForm.controllers");
const fuldmagtController = require("../controller/fuldmagt.controllers");
const expressRedirect = require("../middleware/expressCriiptoVerify.middleware.js");
const userRouter = express.Router();

//verify existing email and phone
userRouter.post(
  "/existing-email-phone",
  errorHandler(userController.verifyExistingEmailOrPhone)
);

//Otp Controller//
userRouter.post(
  "/sendOTP",
  errorHandler(userOtpController.sendOTPToCredentials)
);
userRouter.post(
  "/forget-password/sendOTP",
  errorHandler(userOtpController.sendForgotPasswordOTPToCredentials)
);
userRouter.post(
  "/signup/verifyOTP",
  errorHandler(userOtpController.verifySignupOtp)
);
userRouter.post(
  "/forgot-password/verifyOTP",
  errorHandler(userOtpController.verifyForgotPasswordOtp)
);
userRouter.put(
  "/updateEmail",
  authGuard("user"),
  errorHandler(userOtpController.verifyUpdateEmailOtp)
);
userRouter.put(
  "/updatePhoneNumber",
  authGuard("user"),
  errorHandler(userOtpController.verifyUpdatePhoneNumberOtp)
);

//User Controller//
userRouter.post(
  "/signup/registerUser",
  errorHandler(userController.registerUser)
);
userRouter.post(
  "/create-password",
  errorHandler(userController.createPassword)
);
userRouter.post("/login", errorHandler(userController.login));
userRouter.get("/users", errorHandler(userController.getUsers));
userRouter.post(
  "/verifyDevicePin",
  errorHandler(userController.verifyDevicePin)
);
userRouter.post("/mobileLogin", errorHandler(userController.mobileLogin));
userRouter.get("/users/:id", errorHandler(userController.getUser));
userRouter.get(
  "/user",
  authGuard("user"),
  errorHandler(userController.getUserByToken)
);
userRouter.delete(
  "/deactivateAccount",
  authGuard("user"),
  errorHandler(userController.deactivateAccount)
);
userRouter.put(
  "/refreshTokenCall",
  authGuard("user"),
  errorHandler(userController.refreshTokenCall)
);
userRouter.put(
  "/setPassword/",
  authGuard("user"),
  errorHandler(userController.setPassword)
);
userRouter.put(
  "/updateInfo",
  authGuard("user"),
  errorHandler(userController.updateUser)
);
userRouter.post(
  "/logout",
  authGuard("user"),
  errorHandler(userController.logout)
);
userRouter.post(
  "/verifyPassword",
  authGuard("user"),
  errorHandler(userController.verifyPassword)
);
//Upload Profile Image
userRouter.put(
  "/uploadProfileImage",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  authGuard("user"),
  decode64FilesMiddleware(["profileImage"]),
  async (req, res, next) => {
    try {
      if (req.files["profileImage"] && req.files["profileImage"][0]) {
        let profileImageObj = req.files["profileImage"][0];
        req.profileImageUrl = await uploadFileObjectToS3Bucket(
          profileImageObj,
          req.user
        );
      }
      if (!req.files["profileImage"] || !req.files["profileImage"][0])
        throw new Error("Profile Image doesn't exist");
      next();
    } catch (e) {
      return res.status(500).send({
        success: false,
        message: "An error occured while uploading images",
      });
    }
  },
  errorHandler(userController.uploadProfileImage)
);
userRouter.get(
  "/temporaryUser/:id",
  errorHandler(userController.getTemporaryUser)
);

userRouter.put(
  "/uploadSignature/",
  upload.single("file"),
  authGuard("user"),
  decode64FileMiddleware("file"),
  async (req, res, next) => {
    try {
      const id = req.user; // Extract id from request parameters
      await uploadFileToS3Bucket(User, id)(req, res, next); // Pass id to uploadFileToS3Bucket function
    } catch (error) {
      console.error("Error handling file upload to Firebase:", error);
      res
        .status(500)
        .send({ success: false, message: "Failed to handle file upload" });
    }
  },
  errorHandler(userController.addSignature)
);

userRouter.get("/getSignature/:id", errorHandler(userController.getSignature));
//Getting Temporary User//

//User Notifications//
userRouter.put(
  "/add-notifications-token/",
  authGuard("user"),
  errorHandler(notificationController.addNotificationToken)
);
userRouter.get(
  "/notifications",
  authGuard("user"),
  errorHandler(notificationController.getUserNotifications)
);
userRouter.put(
  "/setActivityNotification",
  authGuard("user"),
  errorHandler(notificationController.setActivityNotification)
);
userRouter.put(
  "/setSpecialOfferNotification",
  authGuard("user"),
  errorHandler(notificationController.setSpecialOfferNotification)
);
userRouter.put(
  "/setFeedbackNotification",
  authGuard("user"),
  errorHandler(notificationController.setFeedbackNotification)
);
userRouter.put(
  "/setReminderNotification",
  authGuard("user"),
  errorHandler(notificationController.setReminderNotification)
);
userRouter.put(
  "/setNewsNotification",
  authGuard("user"),
  errorHandler(notificationController.setNewsNotification)
);
userRouter.get(
  "/notificationSettings",
  authGuard("user"),
  errorHandler(notificationController.getNotificationSettings)
);

//----------------------------------------------------------------------------------------------------------//

//-----------------Fuldmagts-----------------//

userRouter.get(
  "/fuldmagt-requests/:id",
  authGuard("user"),
  errorHandler(fuldmagtController.getSpecificFuldmagtRequest)
);

userRouter.get(
  "/fuldmagts",
  authGuard("user"),
  errorHandler(fuldmagtController.getUserfuldmagts)
);

userRouter.get(
  "/fuldmagts/:id",
  authGuard("user"),
  errorHandler(fuldmagtController.getSpecificfuldmagt)
);

userRouter.post(
  "/fuldmagts",
  authGuard("user"),
  errorHandler(fuldmagtController.createFuldmagt)
);

userRouter.post(
  "/fuldmagt-requests/",
  authGuard("user"),
  errorHandler(fuldmagtController.requestFuldmagt)
);

userRouter.post(
  "/fuldmagt-requests/:id/approve",
  authGuard("user"),
  errorHandler(fuldmagtController.approveFuldmagtRequest)
);

userRouter.delete(
  "/fuldmagt-requests/:id/reject",
  authGuard("user"),
  errorHandler(fuldmagtController.rejectFuldmagtRequest)
);

userRouter.put(
  "/fuldmagts/:id/revoke",
  authGuard("user"),
  errorHandler(fuldmagtController.revokeFuldmagt)
);

userRouter.put(
  "/fuldmagts/:id/reissue",
  authGuard("user"),
  errorHandler(fuldmagtController.issueAgain)
);


userRouter.patch(
  "/fuldmagtsRequest/:id/reissue",
  authGuard("user"),
  errorHandler(fuldmagtController.issueRequestAgain)
);

userRouter.put(
  "/fuldmagts/:id/acknowledge",
  authGuard("user"),
  errorHandler(fuldmagtController.acknowledgeFuldmagtById)
);
userRouter.put(
  "/fuldmagts/:id",
  upload.fields([
    { name: "postImage", maxCount: 1 }, // First field for the first image
    { name: "signature", maxCount: 1 }, // Second field for the second image
  ]),
  authGuard("user"),
  decode64FilesMiddleware(["postImage", "signature"]),
  async (req, res, next) => {
    try {
      if (req.files["signature"] && req.files["signature"][0]) {
        let signatureFileObj = req.files["signature"][0];
        req.signatureUrl = await uploadFileObjectToS3Bucket(
          signatureFileObj,
          req.user
        );
      }

      if (req.files["postImage"] && req.files["postImage"][0]) {
        let postImageFileObj = req.files["postImage"][0];
        req.postImageUrl = await uploadFileObjectToS3Bucket(
          postImageFileObj,
          req.user
        );
      }
      next();
    } catch (e) {
      return res.status(500).send({
        success: false,
        message: "An error occured while uploading images",
      });
    }
  },
  errorHandler(fuldmagtController.updateFuldmagt)
);

//-------------------Fulmagts Form----------------//

userRouter.get(
  "/fuldmagt-forms",
  authGuard("user"),
  errorHandler(fuldmagtFormController.getFuldmagtFormsByUser)
);
userRouter.get(
  "/fuldmagt-forms/:id",
  authGuard("user"),
  errorHandler(fuldmagtFormController.getSpecificFuldmagtFormByUser)
);

userRouter.get("/auth/mitid/start", userController.startMitIdAuthFlow);

userRouter.get('/auth/mitid/login', expressRedirect.middleware({
  // If the user is already logged in, redirect them to the success URL
  successReturnToOrRedirect: '/user/auth/mitid/callback-success',
  // console.log("Setting failure redirect URL1"); // Add this
  failureRedirect: '/user/auth/mitid/error',
}));

userRouter.get("/auth/mitid/callback", expressRedirect.middleware({
  // On successful authentication by Criipto
  successReturnToOrRedirect: '/user/auth/mitid/callback-success',
  // On failure
  // console.log("Setting failure redirect URL2"); // Add this
  failureRedirect: '/user/auth/mitid/error',
}));
userRouter.get('/auth/mitid/callback-success', expressRedirect.middleware({ failureRedirect: '/auth/mitid/error' }), userController.handleMitIdCallbackSuccess);

userRouter.get('/auth/mitid/error', userController.handleMitIdCallbackError);

userRouter.post('/blocked-by-admin', userController.handleBlockedByAdmin);

module.exports = userRouter;
