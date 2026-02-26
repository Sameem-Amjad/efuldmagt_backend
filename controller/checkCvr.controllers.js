

// ⚠️ STEP 1: DEFINE YOUR CUSTOM USER-AGENT STRING ⚠️

const Company = require("../models/company");

// IMPORTANT: Replace the placeholders below with your actual information.
const CUSTOM_USER_AGENT = 'microsoft - efuldmagt - sameemamjadarsu@gmail.com';

const CVR_CONFIG = {
    headers: {
        'User-Agent': CUSTOM_USER_AGENT,
        // The Accept header is optional but good practice to ensure JSON response
        'Accept': 'application/json'
    }
};

const cvrController = {
    async checkCVRCompanyByNameOrNumber(req, res) {
        const axios = require("axios");
        const { name, number } = req.query;
        // console.log("Received parameters:", { name, number });

        let searchTerm = name || number;

        if (!searchTerm) {
            return res.status(400).json({ error: "Missing required query parameter: 'name' or 'number'" });
        }

        try {
            // STEP 2: Pass the configuration object (CVR_CONFIG) to axios.get()
            const apiUrl = `https://cvrapi.dk/api?search=${encodeURIComponent(searchTerm)}&country=dk`;

            let data = await axios.get(apiUrl, CVR_CONFIG);
            let existingCompanyInOurDB = await Company.findOne({
                cvr: data.data.vat
            });
            if (existingCompanyInOurDB) {
                data.data.existingCompanyInOurDB = existingCompanyInOurDB;
            }
            return res.status(200).json(data.data);

        } catch (error) {
            // Log the error for debugging
            console.error("CVR API Request Failed:", error.message);

            // Handle specific quota error if possible, or send a general server error
            let status = error.response ? error.response.status : 500;
            let errorMessage = error.response ? error.response.data : "External API request failed";

            if (status === 429) { // 429 is often used for "Too Many Requests" (Quota Exceeded)
                return res.status(429).json({ error: "Quota Exceeded. Please try again later.", details: errorMessage });
            }

            return res.status(status).json({ error: errorMessage });
        }
    }
}


module.exports = cvrController;