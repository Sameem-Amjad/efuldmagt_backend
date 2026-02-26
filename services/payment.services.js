const { default: axios } = require("axios");

const QUICKPAY_USER_KEY = process.env.QUICKPAY_USER_KEY;
const BASE_URL = process.env.BASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

const authHeader = `Basic ${Buffer.from(`:${QUICKPAY_USER_KEY}`).toString(
  "base64"
)}`;

const paymentServices = {
  async createPaymentLink(orderId, amount, currency) {
    try {

      // Step 1: Create a payment
      const continueUrl = `${FRONTEND_URL}/payment-success?orderId=${orderId}`;
      const cancelUrl = `${FRONTEND_URL}/payment-failed`;

      const response = await axios.post(
        BASE_URL,
        { order_id: orderId, currency: currency },
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            "Accept-Version": "v10",
          },
        }
      );

      const paymentId = response.data.id;

      // Step 2: Generate a payment link
      const linkResponse = await axios.put(
        `${BASE_URL}/${paymentId}/link`,
        { amount: amount, continue_url: continueUrl, cancel_url: cancelUrl }, // Amount in cents (100 = $1.00)
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            "Accept-Version": "v10",
          },
        }
      );

      return linkResponse.data.url;
    } catch (error) {
      console.error(
        "Error creating payment link:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message ||
        "Failed to create QuickPay payment link"
      );
    }
  },

  async verifyPayment(orderId) {
    try {
      const response = await axios.get(`${BASE_URL}?order_id=${orderId}`, {
        headers: {
          Authorization: authHeader,
          "Accept-Version": "v10",
        },
      });

      // Ensure response contains valid data
      if (
        !response.data ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        throw new Error("No payment found for this order ID");
      }

      const payment = response.data[0];

      return {
        status: payment.accepted ? "Paid" : "Pending",
        transactionId: payment.id,
        amount:
          payment.operations?.reduce((sum, op) => sum + (op.amount || 0), 0) ||
          0,
        currency: payment.currency || "Unknown",
      };
    } catch (error) {
      console.error(
        "Error verifying payment:",
        error.response?.data || error.message
      );
      throw new Error(error.response?.data?.message || error.message);
    }
  },
};

module.exports = paymentServices;
