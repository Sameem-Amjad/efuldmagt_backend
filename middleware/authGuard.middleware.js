const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const userServices = require("../services/user.services");
const companyServices = require("../services/company.services");

//function to verify authentication
function authGuard(accountType) {
  const allowedTypes = ["admin", "user", "company"];
  if (!allowedTypes.includes(accountType)) {
    throw new Error("Invalid accountType passed to authGuard");
  }

  return async function (req, res, next) {
    try {
      const token = req.header("Authorization");
      if (!token || !token.startsWith("Bearer ")) {
        throw createHttpError.Unauthorized("Authorization token missing or invalid format");
      }

      if (!process.env.AUTHORIZATION_TOKEN) {
        throw new Error("JWT secret is not configured");
      }

      const jwtToken = token.split(" ")[1];

      let verified;
      try {
        verified = jwt.verify(jwtToken, process.env.AUTHORIZATION_TOKEN);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          throw createHttpError.Unauthorized("Token has expired");
        }
        throw createHttpError.Unauthorized("Invalid token");
      }

      if (!verified) {
        throw createHttpError.Unauthorized("Invalid authentication payload");
      }
      req.user = verified.userId;
      req.company = verified.companyId;
      req.admin = verified.adminId;

      // ✅ USER CHECK
      if (req.user) {
        const userData = await userServices.getUserById(req.user);
        if (!userData) throw createHttpError.Unauthorized("User not found");
        if (!req.company && userData?.company != null) {
          req.company = userData.company;
        }
        if (userData.adminLocked) {
          throw createHttpError.Unauthorized("User account is locked by admin");
        }
        if (userData.locked) {
          throw createHttpError.Unauthorized("User account is locked");
        }
      }

      // ✅ COMPANY CHECK
      if (req.company) {
        const companyData = await companyServices.getCompanyById(req.company);

        // The user's company was deleted (an admin delete removes the document but not user.company):
        // carry on as a plain user instead of failing every request on companyData being null.
        if (!companyData) {
          req.company = undefined;
        } else if (companyData.adminLocked) {
          throw createHttpError.Unauthorized("Company account is locked by admin");
        } else if (companyData.locked) {
          throw createHttpError.Unauthorized("Company account is locked");
        }
      }

      // ✅ ROLE CHECK
      if (accountType === "admin" && !req.admin) {
        throw createHttpError.Unauthorized("Admin token required");
      }

      // if (accountType === "company" && !req.company) {
      //   throw createHttpError.Unauthorized("Company token required");
      // }

      if (accountType === "user" && !req.user) {
        throw createHttpError.Unauthorized("User token required");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = authGuard
