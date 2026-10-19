const createHttpError = require("http-errors");
const Admin = require("../models/admin");
const User = require("../models/user");

// Public demo deployment. The demo admin (admin.noDelete) can read, add and edit, but not delete,
// suspend accounts, or change a demo user's login. Shared demo accounts (user.isDemo) can't be
// deleted or have their PIN, email or phone changed, so they keep working for every visitor.
// Both flags default to false, so a normal deployment is unaffected.

function demoAdminGuard(req, res, next) {
  (async () => {
    if (!req.admin) return next();
    const admin = await Admin.findById(req.admin).select("noDelete").lean();
    if (!admin?.noDelete) return next();

    if (req.method === "DELETE") {
      throw createHttpError.Forbidden("Demo admin accounts can't delete data");
    }
    if (req.method === "PUT" && req.body?.locked === true) {
      throw createHttpError.Forbidden("Demo admin accounts can't suspend accounts");
    }
    if (req.method === "PUT" && req.params.id && (req.body?.email || req.body?.phone)) {
      const target = await User.findById(req.params.id).select("isDemo email phone").lean().catch(() => null);
      const changesLogin =
        target?.isDemo &&
        ((req.body.email && req.body.email.toLowerCase() !== target.email) ||
          (req.body.phone?.number && String(req.body.phone.number) !== String(target.phone?.number)));
      if (changesLogin) {
        throw createHttpError.Forbidden("Demo admin accounts can't change a demo user's email or phone");
      }
    }
    next();
  })().catch(next);
}

function demoUserGuard(req, res, next) {
  (async () => {
    if (!req.user) return next();
    const user = await User.findById(req.user).select("isDemo").lean();
    if (user?.isDemo) {
      throw createHttpError.Forbidden("This is a shared demo account, so its login details and account can't be changed");
    }
    next();
  })().catch(next);
}

// Unauthenticated routes that start a login change (forgot passcode): block them for demo accounts too,
// since a demo deployment may use a fixed OTP (DEMO_FIXED_OTP).
function demoCredentialsGuard(req, res, next) {
  (async () => {
    const { email, phone } = req.body || {};
    const query = email
      ? { email: String(email).toLowerCase().trim() }
      : phone?.number
        ? { "phone.countryCode": String(phone.countryCode).replace("+", ""), "phone.number": Number(phone.number) }
        : null;
    const user = query && (await User.findOne(query).select("isDemo").lean());
    if (user?.isDemo) {
      throw createHttpError.Forbidden("This is a shared demo account, so its passcode can't be reset. Use PIN 2026.");
    }
    next();
  })().catch(next);
}

module.exports = { demoAdminGuard, demoUserGuard, demoCredentialsGuard };
