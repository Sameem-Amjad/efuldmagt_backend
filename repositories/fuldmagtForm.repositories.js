const createHttpError = require("http-errors");
const FuldmagtForm = require("../models/fuldmagtForm")
const Fuldmagt = require("../models/fuldmagt");
const FuldmagtRequest = require("../models/fuldmagtRequests");
const mongoose = require("mongoose");
const User = require("../models/user");
const Company = require("../models/company");
const fuldmagtFormRepository = {
    async createFuldmagtForm({ title, price, additionalFields, additionalFieldsType, additionalFieldsObject,
        isAgentSignRequired, fuldmagtStatement, purchaseType, icon, fuldmagt_image, exceptUsers, exceptCompanies, selectedUsers, selectedCompanies, visibleTo }) { //Will be expensive function
        //enum: ["specificUsers", "allUsers", "specificCompanies", "allCompanies", "everyone", "specificUsersAndCompanies"],
        if (visibleTo.toLowerCase() === "everyone") {
            let users = await User.find();
            selectedUsers = users.map(user => user._id);
            let companies = await Company.find({ deleted: false });
            selectedCompanies = companies.map(company => company._id);
        }
        if (visibleTo.toLowerCase() === "allusers") {
            let users = await User.find();
            selectedUsers = users.map(user => user._id);
        }
        if (visibleTo.toLowerCase() === "allcompanies") {
            let companies = await Company.find({ deleted: false });
            selectedCompanies = companies.map(company => company._id);
        }
        // console.log(visibleTo);
        let fuldmagtForm = new FuldmagtForm({
            title, price, additionalFields, additionalFieldsType, additionalFieldsObject,
            isAgentSignRequired, fuldmagtStatement, purchaseType, icon, fuldmagt_image, exceptUsers, exceptCompanies, selectedUsers, selectedCompanies, visibleTo
        })

        if (additionalFields.length != additionalFieldsType.length || additionalFieldsType.length != additionalFieldsObject.length) {
            throw createHttpError.BadRequest("Additionals fields are not correct");
        }

        for (let i = 0; i < additionalFields.length; i++) {
            if (
                (additionalFieldsType[i] == "headline" && additionalFieldsObject[i].text == undefined) ||
                (additionalFieldsType[i] == "note" && additionalFieldsObject[i].text == undefined) ||
                (additionalFieldsType[i] == "textField" && additionalFieldsObject[i].placeholder == undefined) ||
                (additionalFieldsType[i] == "textArea" && additionalFieldsObject[i].placeholder == undefined) ||
                (additionalFieldsType[i] == "radioButtons" && (additionalFieldsObject[i].heading == undefined || additionalFieldsObject[i].options == undefined)) ||
                (additionalFieldsType[i] == "checkBoxes" && (additionalFieldsObject[i].heading == undefined || additionalFieldsObject[i].options == undefined))
            ) {
                throw createHttpError.BadRequest("Additions Field Issue: " + additionalFields[i])
            }
            else if (
                additionalFieldsType[i] != "date" && additionalFieldsType[i] == "headline" &&
                additionalFieldsType[i] != "note" && additionalFieldsType[i] == "textField" &&
                additionalFieldsType[i] != "textArea" && additionalFieldsType[i] == "radioButtons" &&
                additionalFieldsType[i] != "checkBoxes"
            ) {
                throw createHttpError.BadRequest("Additional Fields type not valid")
            }
        }

        await fuldmagtForm.save();

        return fuldmagtForm;
    },
    async editFuldmagtForm({ fuldmagtformId, title, icon, additionalFields, additionalFieldsType, additionalFieldsObject,
        isAgentSignRequired, fuldmagtStatement, purchaseType, fuldmagt_image, exceptUsers, exceptCompanies, selectedUsers, selectedCompanies, visibleTo }) { //Will be expensive function
        let fuldmagtForm = await FuldmagtForm.findById(fuldmagtformId);
        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found");
        }
        if (visibleTo && visibleTo.toLowerCase() === "everyone") {
            let users = await User.find();
            selectedUsers = users.map(user => user._id);
            let companies = await Company.find({ deleted: false });
            selectedCompanies = companies.map(company => company._id);
        }
        if (visibleTo && visibleTo.toLowerCase() === "allusers") {
            let users = await User.find();
            selectedUsers = users.map(user => user._id);
        }
        if (visibleTo && visibleTo.toLowerCase() === "allcompanies") {
            let companies = await Company.find({ deleted: false });
            selectedCompanies = companies.map(company => company._id);
        }
        fuldmagtForm.title = title;
        fuldmagtForm.icon = icon;
        fuldmagtForm.additionalFields = additionalFields;
        fuldmagtForm.additionalFieldsType = additionalFieldsType;
        fuldmagtForm.additionalFieldsObject = additionalFieldsObject;
        fuldmagtForm.isAgentSignRequired = isAgentSignRequired;
        fuldmagtForm.fuldmagtStatement = fuldmagtStatement;
        fuldmagtForm.purchaseType = purchaseType;
        fuldmagtForm.fuldmagt_image = fuldmagt_image;
        fuldmagtForm.exceptUsers = exceptUsers;
        fuldmagtForm.exceptCompanies = exceptCompanies;
        fuldmagtForm.selectedUsers = selectedUsers;
        fuldmagtForm.selectedCompanies = selectedCompanies;
        fuldmagtForm.visibleTo = visibleTo;

        if (additionalFields.length != additionalFieldsType.length || additionalFieldsType.length != additionalFieldsObject.length) {
            throw createHttpError.BadRequest("Additionals fields are not correct");
        }
        for (let i = 0; i < additionalFields.length; i++) {
            if (
                (additionalFieldsType[i] == "headline" && additionalFieldsObject[i].text == undefined) ||
                (additionalFieldsType[i] == "note" && additionalFieldsObject[i].text == undefined) ||
                (additionalFieldsType[i] == "textField" && additionalFieldsObject[i].placeholder == undefined) ||
                (additionalFieldsType[i] == "textArea" && additionalFieldsObject[i].placeholder == undefined) ||
                (additionalFieldsType[i] == "radioButtons" && (additionalFieldsObject[i].heading == undefined || additionalFieldsObject[i].options == undefined)) ||
                (additionalFieldsType[i] == "checkBoxes" && (additionalFieldsObject[i].heading == undefined || additionalFieldsObject[i].options == undefined))
            ) {
                throw createHttpError.BadRequest("Additions Field Issue: " + additionalFields[i])
            }
            else if (
                additionalFieldsType[i] != "date" && additionalFieldsType[i] == "headline" &&
                additionalFieldsType[i] != "note" && additionalFieldsType[i] == "textField" &&
                additionalFieldsType[i] != "textArea" && additionalFieldsType[i] == "radioButtons" &&
                additionalFieldsType[i] != "checkBoxes"
            ) {
                throw createHttpError.BadRequest("Additional Fields type not valid")
            }
        }

        await fuldmagtForm.save();
        return fuldmagtForm;
    },

    async updateFuldmagtForm({ title, icon, additionalFields, additionalFieldsType, additionalFieldsObject,
        isAgentSignRequired, purchaseType, fuldmagtStatement }) { //Will be expensive function
        let fuldmagtForm = new FuldmagtForm({
            title, icon, additionalFields, additionalFieldsType, additionalFieldsObject,
            isAgentSignRequired, purchaseType, fuldmagtStatement
        })

        if (additionalFields.length != additionalFieldsType.length || additionalFieldsType.length != additionalFieldsObject) {
            throw createHttpError.BadRequest("Additionals fields are not correct");
        }

        for (let i = 0; i < additionalFields.length; i++) {
            if (
                (additionalFieldsType[i] == "headline" && additionalFieldsObject[i].text == undefined) ||
                (additionalFieldsType[i] == "note" && additionalFieldsObject[i].text == undefined) ||
                (additionalFieldsType[i] == "textField" && additionalFieldsObject[i].placehodler == undefined) ||
                (additionalFieldsType[i] == "textArea" && additionalFieldsObject[i].placehodler == undefined) ||
                (additionalFieldsType[i] == "radioButton" && (additionalFieldsObject[i].heading == undefined || additionalFieldsObject[i].options == undefined)) ||
                (additionalFieldsType[i] == "checkBoxes" && (additionalFieldsObject[i].heading == undefined || additionalFieldsObject[i].options == undefined))
            ) {
                throw createHttpError.BadRequest("Additions Field Issue: ", additionalFields[i])
            }
        }

        await fuldmagtForm.save();

        return fuldmagtForm;
    },
    async getFuldmagtForms() {
        let fuldmagtForms = await FuldmagtForm.find({ isAdminDeleted: false });
        return fuldmagtForms
    },
    async getFuldmagtFormsWithPagination(page, limit, title) {
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        const skip = (page - 1) * limit;
        const filter = { isAdminDeleted: false, };
        // Add title search only if provided
        if (title && title.trim() !== "") {
            filter.title = { $regex: title, $options: "i" };
        }
        const [fuldmagtForms, totalCount] = await Promise.all([
            FuldmagtForm.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            FuldmagtForm.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            fuldmagtForms: await Promise.all(fuldmagtForms.map(async (form) => {
                const fuldmagtsCount = await Fuldmagt.countDocuments({ fuldmagtFormId: form._id });
                const fuldmagtRequestsCount = await FuldmagtRequest.countDocuments({ fuldmagtFormId: form._id });
                return {
                    ...form.toObject(),
                    usedCounts: fuldmagtsCount + fuldmagtRequestsCount
                };
            })),
            page,
            limit,
            totalPages,
            totalCount,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    },

    async getSpecificFuldmagtForm(fuldmagtFormId) {
        let fuldmagtForm = await FuldmagtForm.findOne({ _id: fuldmagtFormId, isAdminDeleted: false });

        return fuldmagtForm;
    },
    async deleteFuldmagtForm(fuldmagtFormId) {
        let fuldmagtForm = await FuldmagtForm.findOneAndUpdate({ _id: fuldmagtFormId }, { isAdminDeleted: true }, { new: true });
        return fuldmagtForm;
    },
    // async getFuldmagtFormsByUser(userId, isCompany = false, companyId = null) {
    //     const userObjectId = mongoose.Types.ObjectId(userId);
    //     if (isCompany && companyId == null) {
    //         throw createHttpError.BadRequest("You did not have company");
    //     }
    //     if (isCompany) {
    //         userId = null;
    //     }
    //     const pipeline = [
    //         {
    //             $match: {
    //                 $expr: {
    //                     $or: [
    //                         // Case 1: exceptUsers is false and userId is in selectedUsers
    //                         {
    //                             $and: [
    //                                 { $eq: ["$exceptUsers", false] },
    //                                 { $in: [userObjectId, "$selectedUsers"] }
    //                             ]
    //                         },
    //                         // Case 2: exceptUsers is true and userId is not in selectedUsers
    //                         {
    //                             $and: [
    //                                 { $eq: ["$exceptUsers", true] },
    //                                 { $not: { $in: [userObjectId, "$selectedUsers"] } }
    //                             ]
    //                         },
    //                         // You can add similar conditions for companies if needed
    //                         {
    //                             $and: [
    //                                 { $eq: ["$exceptCompanies", false] },
    //                                 { $in: [mongoose.Types.ObjectId(companyId), "$selectedCompanies"] }
    //                             ]
    //                         },
    //                         {
    //                             $and: [
    //                                 { $eq: ["$exceptCompanies", true] },
    //                                 { $not: { $in: [mongoose.Types.ObjectId(companyId), "$selectedCompanies"] } }
    //                             ]
    //                         }
    //                     ]
    //                 }
    //             }
    //         }
    //     ]
    //     let fuldmagtForms = await FuldmagtForm.aggregate(pipeline);

    //     return fuldmagtForms;
    // },

    async getFuldmagtFormsByUser(userId, isCompany = false, companyId = null) {
        if (isCompany == true && !companyId) {
            throw createHttpError.BadRequest("Company ID is required for company requests.");
        }

        const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;
        const companyObjectId = companyId ? new mongoose.Types.ObjectId(companyId) : null;

        const matchConditions = [];
        if (isCompany == true || isCompany === "true") {
            matchConditions.push(
                { visibleTo: "everyone" },
                { visibleTo: "allCompanies" },
                {
                    visibleTo: "specificCompanies",
                    selectedCompanies: { $in: [companyObjectId] },
                },
                {
                    visibleTo: "specificUsersAndCompanies",
                    $or: [
                        { selectedCompanies: { $in: [companyObjectId] } },
                        { selectedUsers: { $in: [""] } },
                    ],
                }
            );
        } else {
            matchConditions.push(
                { visibleTo: "everyone" },
                { visibleTo: "allUsers" },
                {
                    visibleTo: "specificUsers",
                    selectedUsers: { $in: [userObjectId] },
                },
                {
                    visibleTo: "specificUsersAndCompanies",
                    $or: [
                        { selectedUsers: { $in: [userObjectId] } },
                        { selectedCompanies: { $in: [""] } },
                    ],
                }
            );
        }
        // console.log("Match Conditions:", matchConditions);
        const pipeline = [
            { $match: { isAdminDeleted: false, $or: matchConditions } },
            { $sort: { createdAt: -1 } },
        ];

        const fuldmagtForms = await FuldmagtForm.aggregate(pipeline);
        // console.log("Fuldmagt Forms Retrieved:", fuldmagtForms[0]);
        return fuldmagtForms;
    }
    ,
    async getSpecificFuldmagtFormByUser(userId, fuldmagtId) {
        const userObjectId = mongoose.Types.ObjectId(userId);
        const fuldmagtObjectId = mongoose.Types.ObjectId(fuldmagtId);
        const pipeline = [
            {
                $match: {
                    "_id": fuldmagtObjectId,
                    isAdminDeleted: false
                }
            },
            {
                $match: {
                    $expr: {
                        $or: [
                            // Case 1: exceptUsers is false and userId is in selectedUsers
                            {
                                $and: [
                                    { $eq: ["$exceptUsers", false] },
                                    { $in: [userObjectId, "$selectedUsers"] }
                                ]
                            },
                            // Case 2: exceptUsers is true and userId is not in selectedUsers
                            {
                                $and: [
                                    { $eq: ["$exceptUsers", true] },
                                    { $not: { $in: [userObjectId, "$selectedUsers"] } }
                                ]
                            }
                        ]
                    }
                }
            }
        ]
        let fuldmagtForms = await FuldmagtForm.aggregate(pipeline);

        let fuldmagtForm = (fuldmagtForms.length > 0) ? fuldmagtForms[0] : null;

        return fuldmagtForm;
    },

    async getFuldmagtFormAnalytics() {
        let fuldmagtFormData = await FuldmagtForm.aggregate([

            {
                $lookup: {
                    from: "fuldmagts",
                    localField: "_id",
                    foreignField: "fuldmagtFormId",
                    as: "fuldmagts"
                }
            },
            {
                $lookup: {
                    from: "fuldmagtRequests",
                    localField: "_id",
                    foreignField: "fuldmagtFormId",
                    as: "fuldmagtRequests"
                }
            },
            {
                $addFields: {
                    "fuldmagtsCreated": {
                        $sum: [{ $size: "$fuldmagts" }, { $size: "$fuldmagtRequests" }]
                    },
                    "fuldmagtsSigned": {
                        $size: "$fuldmagts"
                    }
                }
            },
            {
                $project: {
                    icon: 1,
                    title: 1,
                    fuldmagtsCreated: 1,
                    fuldmagtsSigned: 1,
                    purchaseType: 1,
                    price: 1
                }
            }
        ]);

        return fuldmagtFormData;
    },
    async isFuldmagtFormTitleExists(title) {
        let fuldmagtForm = await FuldmagtForm.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });

        return (fuldmagtForm != null);
    },

    async isFuldmagtFormTitleExistsById(title, fuldmagtFormId) {
        let fuldmagtForm = await FuldmagtForm.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') }, _id: { $ne: fuldmagtFormId } });

        return (fuldmagtForm != null);
    },

    async updateVisibility(fuldmagtFormId, { visibileTo, userIds, companyIds }) {
        // "specificUsers", "allUsers", "specificCompanies", "allCompanies", "everyone", "specificUsersAndCompanies"
        let fuldmagtForm = await FuldmagtForm.findOne({ _id: fuldmagtFormId, isAdminDeleted: false });
        if (!fuldmagtForm) {
            throw createHttpError.NotFound("Fuldmagt Form not found");
        }
        // console.log(visibileTo.toLowerCase());
        if (visibileTo.toLowerCase() === "everyone") {
            fuldmagtForm.visibleTo = "everyone";
            let users = await User.find();
            userIds = users.map(user => user._id);
            let companies = await Company.find({ deleted: false });
            companyIds = companies.map(company => company._id);
            // console.log("Everyone selected");
        }
        if (visibileTo.toLowerCase() === "privateusersonly") {
            fuldmagtForm.visibleTo = "allUsers";
            let users = await User.find();
            userIds = users.map(user => user._id);
            fuldmagtForm.selectedCompanies = [];
            // console.log("All users selected");
        }
        if (visibileTo.toLowerCase() === "privatecompaniesonly") {
            fuldmagtForm.visibleTo = "allCompanies";
            let companies = await Company.find({ deleted: false });
            companyIds = companies.map(company => company._id);
            fuldmagtForm.selectedUsers = [];
            // console.log("All companies selected");
        }
        if (visibileTo.toLowerCase() === "custom") {
            if (userIds.length == 0 && companyIds.length == 0) {
                throw createHttpError.BadRequest("At least one user or company must be selected for custom visibility");
            }
        }
        if (userIds?.length > 0) {
            // console.log("Adding users to visibility:", fuldmagtForm);
            if (fuldmagtForm.selectedUsers === undefined || fuldmagtForm.selectedUsers === null) {
                fuldmagtForm.selectedUsers = [];
            }
            // Avoid duplicates
            // ...fuldmagtForm?.selectedUsers,
            fuldmagtForm.selectedUsers = [...new Set([...userIds])];
            fuldmagtForm.visibleTo = "specificUsersAndCompanies";
        }
        if (companyIds?.length > 0) {
            // console.log("Adding users to visibility:", fuldmagtForm);
            if (fuldmagtForm.selectedCompanies === undefined || fuldmagtForm.selectedCompanies === null) {
                fuldmagtForm.selectedCompanies = [];
            }
            //...fuldmagtForm?.selectedCompanies,
            fuldmagtForm.selectedCompanies = [...new Set([...companyIds])];
            fuldmagtForm.visibleTo = "specificUsersAndCompanies";
        }
        await fuldmagtForm.save();
        return fuldmagtForm;
    }
}

module.exports = fuldmagtFormRepository