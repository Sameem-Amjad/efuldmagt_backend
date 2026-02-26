
const Fuldmagt = require("../models/fuldmagt")
const mongoose = require("mongoose")

const fuldmagtRepository = {
    async createFuldmagt({
        fuldmagtDocumentKey,
        fuldmagtDocumentLink,
        fuldmagtFormId,
        additionalFieldsData,
        accountType,
        expiry,
        fuldmagtGiverSignature,
        agentId,
        agentName,
        agentDOB,
        agentEmail,
        agentPhone,
        fuldmagtGiverId,
        fuldmagtGiverName,
        fuldmagtGiverImage,
        fuldmagtStatement,
        requestStatus,

    }) {
        let fuldmagt = new Fuldmagt({
            fuldmagtFormId,
            additionalFieldsData,
            accountType,
            expiry,
            fuldmagtGiverSignature,
            agentId,
            agentName,
            agentDOB,
            agentEmail,
            agentPhone,
            fuldmagtGiverId,
            fuldmagtGiverName,
            fuldmagtGiverImage,
            fuldmagtStatement,
            requestStatus,
            fuldmagtDocumentsLink: [{
                fuldmagtIssueDate: new Date(),
                fuldmagtDocumentLink: fuldmagtDocumentLink || "",
                fuldmagtDocumentKey: fuldmagtDocumentKey || ""
            }]
        });

        await fuldmagt.save();

        return fuldmagt;
    },
    async updateFuldmagt(fuldmagtId, fuldmagtData) { //Will be expensive function
        delete fuldmagtData._id;

        let fuldmagt = await Fuldmagt.findByIdAndUpdate(fuldmagtId, fuldmagtData, { new: true });

        return fuldmagt;
    },
    async getFuldmagts() {
        let fuldmagts = await Fuldmagt.aggregate([
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
                    fuldmagt_image: "$fuldmagtForm.fuldmagt_image",
                    purchaseType: "$fuldmagtForm.purchaseType",
                    price: "$fuldmagtForm.price",
                    isAgentSignRequired: "$fuldmagtForm.isAgentSignRequired",
                    validity: {
                        $cond: [
                            { $eq: ["$revoked", true] }, // Check if revoked is true
                            "revoked", // If true, set validity to "revoked"
                            {
                                $cond: [
                                    { $gt: [new Date(), "$expiry"] }, // Check if current date is less than expiry
                                    "expired", // If expiry is less than the current date, set validity to "expired"
                                    "$expiry" // Otherwise, set it to the expiry date
                                ]
                            }
                        ]
                    }
                },
            },
            {
                $project: {
                    fuldmagtForm: 0
                }
            },
            { $sort: { createdAt: -1 } } // Sort by createdAt in descending order
        ]);

        return fuldmagts;
    },
    async getSpecificFuldmagt(fuldmagtId) {
        let fuldmagt = await Fuldmagt.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(fuldmagtId)
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
                    fuldmagt_image: "$fuldmagtForm.fuldmagt_image",
                    purchaseType: "$fuldmagtForm.purchaseType",
                    price: "$fuldmagtForm.price",
                    isAgentSignRequired: "$fuldmagtForm.isAgentSignRequired",
                    validity: {
                        $cond: [
                            { $eq: ["$revoked", true] }, // Check if revoked is true
                            "revoked", // If true, set validity to "revoked"
                            {
                                $cond: [
                                    { $gt: [new Date(), "$expiry"] }, // Check if current date is less than expiry
                                    "expired", // If expiry is less than the current date, set validity to "expired"
                                    "$expiry" // Otherwise, set it to the expiry date
                                ]
                            }
                        ]
                    }
                },
            },
            {
                $project: {
                    fuldmagtForm: 0
                }
            },
            { $sort: { createdAt: -1 } } // Sort by createdAt in descending order
        ])

        if (fuldmagt.length > 0) {
            return fuldmagt[0];
        } else {
            return null;
        }
    },
    async deleteFuldmagt(fuldmagtId) {
        let fuldmagt = await Fuldmagt.findByIdAndDelete(fuldmagtId);

        return fuldmagt;
    },
    async getUserFuldmagts(userId, companyId, isCompany) {
        let objectIdUserId = new mongoose.Types.ObjectId(userId);
        let orFilter = [];
        if (!isCompany) {
            orFilter.push({ fuldmagtGiverId: objectIdUserId })
            orFilter.push({ agentId: objectIdUserId })
        }
        const currentDate = new Date();
        // console.log(currentDate);

        if (companyId && isCompany) {
            orFilter.push({ fuldmagtGiverId: new mongoose.Types.ObjectId(companyId) })
            orFilter.push({ agentId: new mongoose.Types.ObjectId(companyId) })
        }
        let fuldmagts = await Fuldmagt.aggregate([
            {
                $match: {
                    $or: orFilter
                }
            },
            {
                $addFields: {
                    validity: {
                        $cond: [
                            { $eq: ["$revoked", true] }, // Check if revoked is true
                            "revoked", // If true, set validity to "revoked"
                            {
                                $cond: [
                                    { $gt: [currentDate, "$expiry"] }, // Check if current date is less than expiry
                                    "expired", // If expiry is less than the current date, set validity to "expired"
                                    "$expiry" // Otherwise, set it to the expiry date
                                ]
                            }
                        ]
                    },
                    status: {
                        $cond: [
                            { $or: [{ $eq: ["$fuldmagtGiverId", objectIdUserId] }, { $eq: ["$fuldmagtGiverId", new mongoose.Types.ObjectId(companyId)] }] },
                            "sent",
                            "received"
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
                    fuldmagt_image: "$fuldmagtForm.fuldmagt_image",
                    purchaseType: "$fuldmagtForm.purchaseType",
                    price: "$fuldmagtForm.price",
                    isAgentSignRequired: "$fuldmagtForm.isAgentSignRequired"
                },
            },
            {
                $project: {
                    fuldmagtForm: 0
                }
            },
            { $sort: { createdAt: -1 } } // Sort by createdAt in descending order
        ]);

        return fuldmagts;
    },
    async getFuldmagtsAnalytics() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const fuldmagtsCreatedLastMonth = await Fuldmagt.countDocuments({
            createdAt: { $gte: lastMonth }
        });

        const totalFuldmagts = await Fuldmagt.countDocuments();

        return {
            createdLastMonth: fuldmagtsCreatedLastMonth,
            total: totalFuldmagts
        };
    }
}

module.exports = fuldmagtRepository