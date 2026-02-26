
function generateOTP(){
    var val = Math.floor(1000 + Math.random() * 9000);
    return val;
}


function htmlForOTP(otp){
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your OTP Code</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                color: #333333;
            }
            .content {
                padding: 20px;
                text-align: center;
            }
            .content p {
                font-size: 16px;
                margin-bottom: 20px;
            }
            .otp {
                font-size: 28px;
                font-weight: bold;
                color: #007BFF;
                letter-spacing: 4px;
                margin-bottom: 20px;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                font-size: 14px;
                color: #777777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your OTP Code</h1>
            </div>
            <div class="content">
                <p>Dear User,</p>
                <p>To proceed with your request, please use the following One-Time Password (OTP):</p>
                <div class="otp">${otp}</div>
                <p>This OTP is valid for the next 10 minutes. Please do not share this code with anyone.</p>
            </div>
            <div class="footer">
                <p>If you didn't request this code, please ignore this email.</p>
                <p>Thank you for using our service.</p>
            </div>
        </div>
    </body>
    </html>
    `
}


module.exports = {generateOTP, htmlForOTP}