// services/midItSignature.service.js
const { CriiptoSignatures } = require("@criipto/signatures");
const dotenv = require("dotenv");
const createHttpError = require("http-errors");
dotenv.config();

// Initialize the Criipto client once
let client;

function initClient() {
    if (!client) {
        client = new CriiptoSignatures(
            process.env.CRIPTO_MIDIT_SIGNATURE_CLIENT_ID,
            process.env.CRIPTO_MIDIT_SIGNATURE_SECRET
        );
    }
    return client;
}

/**
 * Create a new signature order
 * @param {string} base64PdfBlob
 */
async function createOrder(base64PdfBlob) {
    const client = initClient();

    try {
        const signatureOrder = await client.createSignatureOrder({
            title: "Efludmagt Document (Node.js Sample)",
            documents: [
                {
                    pdf: {
                        title: "Efludmagt Verification Document",
                        blob: base64PdfBlob,
                        storageMode: "Temporary",
                    },
                },
            ],
            redirectUri: process.env.CRIPTO_MIDIT_SIGNATURES_CALLBACK_URL,
        });

        // console.log(`Signature Order created with ID: ${signatureOrder.id}`);
        const signatory = await client.addSignatory(signatureOrder.id, {
            redirectUri: process.env.CRIPTO_MIDIT_SIGNATURES_CALLBACK_URL,
        });

        return { orderId: signatureOrder.id, signatoryId: signatory.id, signLink: signatory.href };
    } catch (err) {
        console.error("Error in createOrder:", err.message);
        throw new Error("Failed to create signature order.");
    }
}

/**
 * Add a signatory to an existing order
 */
async function addSignatoryToOrder(orderId) {
    const client = initClient();

    try {
        const signatory = await client.addSignatory(orderId, {});
        // console.log(`Signatory added to order ${orderId}. Sign link: ${signatory.href}`);
        return signatory;
    } catch (err) {
        console.error(`Error in addSignatoryToOrder (${orderId}):`, err.message);
        throw new Error("Failed to add signatory.");
    }
}

/**
 * Close a signature order
 */
async function closeOrder(orderId) {
    const client = initClient();

    try {
        const closedOrder = await client.closeSignatureOrder(orderId);
        // console.log(`Signature Order ${orderId} closed.`);
        return closedOrder;
    } catch (err) {
        if (err.message.includes("NOT_ALL_SIGNATORIES_SIGNED")) {
            throw createHttpError(400, "Cannot close order: Not all signatories have signed yet.");
        }
        // console.error(`Error in closeOrder (${orderId}):`, err.message);
        return err
    }
}

module.exports = {
    createOrder,
    addSignatoryToOrder,
    closeOrder,
};
