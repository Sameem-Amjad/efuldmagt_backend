const express = require("express");
const { errorHandler } = require("../handlers/error.handlers");

// controlers
const paymentController = require("../controller/payment.controllers");

const paymentRouter = express.Router();

paymentRouter.post(
  "/create-quickpay-link",
  errorHandler(paymentController.createPaymentLink)
);

paymentRouter.get(
  "/verify-payment/:orderId",
  errorHandler(paymentController.verifyPayment)
);

module.exports = paymentRouter;
