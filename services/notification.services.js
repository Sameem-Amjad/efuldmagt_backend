const createHttpError = require("http-errors");
const Notification = require("../models/notification");
const NotificationSetting = require("../models/notificationSettings");
const User = require("../models/user");
const Company = require("../models/company");
const { requestFuldmagtEmailTemplate, revokedFuldmagtEmailTemplate, createFuldmagtEmailTemplate, acknowledgeFuldmagtEmailTemplate, acceptFuldmagtRequestEmailTemplate, rejectFuldmagtRequestEmailTemplate, reissueFuldmagtEmailTemplate } = require("../templates/emailTemplates");
const { firebase } = require("./Firsebase_Notifications");
const { sendEmail } = require("./MailService");
mongoose = require("mongoose");

function getMessageBody(notificationId, image, title, body, data) {
    return {
        data: data,
        notification: {
            image,
            title,
            body
        },
        token: notificationId
    };
}

let notificationServices = {
    async sendFirebaseNotificationByUserId(userId, title, body, data, image) {
        console.log("Sending notification to userId:", userId)
        let user = await User.findById(userId);
        let notificationPromises = [];
        let notificationIdsWithErrors = [];

        for (let i = 0; i < user.notificationIds.length; i++) {
            let message = getMessageBody(user.notificationIds[i], image, title, body, data)
            notificationPromises.push(firebase.messaging().send(message).then(
                (result) => {

                }
            ).catch(
                (error) => {
                    // notificationIdsWithErrors.push(user.notificationIds[i])
                }
            ))
        }
        //
        await Promise.allSettled(notificationPromises);

        user.notificationIds =
            user.notificationIds.filter((nId) => { return notificationIdsWithErrors.findIndex((ne) => ne == nId) == -1 }
            );

        await user.save();

        let status = {
            "successfulNotificationsSent": notificationPromises.length - notificationIdsWithErrors.length,
            "failedNotificationsSent": notificationIdsWithErrors.length,
            "totalNotifcations": notificationPromises.length
        }

        return status
    },
    async getUserNotifications(userId, isCompany) {
        let company = null;
        let userData = await User.findById(userId);
        if (isCompany === 'true') {
            company = await Company.findOne({ createdBy: userId });
            userId = company._id;
        }
        let notifications = await Notification.aggregate([
            {
                $match: {
                    recipient: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $addFields: {
                    // Add the 'time' field
                    time: {
                        $let: {
                            vars: {
                                diffInMinutes: {
                                    $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60]
                                }
                            },
                            in: {
                                $cond: {
                                    if: { $lte: ["$$diffInMinutes", 1] },
                                    then: "now",
                                    else: {
                                        $cond: {
                                            if: { $lte: ["$$diffInMinutes", 60] },
                                            then: { $concat: [{ $toString: { $floor: "$$diffInMinutes" } }, " min"] },
                                            else: {
                                                $cond: {
                                                    if: { $lte: ["$$diffInMinutes", 24 * 60] },
                                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$diffInMinutes", 60] } } }, " hr"] },
                                                    else: { $concat: [{ $toString: { $floor: { $divide: ["$$diffInMinutes", 60 * 24] } } }, " days"] }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    // Add the 'section' field
                    section: {
                        $cond: {
                            if: { $eq: [{ $dayOfYear: "$createdAt" }, { $dayOfYear: new Date() }] }, // Same day
                            then: "today",
                            else: "earlier"
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } } // Sort by createdAt in descending order
        ])



        // if (isCompany === 'true') {
        //     let companyNotifications = notifications.filter((notification) => {
        //         if (notification && notification.body && notification.body.toLowerCase().includes(company.companyName.toLowerCase())) {
        //             return true;
        //         }
        //     });
        //     return companyNotifications;
        // }
        // notifications = notifications.filter((notification) => {
        //     if (notification && notification.body && notification.body.toLowerCase().includes(userData ? userData?.name?.firstName.toLowerCase() : "")) {
        //         return true;
        //     }
        // });
        return notifications;
    },
    // async addNotificationToken(userId, notificationId) {
    //     // console.log(userId, notificationId);
    //     let user = await User.findById(userId);

    //     if (!user) {
    //         throw createHttpError.NotFound("User not found");
    //     }

    //     //check if there is a user with already same notificationId
    //     let checkUser = await User.findOne({ notificationIds: notificationId });

    //     if (checkUser && checkUser._id.toString() != user._id.toString()) {
    //         checkUser.notificationIds = checkUser.notificationIds.filter(
    //             (nId) => nId != notificationId
    //         )
    //         await checkUser.save();
    //     }

    //     else if (checkUser && checkUser._id.toString() == user._id.toString()) {
    //         return
    //     }

    //     user.notificationIds.push(notificationId);

    //     await user.save();
    // },

    async addNotificationToken(userId, notificationId) {
        const user = await User.findById(userId);

        if (!user) {
            throw createHttpError.NotFound("User not found");
        }

        // 1️⃣ Remove this token from all OTHER users
        await User.updateMany(
            {
                _id: { $ne: userId },
                notificationIds: notificationId
            },
            {
                $pull: { notificationIds: notificationId }
            }
        );

        // 2️⃣ Replace tokens for current user (LOGIN behavior)
        user.notificationIds = [notificationId];

        await user.save();
    },

    async getNotificationSettings(userId) {

        let notificationSetting = await NotificationSetting.findOne({ userId: userId });

        if (!notificationSetting) {
            throw createHttpError.NotFound("Notification Settings not available for given user.");
        }

        return notificationSetting;
    },
    async setActivityNotification(userId, email, pushNotification) {
        // console.log(userId, email, pushNotification)
        let notificationSetting = await NotificationSetting.findOne({ userId: userId });

        if (!notificationSetting) {
            throw createHttpError.NotFound("Notification Settings not available for given user.");
        }

        notificationSetting.activityNotification = {
            email: email,
            pushNotification: pushNotification
        };

        await notificationSetting.save();

        return notificationSetting;
    },
    async setSpecialOfferNotification(userId, email, pushNotification) {
        let notificationSetting = await NotificationSetting.findOne({ userId: userId });

        if (!notificationSetting) {
            throw createHttpError.NotFound("Notification Settings not available for given user.");
        }

        notificationSetting.specialOffers = {
            email: email,
            pushNotification: pushNotification
        };

        // console.log(notificationSetting);

        await notificationSetting.save();

        return notificationSetting;
    },
    async setNewsNotification(userId, email, pushNotification) {
        let notificationSetting = await NotificationSetting.findOne({ userId: userId });

        if (!notificationSetting) {
            throw createHttpError.NotFound("Notification Settings not available for given user.");
        }

        notificationSetting.news = {
            email: email,
            pushNotification: pushNotification
        };

        await notificationSetting.save();

        return notificationSetting;
    },
    async setFeedbackNotification(userId, email, pushNotification) {
        let notificationSetting = await NotificationSetting.findOne({ userId: userId });

        if (!notificationSetting) {
            throw createHttpError.NotFound("Notification Settings not available for given user.");
        }
        // console.log(notificationSetting);

        notificationSetting.feedback = {
            email: email,
            pushNotification: pushNotification
        };

        await notificationSetting.save();

        return notificationSetting;
    },
    async setReminderNotification(userId, email, pushNotification) {
        let notificationSetting = await NotificationSetting.findOne({ userId: userId });

        if (!notificationSetting) {
            throw createHttpError.NotFound("Notification Settings not available for given user.");
        }

        notificationSetting.reminder = {
            email: email,
            pushNotification: pushNotification
        };

        await notificationSetting.save();

        return notificationSetting;
    },
    async sendNotification({ title, body, imageUrl, data, recipient, recipientValue }) {
        try {
            let notification = new Notification({ title, body, imageUrl, data, recipient });
            // console.log({ title, body, imageUrl, data, recipient })
            await notification.save();
            console.log('Sending notification to userId:', recipientValue, "recipient:", recipient)
            await this.sendFirebaseNotificationByUserId(recipientValue, title, body, data, imageUrl);
        }
        catch (err) {
            console.log(err);
        }
    },

    async notifyFuldmagtReissue({ fuldmagtGiverName, fuldmagtId, agentEmail, agentId, agentName, title, fuldmagtGiverImage, reissuedAt }) { //Will be called when fuldmagt is revoked
        // console.log('fuldmagtId:', fuldmagtId)
        let receiverId = agentId;
        let receiverEmail = agentEmail;
        let emailSubject = fuldmagtGiverName + " has reissued the fuldmagt " + title;
        let emailTemplate = reissueFuldmagtEmailTemplate({ fuldmagtGiverName, title, reissuedAt, fuldmagtGiverImage, agentName });
        let senderImage = fuldmagtGiverImage;
        let notificationTitle = "Fuldmagt Reissued";
        let notificationBody = fuldmagtGiverName + " has reissued the fuldmagt " + title;
        let notificationData = {
            actionType: "reissue_fuldmagt",
            fuldmagtId: fuldmagtId + ""
        }
        //As Receiver is always old, no need to check if receiver is new
        await this.notifyFuldmagt(false, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage)
    },
    async notifyFuldmagtRequestReissue(
        { fuldmagtGiverName, fuldmagtRequestId, fuldmagtGiverEmail, fuldmagtGiverId, agentName, title, agentImage, reissuedAt }) { //Will be called when fuldmagt request is reissued
        // console.log('\nnotification Sending:', fuldmagtGiverName, fuldmagtRequestId, fuldmagtGiverEmail, fuldmagtGiverId, agentName, title, agentImage, reissuedAt)
        let receiverId = fuldmagtGiverId;
        let receiverEmail = fuldmagtGiverEmail;
        let emailSubject = agentName + " has reissued the fuldmagt request " + title;
        let emailTemplate = reissueFuldmagtEmailTemplate({ agentName, title, reissuedAt, agentImage, fuldmagtGiverName });
        let senderImage = agentImage;
        let notificationTitle = "Fuldmagt Request Reissued";
        let notificationBody = agentName + " has reissued the fuldmagt request " + title;
        let notificationData = {
            actionType: "reissue_fuldmagt_request",
            fuldmagtRequestId: fuldmagtRequestId + ""
        }
        //As Receiver is always old, no need to check if receiver is new
        await this.notifyFuldmagt(false, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage)
    },

    async notifyFuldmagtRequestRejection({ fuldmagtGiverName, fuldmagtRequestId, agentEmail, agentId, agentName, title, fuldmagtGiverImage, rejectedAt }) { //Will be called when fuldmagt request is rejected
        let receiverId = agentId;
        let receiverEmail = agentEmail;
        let emailSubject = fuldmagtGiverName + " has rejected the fuldmagt request " + title;
        let emailTemplate = rejectFuldmagtRequestEmailTemplate({ fuldmagtGiverName, title, fuldmagtGiverImage, agentName, rejectedAt });
        let senderImage = fuldmagtGiverImage;
        let notificationTitle = "Fuldmagt Request Rejected";
        let notificationBody = fuldmagtGiverName + " has rejected the fuldmagt request " + title;
        let notificationData = {
            actionType: "reject_fuldmagt_request",
            fuldmagtRequestId: fuldmagtRequestId + ""
        }
        await this.notifyFuldmagt(false, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage)
    },

    async notifyFuldmagtRequestApproval({ fuldmagtGiverName, fuldmagtRequestId, agentEmail, agentId, agentName, title, fuldmagtGiverImage, acceptedAt }) { //Will be called when fuldmagt request is approved
        let receiverId = agentId;
        let receiverEmail = agentEmail;
        let emailSubject = fuldmagtGiverName + " has approved the fuldmagt request " + title;
        let emailTemplate = acceptFuldmagtRequestEmailTemplate({ fuldmagtGiverName, title, fuldmagtGiverImage, agentName, acceptedAt });
        let senderImage = fuldmagtGiverImage;
        let notificationTitle = "Fuldmagt Request Approved";
        let notificationBody = fuldmagtGiverName + " has approved the fuldmagt request " + title;
        let notificationData = {
            actionType: "approve_fuldmagt_request",
            fuldmagtRequestId: fuldmagtRequestId + ""
        }
        await this.notifyFuldmagt(false, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage)
    },

    async notifyFuldmagtAcknowledgement({ fuldmagtGiverName, fuldmagtId, fuldmagtGiverEmail, fuldmagtGiverId, agentName, title, agentImage, createdAt }) { //Will be called when fuldmagt is acknowledged
        let receiverId = fuldmagtGiverId;
        let receiverEmail = fuldmagtGiverEmail;
        let emailSubject = agentName + " has acknowledged the fuldmagt " + title;
        { agentName, createdAt, fuldmagtGiverName, title }
        let emailTemplate = acknowledgeFuldmagtEmailTemplate({ agentName, fuldmagtGiverName, title, agentImage, createdAt });
        let senderImage = agentImage;
        let notificationTitle = "Fuldmagt Acknowledged";
        let notificationBody = agentName + " has acknowledged the fuldmagt " + title;
        let notificationData = {
            actionType: "acknowledge_fuldmagt",
            fuldmagtId: fuldmagtId + ""
        }
        await this.notifyFuldmagt(false, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage)
    },

    async notifyFuldmagtRevoke({ fuldmagtGiverName, fuldmagtId, agentEmail, agentId, title, fuldmagtGiverImage, agentName }) { //Will be called when fuldmagt is revoked
        let receiverId = agentId;
        let receiverEmail = agentEmail;
        let emailSubject = fuldmagtGiverName + " has revoked the fuldmagt " + title;
        let emailTemplate = revokedFuldmagtEmailTemplate({ fuldmagtGiverName, title, fuldmagtGiverImage, agentName });
        let senderImage = fuldmagtGiverImage;
        let notificationTitle = "Fuldmagt Revoked";
        let notificationBody = fuldmagtGiverName + " has revoked the fuldmagt " + title;
        let notificationData = {
            actionType: "revoke_fuldmagt",
            fuldmagtId: fuldmagtId + ""
        }
        await this.notifyFuldmagt(false, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage)
    },

    async notifyFuldmagtCreation(isAgentNew, { fuldmagtGiverName, fuldmagtId, agentEmail, agentId, agentName, fuldmagtGiverImage, title, newPin, createdAt }) { //Will be called when fuldmagt is created
        let companyUserData = await Company.findById(agentId);
        if (!companyUserData) {
            companyUserData = await User.findById(agentId);
        } else {
            companyUserData = await User.findOne({ _id: companyUserData.createdBy });
        }
        let receiverId = agentId;
        let receiverEmail = agentEmail;
        let emailSubject = fuldmagtGiverName + " has created a fuldmagt " + title;
        let emailTemplate = createFuldmagtEmailTemplate({ fuldmagtGiverName, title, fuldmagtGiverImage, agentName, agentId: companyUserData._id, isAgentNew, newPin, createdAt });
        let senderImage = fuldmagtGiverImage;
        let notificationTitle = "Fuldmagt Created";
        let notificationBody = fuldmagtGiverName + " has created a fuldmagt " + title;
        let notificationData = {
            actionType: "create_fuldmagt",
            fuldmagtId: fuldmagtId + ""
        }
        await this.notifyFuldmagt(isAgentNew, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage)
    },

    async notifyFuldmagtRequest(isFuldmagtGiverNew, { fuldmagtGiverName, fuldmagtRequestId, fuldmagtGiverId, fuldmagtGiverEmail, agentName, title, agentImage, createdAt, newPin }) { //Will be called when fuldmagt is requested
        let companyUserData = await Company.findById(fuldmagtGiverId);
        if (!companyUserData) {
            companyUserData = await User.findById(fuldmagtGiverId);
        } else {
            companyUserData = await User.findOne({ _id: companyUserData.createdBy });
        }
        let receiverId = fuldmagtGiverId;
        let receiverEmail = fuldmagtGiverEmail;
        let emailSubject = agentName + " has requested a fuldmagt " + title;
        let emailTemplate = requestFuldmagtEmailTemplate({ agentName, createdAt, fuldmagtGiverName, title, fuldmagtGiverId: companyUserData._id, isFuldmagtGiverNew, newPin });
        let senderImage = agentImage;
        let notificationTitle = "Fuldmagt Requested";
        let notificationBody = agentName + " has requested a fuldmagt " + title;
        let notificationData = {
            actionType: "request_fuldmagt",
            fuldmagtRequestId: fuldmagtRequestId + ""
        }
        await this.notifyFuldmagt(isFuldmagtGiverNew, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage)
    },

    async notifyFuldmagt(isReceiverNew, receiverEmail, receiverId, emailSubject, emailTemplate, notificationTitle, notificationBody, notificationData, senderImage) {
        let companyUserData = await Company.findById(receiverId);
        if (!companyUserData) {
            companyUserData = await User.findById(receiverId);
        } else {
            companyUserData = await User.findOne({ _id: companyUserData.createdBy });
        }

        if (isReceiverNew) {
            await sendEmail(receiverEmail, emailSubject, emailTemplate)
        }
        else //If Agent Exists, Send Notification to App as well
        {
            let notificationSetting = await NotificationSetting.findOne({ userId: companyUserData._id });

            if (!notificationSetting) {
                // throw createHttpError.NotFound("Notification Setting not found")
                return;
            }
            if (notificationSetting.activityNotification.pushNotification) {
                let agentNotification = {
                    title: notificationTitle,
                    body: notificationBody,
                    data: notificationData,
                    imageUrl: senderImage,
                    recipient: receiverId,
                    recipientValue: companyUserData._id
                }
                notificationServices.sendNotification(agentNotification);
            }
            if (notificationSetting.activityNotification.email) {
                await sendEmail(receiverEmail, emailSubject, emailTemplate)
            }
        }

    }
}

module.exports = notificationServices