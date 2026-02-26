const jwt = require("jsonwebtoken");
const { generateOTP, htmlForOTP } = require("../utils/otp");
const { sendEmail } = require("./MailService");
var cryptoJs = require("crypto-js");
const User = require("../models/user");
const bcryptjs = require("bcryptjs");
const Company = require("../models/company");
const NotificationSetting = require("../models/notificationSettings");
const userRepository = require("../repositories/user.repositories");
const createHttpError = require("http-errors");
const Admin = require("../models/admin");
const { sendSMS, sendSMSToPhone } = require("./SMSService");
const { reactivateUserEmailTemplate } = require("../templates/emailTemplates");

const userServices = {
    async uploadProfileImage(userId, imageUrl) {
        let user = await userRepository.updateUser(userId, { image: imageUrl });

        if (!user)
            throw new createHttpError.NotFound("User not found");

        return user;
    },
    async reactivateUserByAdmin(userId) {
        let user = await userRepository.updateUser(userId, { deleted: false, locked: false, adminLocked: false });
        if (!user)
            throw new createHttpError.NotFound("User not found");
        await sendEmail(
            user.email,
            "Account Reactivated",
            reactivateUserEmailTemplate({ userName: `${user.name.firstName} ${user.name.lastName}` })
        );
        return user;
    },
    async registerUser(emailCredentialsToken, phoneCredentialsToken, userObj) {
        const user = { ...userObj };
        let phoneCredentials = null
        try {
            phoneCredentials = jwt.verify(phoneCredentialsToken, process.env.SIGNUP_TOKEN_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError.Unauthorized("Phone Credential Token has expired");
            } else if (err.name === 'JsonWebTokenError') {
                throw createHttpError.Unauthorized("Invalid Token");
            } else {
                throw createHttpError.Unauthorized("Invalid or Expired Token");
            }
        }
        if (!phoneCredentials.phone) {
            throw createHttpError.BadRequest("phone not found");
        }
        let emailCredentials = null
        try {
            emailCredentials = jwt.verify(emailCredentialsToken, process.env.SIGNUP_TOKEN_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError.Unauthorized("Email Credential Token has expired");
            } else if (err.name === 'JsonWebTokenError') {
                throw createHttpError.Unauthorized("Invalid Token");
            } else {
                throw createHttpError.Unauthorized("Invalid or Expired Token");
            }
        }

        if (!emailCredentials.email)
            throw createHttpError.BadRequest("email not found");


        user.email = emailCredentials.email
        user.phone = phoneCredentials.phone
        //Adding User//
        user.pin = null;
        //
        let newUser = new User(user);

        await newUser.save();

        await NotificationSetting.create({ userId: newUser._id });

        let createPasswordToken = jwt.sign({ userId: newUser._id }, process.env.CREATE_PASSWORD_TOKEN, { expiresIn: "10m" });

        return { createPasswordToken, user: { ...newUser.toObject(), pin: undefined } };
    },
    async softDelete(userId) {
        let user = await userRepository.hardDeleteUser(userId);

        if (!user)
            throw new createHttpError.NotFound("User not found");

        return user;
    },
    async createPassword(createPasswordToken, deviceId, pin) {
        let userId = null
        try {
            let credentials = jwt.verify(createPasswordToken, process.env.CREATE_PASSWORD_TOKEN);
            userId = credentials.userId;
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError.Unauthorized("Token has expired");
            } else if (err.name === 'JsonWebTokenError') {
                throw createHttpError.Unauthorized("Invalid Token");
            } else {
                throw createHttpError.Unauthorized("Invalid or Expired Token");
            }
        }

        let user = await User.findById(userId);

        if (user.adminLocked) {
            throw createHttpError.BadRequest("This account has been locked by admin");
        }

        if (!user) {
            throw createHttpError.NotFound("User not found");
        }


        if (user.deleted) {
            throw createHttpError.BadRequest("This account has been deleted");
        }

        let salt = await bcryptjs.genSalt(10);

        let encryptedPin = await bcryptjs.hash(pin, salt);

        user.locked = false;
        user.pin = encryptedPin;
        user.deviceId = deviceId;

        let refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN, { expiresIn: "30d" });

        user.refreshTokens.push(refreshToken);
        user.lastUpdatedPassword = new Date();
        await user.save();

        //Check if user has a company//
        let company = await Company.findById(user.company)

        let authToken = jwt.sign({ userId: user._id, companyId: company ? company._id : null }, process.env.AUTHORIZATION_TOKEN);

        return { authToken, refreshToken, user: { ...user.toObject(), pin: undefined }, company: company ? company.toObject() : null };
    },
    async login(credentials, pin) {
        let user = await this.getUserByCredentials(credentials);

        if (!user) {
            throw new createHttpError.NotFound("User Not Found");
        }

        if (user.deleted) {
            throw new createHttpError.BadRequest("This account has been deleted");
        }
        if (user.adminLocked) {
            throw new createHttpError.BadRequest("This account has been locked by admin");
        }
        if (user.locked == true) {
            throw new createHttpError.BadRequest("This account has been locked");
        }
        // console.log("User Found:", user);
        if (user.pin === null) {
            const error = new createHttpError.BadRequest("This account has not set their pin");
            error.navigateTo = true;
            // console.log("Error Thrown:", error);
            throw error;
        }
        //Matching Password//

        if (!(await bcryptjs.compare(pin, user.pin))) {
            user.loginAttempt++;
            if (user.loginAttempt >= 3) {
                user.locked = true;
            }
            await user.save();
            throw new createHttpError.BadRequest("Password not matching");
        }

        user.loginAttempt = 0;

        //Check if user has a company//
        let company = await Company.findById(user.company)

        let authToken = jwt.sign({ userId: user._id, companyId: company ? company._id : null }, process.env.AUTHORIZATION_TOKEN);

        let refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN, { expiresIn: "30d" });

        user.refreshTokens.push(refreshToken);

        await user.save();

        return { authToken, refreshToken, user: { ...user.toObject(), pin: undefined }, company: company ? company.toObject() : null };
    },

    async getUsers(query) {
        // Destructure query parameters from request
        const { q, name, email, number } = query;

        // Initialize an empty filter object
        //locked: false 
        let filter = {};

        // Check for the "q" parameter - search across email, number, and name
        if (q) {
            filter = {
                $or: [
                    { email: { $regex: q, $options: 'i' } }, // case-insensitive substring match for email
                    { name: { $regex: q, $options: 'i' } },  // case-insensitive substring match for name
                    { number: { $regex: q, $options: 'i' } } // case-insensitive substring match for number
                ]
            };
        }

        // If "name" is provided, search by name
        if (name) {
            filter.name = new RegExp(name, 'i'); // case-insensitive search for name
        }

        // If "email" is provided, search by email
        if (email) {
            filter.email = new RegExp(email, 'i'); // case-insensitive search for email
        }

        // If "number" is provided, search by number
        if (number) {
            filter.number = number; // exact match for number
        }



        // Fetch users based on the filter
        const users = await User.aggregate(
            [
                {
                    $addFields: {
                        name: { $concat: ["$name.firstName", " ", "$name.lastName"] }
                    }
                },
                {
                    $match: {
                        ...filter,
                        deleted: false
                    }
                },
                { $unset: ["pin", "refreshTokens"] }

            ]
        );
        // Send back the results
        return users;
    },


    // --- MODIFIED getUsers function start ---

    // async getUsers(query) {
    //     // ... (Destructuring and initialization) ...
    //     const { q, name, email, number } = query;
    //     let filter = {};

    //     // Check for the "q" parameter - search across user fields AND company fields
    //     if (q) {
    //         filter = {
    //             $or: [
    //                 // User fields
    //                 { email: { $regex: q, $options: 'i' } },
    //                 { 'phone.number': { $regex: q, $options: 'i' } },
    //                 { name: { $regex: q, $options: 'i' } },

    //                 // 🚀 NEW: Include Company Name in the general search
    //                 { 'companyDetails.companyName': { $regex: q, $options: 'i' } }
    //             ]
    //         };
    //     }

    //     // ... (Individual filters for name, email, number) ...
    //     // ... (The rest of the logic remains the same) ...

    //     const users = await User.aggregate(
    //         [
    //             // 1. $addFields (Must be first for concatenated name search)
    //             {
    //                 $addFields: {
    //                     name: { $concat: ["$name.firstName", " ", "$name.lastName"] },
    //                     number: "$phone.number"
    //                 }
    //             },
    //             // 2. $lookup (Joins company data)
    //             {
    //                 $lookup: {
    //                     from: "companies",
    //                     localField: "company",
    //                     foreignField: "_id",
    //                     as: "companyDetails"
    //                 }
    //             },
    //             // 3. $unwind (Makes companyDetails an object)
    //             {
    //                 $unwind: {
    //                     path: "$companyDetails",
    //                     preserveNullAndEmptyArrays: true
    //                 }
    //             },
    //             // 4. $match: Now this will correctly apply the combined filter!
    //             {
    //                 $match: {
    //                     $and: [
    //                         { ...filter },
    //                         { deleted: false }
    //                     ]
    //                 }
    //             },
    //             // ... ($project/$unset stages) ...
    //         ]
    //     );

    //     return users;
    // },
    // --- MODIFIED getUsers function end ---
    async getUsersByAdmin(query) {
        // Destructure query parameters from request
        const { q, name, email, number } = query;

        // Initialize an empty filter object
        let filter = {};

        // Check for the "q" parameter - search across email, number, and name
        if (q) {
            filter = {
                $or: [
                    { email: { $regex: q, $options: 'i' } }, // case-insensitive substring match for email
                    { name: { $regex: q, $options: 'i' } },  // case-insensitive substring match for name
                    { number: { $regex: q, $options: 'i' } } // case-insensitive substring match for number
                ]
            };
        }

        // If "name" is provided, search by name
        if (name) {
            filter.name = new RegExp(name, 'i'); // case-insensitive search for name
        }

        // If "email" is provided, search by email
        if (email) {
            filter.email = new RegExp(email, 'i'); // case-insensitive search for email
        }

        // If "number" is provided, search by number
        if (number) {
            filter.number = number; // exact match for number
        }

        // Fetch users based on the filter
        const users = await User.aggregate(
            [
                {
                    $addFields: {
                        name: { $concat: ["$name.firstName", " ", "$name.lastName"] }
                    }
                },
                {
                    $match: {
                        ...filter,
                    }
                },
                { $unset: ["pin", "refreshTokens"] }

            ]
        );
        // Send back the results
        return users;
    },

    async getUser(id) {
        // Find the user(s) matching the query
        let user = await User.findById(id);
        let company = null;

        if (user?.company != null) {
            company = await Company.findById(user.company);
        }

        // Handle the case where no user is found
        if (!user) {
            throw new createHttpError.NotFound("User not found");
        }

        // Respond with the found user(s)
        return { user: { ...user.toObject(), pin: undefined }, company };
    },

    async setPassword(userId, oldPin, newPin) {
        let user = await User.findById(userId);

        if (!bcryptjs.compareSync(oldPin, user.pin)) {
            throw new createHttpError.BadRequest("Old Password is incorrect");
        }

        const salt = await bcryptjs.genSalt(10);
        const hash_Password = await bcryptjs.hash(newPin, salt);
        user.pin = hash_Password;
        user.lastUpdatedPassword = new Date();
        await user.save();

        return { user: { ...user.toObject(), pin: undefined } };
    },
    async updateUser(userId, updateUserObj) {
        delete updateUserObj._id;
        delete updateUserObj.pin;
        delete updateUserObj.refreshTokens;
        delete updateUserObj.email;
        delete updateUserObj.phone;

        let updatedUser = await userRepository.updateUser(userId, updateUserObj);

        if (!updatedUser)
            throw new createHttpError.NotFound("User not found");

        return updatedUser;
    },
    async mobileLogin(credentials, pin, deviceId) {
        let user = await userServices.getUserByCredentials(credentials);

        if (!user) {
            throw createHttpError.NotFound("User not found");
        }

        if (user.adminLocked) {
            throw createHttpError.BadRequest("User has been locked by admin");
        }
        if (user.deleted) {
            throw createHttpError.BadRequest("User has been deleted");
        }
        if (user.locked == true) {
            throw createHttpError.BadRequest("User has been locked");
        }

        // if (user.deviceId && user.deviceId != deviceId) {
        //     throw createHttpError.BadRequest("User has already been registered on another device Id");
        // }

        if (user.pin === null) {
            const error = new createHttpError.BadRequest("This account has not set their pin");
            error.navigateTo = true;
            // console.log("Error Thrown:", error);
            throw error;
        }

        //Matching Password//
        if (!(await bcryptjs.compare(pin, user.pin))) {
            user.loginAttempt = user.loginAttempt + 1;
            if (user.loginAttempt >= 3) {
                user.locked = true;
            }
            await user.save();
            throw createHttpError.BadRequest("Password not matching");
        }

        user.loginAttempt = 0;

        user.deviceId = deviceId;

        let refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN, { expiresIn: "30d" });

        user.refreshTokens.push(refreshToken);

        await user.save();

        //Check if user has a company//
        let company = await Company.findById(user.company)

        let authToken = jwt.sign({ userId: user._id, companyId: company ? company._id : null }, process.env.AUTHORIZATION_TOKEN, { expiresIn: process.env.JWT_AUTHENTICATION_TOKEN_EXPIRATION });

        return { authToken, refreshToken, user: { ...user.toObject(), pin: undefined }, company: company ? company.toObject() : null };
    },
    async verifyDevicePin(refreshToken, pin, deviceId) {
        //Use Body Schema Here//
        let refreshTokenPayload = null

        try {
            refreshTokenPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError.Unauthorized("Token has expired");
            } else if (err.name === 'JsonWebTokenError') {
                throw createHttpError.Unauthorized("Invalid Token");
            } else {
                throw createHttpError.Unauthorized("Invalid or Expired Token");
            }
        }

        let userId = refreshTokenPayload.userId;

        let user = await User.findOne({ _id: userId, deviceId }).populate("company");


        if (!user) {
            throw createHttpError.NotFound("User with given credentials doesn't exist");
        }

        if (user.refreshTokens.findIndex((rT) => rT == refreshToken) == -1) {
            throw createHttpError.BadRequest("Session has expired, please login again");
        }

        if (user.deleted) {
            throw createHttpError.BadRequest("User has been deleted");
        }

        if (user.adminLocked) {
            throw createHttpError.BadRequest("User has been locked by admin");
        }
        if (user.deviceId && user.deviceId != deviceId) {
            throw createHttpError.BadRequest("User has already been registered on another device Id");
        }

        if (user.locked == true) {
            throw createHttpError.BadRequest("User has been locked");
        }
        //Matching Password//
        if (!(await bcryptjs.compare(pin, user.pin))) {
            user.loginAttempt = user.loginAttempt + 1;
            if (user.loginAttempt >= 3) {
                user.locked = true;
            }
            await user.save();

            throw createHttpError.BadRequest("Password not matching");
        }

        user.loginAttempt = 0;
        await user.save();

        let authToken = jwt.sign({ userId: user._id, companyId: user.company ? user.company._id : null }, process.env.AUTHORIZATION_TOKEN, { expiresIn: process.env.JWT_AUTHENTICATION_TOKEN_EXPIRATION });

        return { authToken, refreshToken, user: { ...user.toObject(), pin: undefined, company: undefined }, company: user.company };
    },
    async logout(userId, deviceId, refreshToken, notificationId) {

        let user = await User.findById(userId);

        if (!user) {
            throw createHttpError.NotFound("User not found");
        }

        // if (deviceId != undefined && user.deviceId != deviceId) {
        //     throw createHttpError.BadRequest("User has already been logged out from this device");
        // }

        if (deviceId != undefined)
            user.deviceId = null;

        user.refreshTokens = user.refreshTokens.filter((rT) => rT != refreshToken);
        user.notificationIds = user.notificationIds.filter((nId) => nId != notificationId);

        await user.save()

        return user;
    },
    async verifyPassword(userId, pin) {
        let user = await User.findById(userId);

        if (!user)
            throw new createHttpError.NotFound("User not found");

        if (!(await bcryptjs.compare(pin, user.pin))) {
            throw new createHttpError.BadRequest("Password not matching");
        }

        return user;
    },
    async refreshToken(refreshToken, userId, companyId) {
        let user = await User.findOne({ _id: userId });

        console.log(user);

        if (!user) {
            throw createHttpError.NotFound("User with given credentials doesn't exist");
        }

        if (user.deleted) {
            throw createHttpError.BadRequest("User has been deleted");
        }

        let refreshTokenLength = user.refreshTokens.length;
        //Remove the Refresh Token from User//
        user.refreshTokens = user.refreshTokens.filter(rT => rT != refreshToken);


        if (user.refreshTokens.length == refreshTokenLength) {
            throw createHttpError.BadRequest("Session has expired, please login again");
        }

        let newRefreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN, { expiresIn: "30d" });

        user.refreshTokens.push(newRefreshToken);

        let authToken = jwt.sign({ userId: user._id, companyId: companyId }, process.env.AUTHORIZATION_TOKEN, { expiresIn: process.env.JWT_AUTHENTICATION_TOKEN_EXPIRATION });


        await user.save();

        return { authToken, refreshToken: newRefreshToken };
    },
    async getUserByCredentials(credentials) {
        let user = null;
        const hasEmail = !!credentials.email;
        const hasPhone = !!credentials.phone;

        // Case 1: Both provided ❌
        if (hasEmail && hasPhone) {
            throw new createHttpError.BadRequest("Provide either email or phone, not both");
        }

        // Case 2: None provided ❌
        if (!hasEmail && !hasPhone) {
            throw new createHttpError.BadRequest("Provide either email or phone");
        }
        if (credentials.email) {

            user = await User.findOne(
                { email: credentials.email.toLowerCase() }
            );
        }
        else if (credentials.phone?.number && credentials.phone?.countryCode) {
            // Match both number and countryCode
            user = await User.findOne({
                'phone.number': credentials.phone.number,
                'phone.countryCode': credentials.phone.countryCode,
            });
        }

        return user;
    },
    async sendOTPToEmail(email) {
        let otp = generateOTP();
        let body = htmlForOTP(otp);
        let subject = "Email Verification OTP";

        await sendEmail(email, subject, body);

        let emailVerification = {
            credentials: { email },
            otp: otp
        }

        let otpToken = jwt.sign(emailVerification, process.env.OTP_TOKEN_SECRET, { expiresIn: "10m" });
        let encryptedOTPToken = cryptoJs.AES.encrypt(otpToken, process.env.ENCRYPTION_KEY).toString();
        return { encryptedOTPToken };
    },
    // async verifySignUpOTP(encryptedOTPToken, otp) {
    //     //Decrypt OTP Token
    //     let otpToken = cryptoJs.AES.decrypt(encryptedOTPToken, process.env.ENCRYPTION_KEY).toString(cryptoJs.enc.Utf8);
    //     //Verify Token for Temparing
    //     let otpTokenDecrypted = null
    //     try {
    //         otpTokenDecrypted = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
    //     }
    //     catch (err) {
    //         if (err.name === 'TokenExpiredError') {
    //             throw createHttpError.Unauthorized("Token has expired");
    //         } else if (err.name === 'JsonWebTokenError') {
    //             throw createHttpError.Unauthorized("Invalid Token");
    //         } else {
    //             throw createHttpError.Unauthorized("Invalid or Expired Token");
    //         }
    //     }
    //     //Check if OTPs are Equal
    //     if (otp != otpTokenDecrypted.otp) {
    //         createHttpError.BadRequest("Otp doesn't match");
    //     }

    //     //getting equal make a jwt for making account//
    //     let credentialsToken = jwt.sign(otpTokenDecrypted.credentials, process.env.SIGNUP_TOKEN_SECRET, { expiresIn: "10m" });
    //     return { credentialsToken }
    // },

    async verifyForgotPasswordOtp(encryptedOTPToken, otp) {
        //Decrypt OTP Token
        let otpToken = cryptoJs.AES.decrypt(encryptedOTPToken, process.env.ENCRYPTION_KEY).toString(cryptoJs.enc.Utf8);
        //Verify Token for Temparing
        let otpTokenDecrypted = null
        try {
            otpTokenDecrypted = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError.Unauthorized("Token has expired");
            } else if (err.name === 'JsonWebTokenError') {
                throw createHttpError.Unauthorized("Invalid Token");
            } else {
                throw createHttpError.Unauthorized("Invalid or Expired Token");
            }
        }
        // console.log(otpTokenDecrypted);
        //Check if OTPs are Equal
        if (otp != otpTokenDecrypted.otp) {
            throw createHttpError.BadRequest("Otp doesn't match");
        }
        let credentials = otpTokenDecrypted.credentials;
        let user = await this.getUserByCredentials(credentials);

        if (!user) {
            throw createHttpError.NotFound("User not found");
        }
        if (user.deleted) {
            throw createHttpError.BadRequest("User has been deleted");
        }

        let createPasswordToken = jwt.sign({ userId: user._id }, process.env.CREATE_PASSWORD_TOKEN, { expiresIn: "10m" });

        return { createPasswordToken, user: { ...user.toObject(), pin: undefined } };
    },
    async addUser(userObj) {
        const user = { ...userObj };

        //
        let newUser = new User(user);

        await newUser.save();

        await NotificationSetting.create({ userId: newUser._id });

        return { user: { ...newUser.toObject(), pin: undefined } };
    },

    async sendOTPToNumber(phone) {
        let otp = generateOTP();
        let body = "Your OTP for e Power of Attorny is: " + otp;
        let subject = "Phone Verification OTP";

        //await sendEmail(email, subject, body);

        let phoneVerificatoin = {
            credentials: { phone },
            otp: otp
        }

        await sendSMSToPhone(phone, body)

        let otpToken = jwt.sign(phoneVerificatoin, process.env.OTP_TOKEN_SECRET, { expiresIn: "10m" });
        let encryptedOTPToken = cryptoJs.AES.encrypt(otpToken, process.env.ENCRYPTION_KEY).toString();
        return { encryptedOTPToken, body, subject };
    },

    //Admin Panel//
    async createUserByAdmin({
        email,
        address,
        pin,
        name,
        phone,
        dateOfBirth
    }) {
        let salt = await bcryptjs.genSalt(10);

        let encryptedPin = await bcryptjs.hash(pin, salt);

        let user = await userRepository.createUser({ email, address, pin: encryptedPin, name, phone, dateOfBirth });

        await NotificationSetting.create({ userId: user._id });

        return user;
    },
    async updateUserByAdmin(userId, updatedUser) {
        if (updatedUser.pin) {
            let salt = await bcryptjs.genSalt(10);
            updatedUser.pin = await bcryptjs.hash(updatedUser.pin, salt);
        }
        delete updatedUser._id;

        let user = await userRepository.updateUser(userId, updatedUser);

        if (!user)
            throw new createHttpError.NotFound("User not found");

        return user;
    },
    async deleteUserByAdmin(userId) {

        // let updatedUser = {
        //     deleted: true
        // }

        // let user = await userRepository.updateUser(userId, updatedUser);

        let user = await userRepository.hardDeleteUser(userId);

        if (!user)
            throw new createHttpError.NotFound("User not found");
        return user;
    },
    async getSpecificUser(userId) {
        let user = await userRepository.getSpecificUser(userId);

        if (!user)
            throw new createHttpError.NotFound("User not found");

        return user;
    },
    async getTemporaryUser(userId) {
        let user = await userRepository.getSpecificUser(userId);

        if (!user)
            throw new createHttpError.NotFound("User not found");

        if (user.deleted)
            throw new createHttpError.NotFound("User has been deleted");

        //Check if user is temporary//
        if (user.createdAt < new Date(new Date().getTime() - 24 * 60 * 60 * 1000))
            throw new createHttpError.NotFound("Temporary User has been expired");

        return user;
    },

    //OTP Services//
    async sendOTPToCredentials(credentials) {
        const { email, phone } = credentials;
        if (!email && !phone) {
            throw new createHttpError.BadRequest("Either email or phone must be provided");
        }
        let user = userServices.getUserByCredentials(credentials);
        if (user.adminLocked) {
            throw createHttpError.BadRequest("This account has been locked by admin");
        }
        let resBody = null;
        if (email) {
            resBody = await userServices.sendOTPToEmail(email);
        }
        if (phone) {
            resBody = await userServices.sendOTPToNumber(phone)
        }
        return resBody;
    },
    async sendForgotPasswordOTPToCredentials(credentials) {
        const { email, phone } = credentials;

        let resBody = null;
        if (email) {
            let user = await userServices.getUserByCredentials({ email });
            if (!user) {
                throw createHttpError.NotFound("User not found with given email");
            }
            if (user.adminLocked) {
                throw createHttpError.BadRequest("This account has been locked by admin");
            }

            resBody = await userServices.sendOTPToEmail(email);
        }
        if (phone) {
            let user = await userServices.getUserByCredentials({ phone });
            if (!user) {
                throw createHttpError.NotFound("User not found with given phone number");
            }
            if (user.adminLocked) {
                throw createHttpError.BadRequest("This account has been locked by admin");
            }
            resBody = await userServices.sendOTPToNumber(phone)
        }
        return resBody;
    },
    async verifySignupOtp(otp, encryptedOTPToken) {
        //Decrypt OTP Token
        let otpToken = cryptoJs.AES.decrypt(encryptedOTPToken, process.env.ENCRYPTION_KEY).toString(cryptoJs.enc.Utf8);
        //Verify Token for Temparing
        let otpTokenDecrypted = null
        try {
            otpTokenDecrypted = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError.Unauthorized("Token has expired");
            } else if (err.name === 'JsonWebTokenError') {
                throw createHttpError.Unauthorized("Invalid Token");
            } else {
                throw createHttpError.Unauthorized("Invalid or Expired Token");
            }
        }

        if (otp != otpTokenDecrypted.otp) {
            throw createHttpError.BadRequest("Otp doesn't match");
        }

        if (await userServices.getUserByCredentials(otpTokenDecrypted.credentials)) {
            throw createHttpError.BadRequest("User already exists with given credentials");
        }

        //getting equal make a jwt for making account//
        let credentialsToken = jwt.sign(otpTokenDecrypted.credentials, process.env.SIGNUP_TOKEN_SECRET, { expiresIn: "10m" });

        return credentialsToken;
    },

    async verifyUpdateEmailOtp(userId, otp, encryptedOTPToken) {
        let otpToken = cryptoJs.AES.decrypt(encryptedOTPToken, process.env.ENCRYPTION_KEY).toString(cryptoJs.enc.Utf8);
        //Verify Token for Temparing
        let otpTokenDecrypted = null
        try {
            otpTokenDecrypted = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError.Unauthorized("Token has expired");
            } else if (err.name === 'JsonWebTokenError') {
                throw createHttpError.Unauthorized("Invalid Token");
            } else {
                throw createHttpError.Unauthorized("Invalid or Expired Token");
            }
        }

        if (otp != otpTokenDecrypted.otp) {
            throw createHttpError.BadRequest("Otp doesn't match");
        }


        if (!otpTokenDecrypted.credentials.email) {
            throw createHttpError.BadRequest("Email not found");
        }

        if (await userServices.getUserByCredentials(otpTokenDecrypted.credentials)) {
            throw createHttpError.BadRequest("User already exists with given email");
        }


        let user = await User.findById(userId);
        user.email = otpTokenDecrypted.credentials.email;

        await user.save()

        return user;
    },

    async verifyUpdatePhoneNumberOtp(userId, otp, encryptedOTPToken) {
        let otpToken = cryptoJs.AES.decrypt(encryptedOTPToken, process.env.ENCRYPTION_KEY).toString(cryptoJs.enc.Utf8);
        //Verify Token for Temparing
        let otpTokenDecrypted = null
        try {
            otpTokenDecrypted = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError.Unauthorized("Token has expired");
            } else if (err.name === 'JsonWebTokenError') {
                throw createHttpError.Unauthorized("Invalid Token");
            } else {
                throw createHttpError.Unauthorized("Invalid or Expired Token");
            }
        }
        if (otp != otpTokenDecrypted.otp) {
            throw createHttpError.BadRequest("Otp doesn't match");
        }


        if (!otpTokenDecrypted.credentials.phone) {
            throw createHttpError.BadRequest("Phone number not found");
        }
        if (await userServices.getUserByCredentials(otpTokenDecrypted.credentials)) {
            throw createHttpError.BadRequest("User already exists with given phone number");
        }

        let user = await User.findById(userId);
        user.phone = otpTokenDecrypted.credentials.phone;

        await user.save()

        return user;
    },
    async loginAdmin(email, password) {
        let admin = await Admin.findOne({ email });

        if (!admin) {
            throw createHttpError.NotFound("Admin not found");
        }

        // console.log(admin, password);

        if (!bcryptjs.compareSync(password, admin.password)) {
            throw createHttpError.BadRequest("Password not matching");
        }

        let authToken = jwt.sign({ adminId: admin._id }, process.env.AUTHORIZATION_TOKEN, { expiresIn: process.env.JWT_AUTHENTICATION_TOKEN_EXPIRATION });

        return { authToken, admin };
    },

    async addSignature(userId, signature) {
        let user = await userRepository.updateUser(userId, { signature });

        if (!user)
            throw new createHttpError.NotFound("User not found");

        return user.signature;
    },

    async getSignature(userId) {
        let user = await userRepository.getSpecificUser(userId);

        if (!user)
            throw new createHttpError.NotFound("User not found");

        if (!user.signature)
            throw new createHttpError.NotFound("Signature not found");

        return user.signature;
    },
    async verifyExistingEmailOrPhone(email, phone) {
        if (email) {
            let user = await userServices.getUserByCredentials({ email });
            return user ? true : false;
        }
        if (phone) {
            let user = await userServices.getUserByCredentials({ phone });
            return user ? true : false;
        }
    },
    async getUserByEmail(email) {
        let user = await User.findOne({ email: email });
        return user;
    },
    async getUserById(userId) {
        let user = await User.findById(userId);
        return user;
    }
}

module.exports = userServices;