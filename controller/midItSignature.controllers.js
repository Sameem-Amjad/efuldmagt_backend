const SignatureService = require("../services/midItSignature.service");
const { s3 } = require("../services/aws-bucket.services");
const createHttpError = require("http-errors");

const createSignatureOrder = async (req, res, next) => {
    try {
        // from multer file upload
        let file = req.file;
        if (!file) return res.status(400).json({ success: false, error: "Missing file upload." });
        const signatureOrder = await SignatureService.createOrder(file.buffer.toString("base64"));

        res.status(201).json({
            success: true,
            message: "Signature order created successfully.",
            data: signatureOrder,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const addSignatory = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        if (!orderId) return res.status(400).json({ error: "Missing 'orderId'." });

        const signatory = await SignatureService.addSignatoryToOrder(orderId);

        res.status(201).json({
            message: "Signatory added successfully.",
            signLink: signatory.href,
            signatoryId: signatory.id,
        });
    } catch (err) {
        next(err);
    }
};

const handleCallback = async (req, res) => {
    try {
        const { order_id, signatory_id } = req.query;

        if (!order_id) {
            return res.status(400).json({ success: false, error: "Missing 'order_id' in query." });
        }

        // console.log(`Callback received for Order ID: ${order_id}, Signatory ID: ${signatory_id}`);
        // console.log(`Attempting to close order ${order_id}...`);

        // --- NEW LOGIC ---
        // 1. Immediately try to close the signature order
        const closedOrder = await SignatureService.closeOrder(order_id);

        // 2. If it succeeds, the order is complete. Save the document.
        // console.log(`Order ${order_id} closed successfully. Saving PDF...`);

        if (!closedOrder.documents || closedOrder.documents.length === 0) {
            const error = new createHttpError.BadRequest('Order closed, but no signed documents were found.');
            error.allowSignNow = false;
            // console.error(`Error: ${error.allowSignNow}`);
            throw error;
        }

        // 3. Get the signed PDF blob (Buffer)
        const signedDocument = closedOrder.documents[0]; // Assuming one document
        const signedPdfBlob = signedDocument.blob;
        const s3UploadParams = {
            Bucket: process.env.AWS_BUCKET,
            Key: `signed-documents/${order_id}.pdf`,
            Body: Buffer.from(signedPdfBlob, 'base64'),
            ContentType: 'application/pdf'
            // ACL: 'public-read' // Uncomment if you want the file to be publicly readable
        };

        let uploadResult = await s3.upload(s3UploadParams).promise();

        // console.log(`Successfully signed and saved PDF to: ${uploadResult.Location}`);

        // 5. Respond to the user's browser
        // In a real app, you would redirect to your frontend success page:
        // res.redirect(`${process.env.FRONTEND_URL}/signing-complete?orderId=${order_id}`);

        res.status(200).json({
            message: "Signatory has completed the flow. File saved successfully.",
            orderId: order_id,
            serverSavePath: uploadResult.Location,
            fuldmagtDocumentKey: `signed-documents/${order_id}.pdf`,
            allowSignNow: true
        });
        // --- END NEW LOGIC ---

    } catch (err) {
        // --- NEW ERROR HANDLING ---
        // This is the *expected* error if we are waiting for more signatures
        if (err.message.includes('Not all signatories have signed')) {
            const { order_id } = req.query;
            console.warn(`Order ${order_id} not closed: ${err.message}`);

            // Send a "202 Accepted" status. The request is good, but the process isn't finished.
            // In a real app, redirect to a "waiting" page on your frontend:
            // res.redirect(`${process.env.FRONTEND_URL}/signing-pending?orderId=${order_id}`);

            return res.status(202).json({
                message: "Thank you for signing. Waiting for other signatories to complete the flow.",
                orderId: order_id,
                allowSignNow: true
            });
        }
        // Pass any other, unexpected errors
        // next(err);
        res.status(500).json({ success: false, message: err.message, allowSignNow: false });
    }
};

const closeSignatureOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        if (!orderId) return res.status(400).json({ error: "Missing 'orderId'." });

        const closedOrder = await SignatureService.closeOrder(orderId);
        res.status(200).json({
            message: "Signature order closed successfully.",
            orderId: closedOrder.id,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createSignatureOrder,
    addSignatory,
    handleCallback,
    closeSignatureOrder,
};
