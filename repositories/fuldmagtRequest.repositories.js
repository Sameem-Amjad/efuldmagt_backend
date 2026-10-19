
const FuldmagtRequest = require("../models/fuldmagtRequests")
const mongoose = require("mongoose")

const fuldmagtRequestRepository = {
    async createFuldmagtRequest({
        fuldmagtFormId,
        accountType,
        fuldmagtGiverId,
        fuldmagtGiverName,
        fuldmagtGiverEmail,
        fuldmagtGiverPhone,
        agentId,
        agentName,
        agentDOB,
        agentEmail,
        agentPhone,
        expiry,
        additionalFieldsData,
        fuldmagtGiverImage,
        fuldmagtStatement
    }) {
        if (fuldmagtGiverImage == undefined) {

            fuldmagtGiverImage = "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_640.png";
        }
        console.log('Creating FuldmagtRequest with fuldmagtGiverImage:', fuldmagtGiverImage);
        let fuldmagtRequest = new FuldmagtRequest({
            fuldmagtFormId,
            accountType,
            fuldmagtGiverId,
            fuldmagtGiverName,
            fuldmagtGiverEmail,
            fuldmagtGiverPhone,
            agentId,
            agentName,
            agentDOB,
            agentEmail,
            agentPhone,
            expiry,
            fuldmagtGiverImage,
            additionalFieldsData,
            fuldmagtStatement
        });

        await fuldmagtRequest.save();
        console.log('FuldmagtRequest created with ID:', fuldmagtRequest._id);
        return fuldmagtRequest;
    },
    async updateFuldmagtRequest(fuldmagtRequestId, updatedFuldmagtRequest) { //Will be expensive function
        let fuldmagtRequest = await FuldmagtRequest.findByIdAndUpdate(fuldmagtRequestId, updatedFuldmagtRequest, { new: true });

        return fuldmagtRequest;
    },
    async getFuldmagtRequests() {
        let fuldmagtRequests = await FuldmagtRequest.aggregate([
            {
                $lookup: {
                    from: "fuldmagtForms",
                    localField: "fuldmagtFormId",
                    foreignField: "_id",
                    as: "fuldmagtForm"
                }
            },
            {
                $unwind: "$fuldmagtForm"
            },
            {
                $addFields: {
                    title: "$fuldmagtForm.title",
                    icon: "$fuldmagtForm.icon",
                    additionalFields: "$fuldmagtForm.additionalFields", // field keys, so the statement can be filled by name
                    additionalFieldsType: "$fuldmagtForm.additionalFieldsType",
                    fuldmagt_image: "$fuldmagtForm.fuldmagt_image",
                    purchaseType: "$fuldmagtForm.purchaseType",
                    price: "$fuldmagtForm.price",
                    validity: "request"
                },
            },
            {
                $project: {
                    fuldmagtForm: 0
                }
            },

            { $sort: { createdAt: -1 } } // Sort by createdAt in descending order
        ]);
        return fuldmagtRequests;
    },
    async getSpecificFuldmagtRequest(fuldmagtRequestId) {
        let fuldmagtRequest = await FuldmagtRequest.aggregate(
            [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(fuldmagtRequestId)
                    }
                },
                {
                    $lookup: {
                        from: "fuldmagtForms",
                        localField: "fuldmagtFormId",
                        foreignField: "_id",
                        as: "fuldmagtForm"
                    }
                },
                {
                    $unwind: "$fuldmagtForm"
                },
                {
                    $addFields: {
                        title: "$fuldmagtForm.title",
                        icon: "$fuldmagtForm.icon",
                        additionalFields: "$fuldmagtForm.additionalFields", // field keys, so the statement can be filled by name
                        additionalFieldsType: "$fuldmagtForm.additionalFieldsType",
                        fuldmagt_image: "$fuldmagtForm.fuldmagt_image",
                        purchaseType: "$fuldmagtForm.purchaseType",
                        price: "$fuldmagtForm.price",
                        validity: "request"
                    },
                },
                {
                    $project: {
                        fuldmagtForm: 0
                    }
                }
            ]
        );
        if (fuldmagtRequest.length == 0)
            return null;
        fuldmagtRequest = fuldmagtRequest[0];

        return fuldmagtRequest;
    },
    async deleteFuldmagtRequest(fuldmagtRequestId) {
        let fuldmagtRequest = await FuldmagtRequest.findByIdAndDelete(fuldmagtRequestId);
        return fuldmagtRequest;
    },

    async getUserFuldmagtRequests(userId, companyId, isCompany) {
        let objectIdUserId = new mongoose.Types.ObjectId(userId);
        let orFilter = [];
        if (!isCompany) {
            orFilter.push({ fuldmagtGiverId: objectIdUserId })
            orFilter.push({ agentId: objectIdUserId })
        }
        if (isCompany == true && !companyId) {
            throw new Error("CompanyId must be provided and isCompany must be true");
        }
        // let orFilter = [
        //     { fuldmagtGiverId: objectIdUserId },
        //     { agentId: objectIdUserId }
        // ];

        if (companyId && isCompany) {
            orFilter.push({ fuldmagtGiverId: new mongoose.Types.ObjectId(companyId) })
            orFilter.push({ agentId: new mongoose.Types.ObjectId(companyId) })
        }

        let fuldmagtRequests = await FuldmagtRequest.aggregate([
            {
                $match: {
                    $or: orFilter
                }
            },
            {
                $addFields: {
                    validity: "request",
                    status: {
                        $cond: [
                            { $or: [{ $eq: ["$fuldmagtGiverId", objectIdUserId] }, { $eq: ["$fuldmagtGiverId", new mongoose.Types.ObjectId(companyId)] }] },
                            "received_request",
                            "sent_request"
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "fuldmagtForms",
                    localField: "fuldmagtFormId",
                    foreignField: "_id",
                    as: "fuldmagtForm"
                }
            },
            {
                $unwind: "$fuldmagtForm"
            },
            {
                $addFields: {
                    title: "$fuldmagtForm.title",
                    icon: "$fuldmagtForm.icon",
                    additionalFields: "$fuldmagtForm.additionalFields", // field keys, so the statement can be filled by name
                    additionalFieldsType: "$fuldmagtForm.additionalFieldsType",
                    fuldmagt_image: "$fuldmagtForm.fuldmagt_image",
                    purchaseType: "$fuldmagtForm.purchaseType",
                    price: "$fuldmagtForm.price",
                },
            },
            {
                $project: {
                    fuldmagtForm: 0
                }
            },
            { $sort: { createdAt: -1 } } // Sort by createdAt in descending order
        ]);
        return fuldmagtRequests;
    },
    async getFuldmagtRequestsAnalytics() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const totalFuldmagtRequests = await FuldmagtRequest.countDocuments();
        const totalFuldmagtRequestsLastMonth = await FuldmagtRequest.countDocuments({
            createdAt: { $gte: lastMonth }
        });

        return {
            total: totalFuldmagtRequests,
            createdLastMonth: totalFuldmagtRequestsLastMonth
        };
    },
    deleteSpecificFuldmagtRequestByAdmin(fuldmagtRequestId) {
        return FuldmagtRequest.findByIdAndDelete(fuldmagtRequestId);
    }
};

module.exports = fuldmagtRequestRepository