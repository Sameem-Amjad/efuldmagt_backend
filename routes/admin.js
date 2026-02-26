const express = require("express");
const fuldmagtFormController = require("../controller/fuldmagtForm.controllers");
const fuldmagtController = require("../controller/fuldmagt.controllers");
const companyController = require("../controller/company.controllers");
const { errorHandler } = require("../handlers/error.handlers");
const { dashboardController } = require("../controller/dashboard.controllers");
const userController = require("../controller/user.controllers");
const authGuard = require("../middleware/authGuard.middleware");
const adminRouter = express.Router();

//Admin//
adminRouter.post('/login', errorHandler(userController.loginAdmin));
//Dashboard//
adminRouter.get('/dashboard', authGuard("admin"), errorHandler(dashboardController.getDashboardData));

//Fuldmagt Forms//
adminRouter.post('/fuldmagt-forms', authGuard("admin"), errorHandler(fuldmagtFormController.addFuldmagtForm));
adminRouter.put('/fuldmagt-form', authGuard("admin"), errorHandler(fuldmagtFormController.editFuldmagtForm));
adminRouter.get('/fuldmagt-forms', authGuard("admin"), fuldmagtFormController.getFuldmagtFormsWithPagination);
adminRouter.get('/fuldmagt-forms/:id', authGuard("admin"), fuldmagtFormController.getSpecificFuldmagtForm);
adminRouter.put('/fuldmagt-forms/:id', authGuard("admin"), fuldmagtFormController.updateFuldmagtForm);
adminRouter.delete('/fuldmagt-forms/:id', authGuard("admin"), fuldmagtFormController.deleteFuldmagtForm);

//Fuldmagt//
adminRouter.get('/fuldmagts', authGuard("admin"), errorHandler(fuldmagtController.getFuldmagtsByAdmin));
adminRouter.get('/fuldmagts/:id', authGuard("admin"), errorHandler(fuldmagtController.getSpecificFuldmagtByAdmin));
adminRouter.delete('/fuldmagts/:id', authGuard("admin"), errorHandler(fuldmagtController.deleteSpecificFuldmagtByAdmin));
adminRouter.get('/fuldmagt-requests/:id', authGuard("admin"), errorHandler(fuldmagtController.getSpecificFuldmagtRequestByAdmin));
//User//
adminRouter.get('/users', authGuard("admin"), errorHandler(userController.getUsers));
adminRouter.get('/users/:id', authGuard("admin"), errorHandler(userController.getSpecificUser));
adminRouter.post('/users', authGuard("admin"), errorHandler(userController.createUserByAdmin));
adminRouter.put('/users/:id', authGuard("admin"), errorHandler(userController.updateUserByAdmin));
// need for permanent delete
adminRouter.delete('/users/:id', authGuard("admin"), errorHandler(userController.deleteUserByAdmin));
adminRouter.patch('/users/:id/reactivate', authGuard("admin"), errorHandler(userController.reactivateUserByAdmin));

// //Company//
adminRouter.get('/companies', authGuard("admin"), errorHandler(companyController.getCompanies));
adminRouter.get('/companies/:id', authGuard("admin"), errorHandler(companyController.getSpecificCompany));
adminRouter.post('/companies', authGuard("admin"), errorHandler(companyController.addCompanyByAdmin));
adminRouter.put('/companies/:id', authGuard("admin"), errorHandler(companyController.updateCompanyByAdmin));
adminRouter.patch('/companies/:id/reactivate', authGuard("admin"), errorHandler(companyController.reactivateCompanyByAdmin));
// need for permanent delete
adminRouter.delete('/companies/:id', authGuard("admin"), errorHandler(companyController.deleteCompanyByAdmin));
adminRouter.get('/fuldmagt-form-title-check/:title', authGuard("admin"), errorHandler(fuldmagtFormController.checkFuldmagtFormTitle));
module.exports = adminRouter;