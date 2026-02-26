const { CriiptoVerifyExpressRedirect } = require('@criipto/verify-express');
require('dotenv').config();
const expressRedirect = new CriiptoVerifyExpressRedirect({
    domain: process.env.CRIIPTO_MIDIT_DOMAIN,
    clientID: process.env.CRIIPTO_MIDIT_CLIENT_ID,
    clientSecret: process.env.CRIIPTO_MIDIT_CLIENT_SECRET,

    // This MUST match the full callback URL configured in your Criipto application
    redirectUri: process.env.CRIIPTO_MIDIT_REDIRECT_URI,

    // Setting postLogoutRedirectUri is recommended
    postLogoutRedirectUri: '/',

    // Customization example
    beforeAuthorize(req, options) {
        // You can still add dynamic parameters like LoA (acr_values) if needed
        // let values = {
        //     ...options,
        //     acr_values: 'urn:grn:authn:dk:mitid:low',
        //     prompt: req.query.prompt,

        // }
        // console.log("Authorize Options:", values);
        return {
            ...options,
            acr_values: 'urn:grn:authn:dk:mitid:low',
            prompt: req.query.prompt,
        };
    },
});
module.exports = expressRedirect;