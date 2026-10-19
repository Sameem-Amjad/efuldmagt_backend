const nodemailer = require('nodemailer');

async function sendEmail(email, subject, body) {
    // No SMTP account (local dev, or a demo deployment without mail): print the email instead.
    if (!process.env.EMAIL_ID) {
        console.log(`[email not sent: EMAIL_ID unset] to=${email} subject="${subject}"\n` +
            body.replace(/<(style|head)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        return null;
    }
    const port = Number(process.env.EMAIL_PORT || 465);
    var mail = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.simply.com',
        port,
        secure: port === 465,
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