const mongoose = require("mongoose");
const notificationServices = require("../services/notification.services");
const { dataResponse, messageResponse } = require("../utils/responses");


const notificationController = {
  async getUserNotifications(req, res, next) {
    let userId = req.user;
    let { isCompany } = req.query;

    let notifications = await notificationServices.getUserNotifications(userId, isCompany);

    return res.status(200).send(dataResponse("User notifications has been fetched successfully", { notifications }));
  },
  async addNotificationToken(req, res, next) {
    let userId = req.user;
    let { notificationId } = req.body;

    await notificationServices.addNotificationToken(userId, notificationId);

    return res.status(200).send(messageResponse("Notification Token has been added successfully"));
  },
  async getNotificationSettings(req, res, next) {
    let userId = req.user;

    let notificationSettings = await notificationServices.getNotificationSettings(userId);

    return res.status(200).send(dataResponse("Notification Settings has been fetched successfully", { notificationSettings }));
  },
  async setActivityNotification(req, res, next) {
    let userId = req.user;
    let { email, pushNotification } = req.body;

    let notificationSetting = await notificationServices.setActivityNotification(userId, email, pushNotification);

    return res.status(200).send(dataResponse("Activity Notification has been set successfully", { notificationSetting }));
  },

  async setSpecialOfferNotification(req, res, next) {
    let userId = req.user;
    let { email, pushNotification } = req.body;

    let notificationSetting = await notificationServices.setSpecialOfferNotification(userId, email, pushNotification);

    return res.status(200).send(dataResponse("Special Offer Notification has been set successfully", { notificationSetting }));
  },

  async setFeedbackNotification(req, res, next) {
    let userId = req.user;
    let { email, pushNotification } = req.body;

    let notificationSetting = await notificationServices.setFeedbackNotification(userId, email, pushNotification);

    return res.status(200).send(dataResponse("Feedback Notification has been set successfully", { notificationSetting }));
  },

  async setReminderNotification(req, res, next) {
    let userId = req.user;
    let { email, pushNotification } = req.body;

    let notificationSetting = await notificationServices.setReminderNotification(userId, email, pushNotification);

    return res.status(200).send(dataResponse("Reminder Notification has been set successfully", { notificationSetting }));
  },

  async setNewsNotification(req, res, next) {
    let userId = req.user;
    let { email, pushNotification } = req.body;

    let notificationSetting = await notificationServices.setNewsNotification(userId, email, pushNotification);

    return res.status(200).send(dataResponse("News Notification has been set successfully", { notificationSetting }));
  }
};

module.exports = notificationController;
