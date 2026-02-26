const express = require("express");
const router = express.Router();
const { errorHandler } = require("../handlers/error.handlers");
const authGuard = require("../middleware/authGuard.middleware");
const SignatureController = require("../controller/midItSignature.controllers");
const uploadMiddleware = require("../middleware/uploadFile");
router.post("/create", authGuard("user"), uploadMiddleware.single("file"), errorHandler(SignatureController.createSignatureOrder));
router.post("/add-signatory/:orderId", authGuard("user"), errorHandler(SignatureController.addSignatory));
router.get("/callback", errorHandler(SignatureController.handleCallback));
router.post("/close/:orderId", authGuard("user"), errorHandler(SignatureController.closeSignatureOrder));

module.exports = router;
