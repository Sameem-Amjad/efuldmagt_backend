const nodemailer = require('nodemailer');

async function sendEmail(email, subject, body) {
    var mail = nodemailer.createTransport({
        host: 'smtp.simply.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_ID, // Your email id
            pass: process.env.EMAIL_PASSWORD // Your password
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    var mailOptions = {
        from: process.env.EMAIL_ID,
        to: email,
        subject: subject,
        html: body
    };


    let response = null;

    try {
        response = await mail.sendMail(mailOptions);
    }
    catch (err) {
        console.log(err)
        // throw new Error(`Failed to send email: ${err.message}`);
    }

    return response
}
module.exports = { sendEmail };