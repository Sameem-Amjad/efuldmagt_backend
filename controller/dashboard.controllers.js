const { dataResponse } = require("../utils/responses");
const dashboardServices = require("../services/dashboard.services");

const dashboardController = {
    async getDashboardData(req, res, next) {
        
        let resBody = await dashboardServices.getDashboardData();

        return res.status(200).send(dataResponse("Dashboard Data has been retrieved", resBody));
    }
};

module.exports = {  dashboardController };