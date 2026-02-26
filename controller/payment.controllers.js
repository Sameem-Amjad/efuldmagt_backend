//User Services
const paymentServices = require("../services/payment.services");

const paymentController = {
  async createPaymentLink(req, res) {
    const { orderId, amount, currency } = req.body;
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    if (!orderId || !amount || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const paymentUrl = await paymentServices.createPaymentLink(
      orderId,
      amount,
      currency
    );
    return res.status(200).json({ paymentUrl });
  },

  async verifyPayment(req, res) {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const paymentStatus = await paymentServices.verifyPayment(orderId); // Ensure this function is defined
    if (!paymentStatus) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.json(paymentStatus);
  },
};

module.exports = paymentController;
