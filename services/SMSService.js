const axios = require("axios"); // npm install axios
const createHttpError = require("http-errors");
const util = require("util");

async function sendSMS(number, message) {
    const payload = {
        sender: "e-fuldmagt",
        message: message,
        recipients: [
            { msisdn: number },
        ],
    };

    const apiToken = process.env.GATEWAY_API_TOKEN;
    const encodedAuth = Buffer.from(`${apiToken}:`).toString("base64");

    try {
        const resp = await axios.post("https://gatewayapi.eu/rest/mtsms", payload, {
            headers: {
                Authorization: `Basic ${encodedAuth}`,
                "Content-Type": "application/json",
            },
        });
        console.log(util.inspect(resp.data, { showHidden: false, depth: null }));
        console.log("congrats! messages are on their way!");
    } catch (error) {
        console.log("oh-no! something went wrong...");
        console.error(error);
    }
}

async function sendSMSToUser(user, message) {
    await sendSMSToPhone(user.phone, message);
}

async function sendSMSToPhone(phone, message) {
    if (phone.countryCode == null)
        throw createHttpError.BadRequest("Country code is not mentioned");
    if (phone.number == null)
        throw createHttpError.BadRequest("Number not found in phone");
    if (!(phone.countryCode == "+45" || phone.countryCode == "45")) {
        console.log("Sending SMS is only valid for Denmark");
        return;
    }

    let msisdn = phone.countryCode + phone.number;

    await sendSMS(msisdn, message);
}

module.exports = { sendSMS, sendSMSToPhone, sendSMSToUser };
