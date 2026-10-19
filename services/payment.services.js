const { default: axios } = require("axios");

const QUICKPAY_USER_KEY = process.env.QUICKPAY_USER_KEY;
const BASE_URL = process.env.BASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

const authHeader = `Basic ${Buffer.from(`:${QUICKPAY_USER_KEY}`).toString(
  "base64"
)}`;

// Demo deployments set STRIPE_SECRET_KEY to take payments with Stripe Checkout instead of
// QuickPay. Only test keys are accepted, so a demo can never charge a real card.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (STRIPE_SECRET_KEY && !/^(sk|rk)_test_/.test(STRIPE_SECRET_KEY)) {
  throw new Error("STRIPE_SECRET_KEY must be a Stripe test key (sk_test_...)");
}
const stripe = STRIPE_SECRET_KEY ? new (require("stripe"))(STRIPE_SECRET_KEY) : null;

const stripeCheckout = {
  async createPaymentLink(orderId, amount, currency) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: amount, // in øre, as sent by the website
            product_data: { name: "e-fuldmagt" },
          },
        },
      ],
      client_reference_id: String(orderId),
      // The success page verifies the id in ?orderId=, so Stripe fills in its session id.
      success_url: `${FRONTEND_URL}/payment-success?orderId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-failed`,
    });
    return session.url;
  },

  async verifyPayment(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      status: session.payment_status === "paid" ? "Paid" : "Pending",
      transactionId: session.payment_intent || session.id,
      amount: session.amount_total || 0,
      currency: (session.currency || "Unknown").toUpperCase(),
    };
  },
};

const paymentServices = {
  async createPaymentLink(orderId, amount, currency) {
    if (stripe) {
      try {
        return await stripeCheckout.createPaymentLink(orderId, amount, currency);
      } catch (error) {
        console.error("Error creating Stripe checkout:", error.message);
        throw new Error("Failed to create payment link");
      }
    }
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
    if (stripe) {
      try {
        return await stripeCheckout.verifyPayment(orderId);
      } catch (error) {
        console.error("Error verifying Stripe payment:", error.message);
        throw new Error("No payment found for this order ID");
      }
    }
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
