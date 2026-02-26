const revokedFuldmagtEmailTemplate = ({ agentName, revokedDate, fuldmagtGiverName, agentId }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Revocation of E-Fuldmagt</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            padding: 12px 24px;
            background-color: #dc3545;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }
        .button:hover {
            background-color: #c82333;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">Revocation of E-Fuldmagt</div>
        <div class="content">
            <p>Dear ${agentName},</p>
            <p>
            We are writing to inform you that the E-Fuldmagt (digital power of attorney) previously granted to you has been revoked as of ${revokedDate}.
            </p>
            <p>
            This means that the power of attorney is no longer valid, and you no longer have the authority to act on ${fuldmagtGiverName}'s behalf for the following matters:
            </p>

            <ul>
            <li><strong>Date of Revocation:</strong> ${revokedDate}</li>
            </ul>

            <p>
            As a result, the Fuldmagt document is no longer accessible. If you need further assistance or have any questions, please feel free to contact us.
            </p>

            <p>
            Thank you for your attention to this matter.
            </p>
        </div>

        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
        </div>
    </body>
    </html>`;
};

const createFuldmagtEmailTemplate = ({ agentName, createdAt, fuldmagtGiverName, title, agentId, isAgentNew, newPin }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>E-Fuldmagt Notification</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            padding: 12px 24px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">Notification of Signed E-Fuldmagt</div>
        <div class="content">
            <p>Dear ${agentName},</p>
            <p>
            We are writing to inform you that the E-Fuldmagt (digital power of
            attorney) has been successfully signed and completed as of ${createdAt}.
            </p>
            <p>This document grants authority to ${agentName} to act on behalf of ${fuldmagtGiverName} for the following matters:</p>

            <ul>
            <li><strong>Fuldmagt Title:</strong> ${title}</li>
            <li><strong>Date of Signature:</strong> ${createdAt}</li>
            </ul>

            ${isAgentNew ? `
                <p>
            If you have any questions or require further information, please do
            not hesitate to contact us. You can access the signed document via the
            button below.
            </p>
            `: ''}
            

            ${isAgentNew ? `<p>Your new PIN is: ${newPin}</p>` : ''}
            ${isAgentNew ? `<div class="button-container"><a href="https://app.e-fuldmagt.com/signin/" class="button">Open App</a></div>` : ''}


            <p>Thank you for your attention to this matter.</p>
        </div>

        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
        </div>
    </body>
    </html>
    `;
};

const requestFuldmagtEmailTemplate = ({ agentName, createdAt, fuldmagtGiverName, title, fuldmagtGiverId, isFuldmagtGiverNew, newPin }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>E-Fuldmagt Request</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            padding: 12px 24px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">Request for E-Fuldmagt</div>
        <div class="content">
            <p>Dear ${fuldmagtGiverName},</p>
            <p>
            You have received a request to sign a digital power of attorney (E-Fuldmagt)
            granting authority to ${agentName} to act on your behalf for the following matters:
            </p>

            <ul>
            <li><strong>Fuldmagt Title:</strong> ${title}</li>
            <li><strong>Date of Request:</strong> ${createdAt}</li>
            </ul>

            ${isFuldmagtGiverNew ? `<p>
            To review the details and sign the E-Fuldmagt, please click on the button below.
            </p>` : ''}

            ${isFuldmagtGiverNew ? `<p>Your new PIN is: ${newPin}</p>` : ''}
            ${isFuldmagtGiverNew ? `<div class="button-container"><a href="https://https://app.e-fuldmagt.com/signin/" class="button">Open App</a></div>` : ''}

            <p>
            If you have any questions or need further information, feel free to contact us.
            </p>
        </div>

        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
        </div>
    </body>
    </html>
    `;
};

const acknowledgeFuldmagtEmailTemplate = ({ agentName, createdAt, fuldmagtGiverName, title }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>E-Fuldmagt Acknowledgement</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            padding: 12px 24px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">Acknowledgement of E-Fuldmagt</div>
        <div class="content">
            <p>Dear ${fuldmagtGiverName},</p>
            <p>
            We are writing to confirm that the E-Fuldmagt (digital power of attorney) has been successfully signed and completed as of ${createdAt}.
            </p>
            <p>
            This document grants authority to ${agentName} to act on your behalf for the following matters:
            </p>

            <ul>
            <li><strong>Fuldmagt Title:</strong> ${title}</li>
            <li><strong>Date of Signature:</strong> ${createdAt}</li>
            </ul>

            <p>
            If you have any questions or need further information, feel free to contact us.
            </p>
            </div>

            <div class="footer">
                Best regards,<br />
                e-Fuldmagt (digital Power of Attorney)
            </div>
            </div>
            </body>
            </html>`
};

const acceptFuldmagtRequestEmailTemplate = ({ agentName, acceptedAt, fuldmagtGiverName, title }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>E-Fuldmagt Request Accepted</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">E-Fuldmagt Request Accepted</div>
        <div class="content">
            <p>Dear ${agentName},</p>
            <p>
            We are pleased to inform you that your request for the E-Fuldmagt (digital power of attorney) has been accepted as of ${acceptedAt}.
            </p>
            <p>
            This document grants you the authority to act on behalf of ${fuldmagtGiverName} for the following matters:
            </p>

            <ul>
            <li><strong>Fuldmagt Title:</strong> ${title}</li>
            <li><strong>Date of Acceptance:</strong> ${acceptedAt}</li>
            </ul>

            <p>
            If you have any questions or need further information, feel free to contact us.
            </p>
        </div>

        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
        </div>
    </body>
    </html>
    `;
};

const rejectFuldmagtRequestEmailTemplate = ({ agentName, rejectedAt, fuldmagtGiverName, title }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>E-Fuldmagt Request Rejected</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">E-Fuldmagt Request Rejected</div>
        <div class="content">
            <p>Dear ${agentName},</p>
            <p>
            We regret to inform you that your request for the E-Fuldmagt (digital power of attorney) has been rejected as of ${rejectedAt}.
            </p>
            <p>
            This means that you do not have the authority to act on behalf of ${fuldmagtGiverName} for the following matters:
            </p>

            <ul>
            <li><strong>Fuldmagt Title:</strong> ${title}</li>
            <li><strong>Date of Rejection:</strong> ${rejectedAt}</li>
            </ul>

            <p>
            If you have any questions or need further information, feel free to contact us.
            </p>
        </div>

        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
        </div>
    </body>
    </html>
    `;
};

const reissueFuldmagtEmailTemplate = ({ agentName, reissuedAt, fuldmagtGiverName, title }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>E-Fuldmagt Reissued</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            padding: 12px 24px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">E-Fuldmagt Reissued</div>
        <div class="content">
            <p>Dear ${agentName},</p>
            <p>
            We are writing to inform you that the E-Fuldmagt (digital power of attorney) has been reissued as of ${reissuedAt}.
            </p>
            <p>
            This document grants you the authority to act on behalf of ${fuldmagtGiverName} for the following matters:
            </p>

            <ul>
            <li><strong>Fuldmagt Title:</strong> ${title}</li>
            <li><strong>Date of Reissue:</strong> ${reissuedAt}</li>
            </ul>
            If you have any questions or need further information, feel free to contact us.
            </p>
        </div>

        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
        </div>
    </body>
    </html>
    `;
};

const suspendUserEmailTemplate = ({ userName, suspendedAt }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Account Suspension Notification</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {

            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">Account Suspension Notification</div>
        <div class="content">
            <p>Dear ${userName},</p>
            <p>
            We regret to inform you that your account has been suspended as of ${suspendedAt}.
            </p>
            <p>
            If you believe this is a mistake or have any questions regarding this suspension, please contact our support team for further assistance.
            </p>
        </div>
        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
    </body>
    </html>
    `;
};

const deleteUserEmailTemplate = ({ userName, deletedAt }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Account Deletion Notification</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">Account Deletion Notification</div>
        <div class="content">
            <p>Dear ${userName},</p>
            <p>
            We regret to inform you that your account has been deleted as of ${deletedAt}.
            </p>
            <p>
            If you believe this is a mistake or have any questions regarding this deletion, please contact our support team for further assistance.
            </p>
        </div>
        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
    </body>
    </html>
    `;
};

const reactivateUserEmailTemplate = ({ userName, reactivatedAt }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Account Reactivation Notification</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 15px;
        }
        .footer {
            font-size: 14px;
            color: #888888;
            margin-top: 20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">Account Reactivation Notification</div>
        <div class="content">
            <p>Dear ${userName},</p>
            <p>
            We are pleased to inform you that your account has been reactivated as of ${reactivatedAt}.
            </p>
            <p>
            If you have any questions or need further assistance, please don't hesitate to contact our support team.
            </p>
        </div>
        <div class="footer">
            Best regards,<br />
            e-Fuldmagt (digital Power of Attorney)
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    revokedFuldmagtEmailTemplate,
    createFuldmagtEmailTemplate,
    requestFuldmagtEmailTemplate,
    reactivateUserEmailTemplate,
    deleteUserEmailTemplate,
    suspendUserEmailTemplate,
    acknowledgeFuldmagtEmailTemplate,
    acceptFuldmagtRequestEmailTemplate,
    rejectFuldmagtRequestEmailTemplate,
    reissueFuldmagtEmailTemplate,
};