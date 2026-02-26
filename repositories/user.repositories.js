const Company = require('../models/company');
const TempUser = require('../models/tempUser');
const User = require('../models/user');
const Fuldmagt = require('../models/fuldmagt');
const Package = require('../models/package');
const Notification = require('../models/notification');
const { suspendUserEmailTemplate, deleteUserEmailTemplate } = require('../templates/emailTemplates');
const { sendEmail } = require('../services/MailService');
const { deleteFileFromS3 } = require('../services/S3_ServiceStorage');
const userRepository = {
    async createUser({
        email,
        address,
        pin,
        name,
        phone,
        dateOfBirth
    }) { //Will be expensive function
        let user = new User({
            email,
            pin,
            address,
            dateOfBirth,
            name,
            phone
        });

        await user.save();

        return user;
    },
    async updateUser(userId, updatedUser) { //Will be expensive function
        if (updatedUser.name && (!updatedUser.name.firstName || !updatedUser.name.lastName)) {
            throw new Error("First name and last name are required");
        }
        let user = await User.findByIdAndUpdate(userId, updatedUser, { new: true });
        let { locked } = updatedUser;
        if (locked == true) {
            await sendEmail(user.email, "Account Suspended", suspendUserEmailTemplate({ userName: `${user.name.firstName} ${user.name.lastName}`, suspendedAt: new Date().toLocaleDateString() }));
        }
        return user;
    },
    async getUsers() {

    },
    async getSpecificUser(userId) {
        let user = await User.findById(userId);

        return user;
    },
    async deleteUser(userId) {
        let user = await User.findByIdAndDelete(userId);

        return user;
    },
    async getUsersAnalytics() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const usersJoinedLastMonth = await User.find({
            createdAt: {
                $gte: lastMonth
            }
        }).countDocuments();

        const totalUsers = await User.countDocuments();

        return {
            createdLastMonth: usersJoinedLastMonth,
            total: totalUsers
        };
    },
    async hardDeleteUser(userId) {
        let mongoose = require('mongoose');
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            let user = await User.findOne({ _id: userId })
            await User.deleteOne({ _id: userId }).session(session);
            await TempUser.deleteMany({ userId: userId }).session(session);
            await Company.deleteMany({ createdBy: userId }).session(session);
            let allFuldmagts = await Fuldmagt.find({ $or: [{ agentId: userId }, { fuldmagtGiverId: userId }] });
            for (let fuldmagt of allFuldmagts) {
                if (fuldmagt.fuldmagtDocumentsLink.length > 0) {
                    fuldmagt.fuldmagtDocumentsLink.forEach(async (document) => {
                        let documentKey = document.fuldmagtDocumentKey;
                        //Delete from S3 Bucket
                        if (documentKey)
                            await deleteFileFromS3(documentKey);
                    });
                }
            }

            await Fuldmagt.deleteMany({ $or: [{ agentId: userId }, { fuldmagtGiverId: userId }] }).session(session);
            await Package.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }).session(session);
            await Notification.deleteMany({ recipient: userId }).session(session);
            await session.commitTransaction();
            await sendEmail(user.email, "Account Deleted", deleteUserEmailTemplate({ userName: `${user.name.firstName}`, deletedAt: new Date().toLocaleDateString() }));
            return user;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = userRepository