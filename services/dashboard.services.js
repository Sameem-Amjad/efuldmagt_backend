const fuldmagtFormRepository = require("../repositories/fuldmagtForm.repositories")
const userRepository = require("../repositories/user.repositories")
const fuldmagtRequestRepository = require("../repositories/fuldmagtRequest.repositories")
const fuldmagtRepository = require("../repositories/fuldmagt.repositories")

const dashboardServices = {
    async getDashboardData(){
        let fuldmagtForms = await fuldmagtFormRepository.getFuldmagtFormAnalytics();
        let users = await userRepository.getUsersAnalytics();
        let fuldmagtRequests = await fuldmagtRequestRepository.getFuldmagtRequestsAnalytics();
        let fuldmagts = await fuldmagtRepository.getFuldmagtsAnalytics();

        let fuldmagtsCreated = {
            total: fuldmagtRequests.total + fuldmagts.total,
            createdLastMonth: fuldmagtRequests.createdLastMonth + fuldmagts.createdLastMonth,
        }
        return {
            fuldmagtForms,
            users,
            fuldmagtsCreated,
            fuldmagtsSigned: fuldmagts
        }
    }
};

module.exports = dashboardServices;