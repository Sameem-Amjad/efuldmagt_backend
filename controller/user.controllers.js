//User Services
const userServices = require("../services/user.services");

//Validation
const {
  mobileLoginSchema,
  verifyDevicePinSchema,
  refreshTokenSchema,
} = require("../schemas/users");

const { dataResponse } = require("../utils/responses");
const createHttpError = require("http-errors");
const User = require("../models/user");
const expressRedirect = require("../middleware/expressCriiptoVerify.middleware");

const userController = {
  async deactivateAccount(req, res, next) {
    let userId = req.user;

    let user = await userServices.softDelete(userId);

    return res
      .status(200)
      .send(dataResponse("User has been deleted successfully", { user }));
  },
  async reactivateUserByAdmin(req, res) {
    let userId = req.params.id;
    let user = await userServices.reactivateUserByAdmin(userId);

    return res
      .status(200)
      .send(dataResponse("User has been reactivated successfully", { user }));
  },
  //TO DO: Change it to Services//
  async uploadProfileImage(req, res, next) {
    let userId = req.user;
    let imageUrl = req.profileImageUrl;

    let user = await userServices.uploadProfileImage(userId, imageUrl);

    return res
      .status(200)
      .send(
        dataResponse("Profile Image has been uploaded successfully", { user })
      );
  },
  // ----------------- register User -----------------
  async registerUser(req, res) {
    const {
      emailCredentialsToken,
      phoneCredentialsToken,
      name,
      address,
      dateOfBirth,
    } = req.body;
    userObj = {
      name,
      address,
    };
    if (dateOfBirth) {
      userObj.dateOfBirth = new Date(dateOfBirth);
    }

    let resBody = await userServices.registerUser(
      emailCredentialsToken,
      phoneCredentialsToken,
      userObj
    );

    res
      .status(200)
      .send(dataResponse("User has been registered successfully", resBody));
  },
  async deleteUser(req, res, next) {
    let userId = req.params.id;

    let deletedUser = await userServices.softDelete(userId);

    return res.status(200).send({
      success: true,
      user: deletedUser,
    });
  },
  async createPassword(req, res) {
    const { createPasswordToken, pin, deviceId } = req.body;

    resBody = await userServices.createPassword(
      createPasswordToken,
      deviceId,
      pin
    );

    res
      .status(200)
      .send(dataResponse("Password has been created successfully", resBody));
  },

  async login(req, res, next) {
    const { credentials, pin } = req.body;

    resBody = await userServices.login(credentials, pin);

    res
      .status(200)
      .send(dataResponse("User has been logged in successfully", resBody));
  },

  async getUsers(req, res, next) {
    let query = req.query;
    let filteredUsers = await userServices.getUsers(query);

    return res.status(200).send(
      dataResponse("Users have been fetched successfully", {
        users: filteredUsers,
      })
    );
  },
  // .................. get user .............................
  async getUser(req, res) {
    const { id } = req.params;

    let resBody = await userServices.getUser(id);

    // Respond with the found user(s)
    return res
      .status(200)
      .send(dataResponse("User has been successfully fetched", resBody));
  },

  // .................. get user by token .............................
  async getUserByToken(req, res) {
    const userId = req.user;

    let resBody = await userServices.getUser(userId);

    // Respond with the found user(s)
    return res
      .status(200)
      .send(dataResponse("User has been successfully fetched", resBody));
  },

  //To Do: Change it to Services//
  async setPassword(req, res) {
    const userId = req.user;
    const { oldPin, newPin } = req.body;

    let resBody = await userServices.setPassword(userId, oldPin, newPin);

    return res
      .status(200)
      .send(dataResponse("Password has been set successfully", resBody));
  },

  // ......................update user .............................
  async updateUser(req, res, next) {
    const userId = req.user;

    let updateUserObj = req.body;

    let updatedUser = await userServices.updateUser(userId, updateUserObj);

    res.status(200).send(
      dataResponse("User has been updated successfully", {
        user: updatedUser,
      })
    );
  },
  async mobileLogin(req, res, next) {
    let validate = mobileLoginSchema.validate(req.body);

    if (validate.error) {
      throw createHttpError.BadRequest(validate.error.message);
    }

    let { credentials, pin, deviceId } = req.body;

    let resBody = await userServices.mobileLogin(credentials, pin, deviceId);

    return res
      .status(200)
      .send(dataResponse("User has been logged in successfully", resBody));
  },
  async verifyDevicePin(req, res, next) {
    let validate = verifyDevicePinSchema.validate(req.body);

    if (validate.error) {
      throw createHttpError.BadRequest(validate.error.message);
    }

    let { refreshToken, pin, deviceId } = req.body;

    //Use Body Schema Here//

    let resBody = await userServices.verifyDevicePin(
      refreshToken,
      pin,
      deviceId
    );

    return res
      .status(200)
      .send(dataResponse("Device has been verified successfully", resBody));
  },
  async logout(req, res, next) {
    let { deviceId, refreshToken, notificationId } = req.body;

    let userId = req.user;

    await userServices.logout(userId, deviceId, refreshToken, notificationId);

    return res
      .status(200)
      .send(dataResponse("User has been logged out successfully", {}));
  },
  // ----------------- verify password -----------------
  async verifyPassword(req, res, next) {
    let { pin } = req.body;

    let userId = req.user;

    await userServices.verifyPassword(userId, pin);

    return res
      .status(200)
      .send(dataResponse("Password has been verified successfully", {}));
  },
  async refreshTokenCall(req, res, next) {
    let validate = refreshTokenSchema.validate(req.body);

    if (validate.error) {
      throw createHttpError.BadRequest(validate.error.message);
    }
    let { refreshToken } = req.body;

    let userId = req.user;
    let companyId = req.company;

    let resBody = await userServices.refreshToken(
      refreshToken,
      userId,
      companyId
    );

    return res
      .status(200)
      .send(dataResponse("Token has been refreshed successfully", resBody));
  },
  //Admin Panel
  async createUserByAdmin(req, res) {
    let { email, name, pin, address, dateOfBirth, phone } = req.body;

    let user = await userServices.createUserByAdmin({
      email,
      name,
      pin,
      address,
      dateOfBirth,
      phone,
    });

    return res
      .status(200)
      .send(dataResponse("User has been added successfully", { user }));
  },

  async deleteUserByAdmin(req, res) {
    let userId = req.params.id;

    let user = await userServices.deleteUserByAdmin(userId);

    return res
      .status(200)
      .send(dataResponse("User has been deleted successfully", { user }));
  },

  async getSpecificUser(req, res) {
    const { id } = req.params;

    // Find the user(s) matching the query
    let user = await userServices.getSpecificUser(id);

    // Respond with the found user(s)
    return res
      .status(200)
      .send(dataResponse("User has been successfully fetched", { user }));
  },

  async updateUserByAdmin(req, res) {
    let userId = req.params.id;
    let updatedUser = req.body;
    let locked = updatedUser.locked;
    if (locked) {
      updatedUser.adminLocked = locked;
    }
    if (locked === false) {
      updatedUser.adminLocked = false;
    }
    let user = await userServices.updateUserByAdmin(userId, updatedUser);

    return res
      .status(200)
      .send(dataResponse("User has been updated successfully", { user }));
  },

  async getTemporaryUser(req, res) {
    let { id } = req.params;

    let user = await userServices.getTemporaryUser(id);

    return res
      .status(200)
      .send(
        dataResponse("Temporary User has been fetched successfully", { user })
      );
  },

  async loginAdmin(req, res, next) {
    let { email, password } = req.body;

    let resBody = await userServices.loginAdmin(email, password);

    return res
      .status(200)
      .send(dataResponse("Admin has been logged in successfully", resBody));
  },

  async addSignature(req, res, next) {
    let userId = req.user;
    let signature = req.fileUrl;

    let signatureAdded = await userServices.addSignature(userId, signature);

    return res.status(200).send(
      dataResponse("Signature has been added successfully", {
        signature: signatureAdded,
      })
    );
  },

  async getSignature(req, res, next) {
    let userId = req.params.id;

    let signature = await userServices.getSignature(userId);

    return res
      .status(200)
      .send(
        dataResponse("Signature has been fetched successfully", { signature })
      );
  },
  async verifyExistingEmailOrPhone(req, res, next) {
    let { email = null, phone = null } = req.body;
    let resBody = await userServices.verifyExistingEmailOrPhone(email, phone);

    return res
      .status(200)
      .send(dataResponse(`User exist against this ${email ? "email" : "phone"}`, resBody));
  },
  async startMitIdAuthFlow(req, res, next) {
    const email = req.query.email;
    // const createPasswordToken = req.query.password_token; // New: Get password_token if provided
    const clientType = req.query.client_type || 'mobile'; // New: Default to mobile
    if (!email) {
      return res.status(400).send("Email is required in query params.");
    }

    // Store the email in the session before starting the OIDC flow
    req.session.emailToVerify = email;
    req.session.clientType = clientType; // Store client type if needed
    // req.session.createPasswordToken = createPasswordToken; // Store password token if provided
    // console.log("Stored email in session:", email);
    // Redirect to the actual login endpoint which uses the middleware
    res.redirect('/user/auth/mitid/login');
  },
  async handleMitIdCallbackSuccess(req, res) {
    try {
      const email = req.session.emailToVerify;
      const userInfo = req.claims;
      let clientType = req.session.clientType;

      // console.log("MitID Callback Success for email:", email, "with claims:", userInfo);

      const user = await User.findOneAndUpdate(
        { email },
        { mitIdVerified: true, mitIdData: userInfo },
        { new: true }
      );

      if (!user) {
        console.error("MitID success, but user not found in DB for email:", email);
        delete req.session.emailToVerify;
        delete req.session.clientType;

        // Detect client type if missing
        if (!clientType) {
          const userAgent = req.headers['user-agent'] || '';
          clientType = userAgent.includes('Mobi') ? 'mobile' : 'web';
        }

        const redirectUrl =
          clientType === 'web'
            ? `${process.env.FRONTEND_URL}/profileverified?error=user_not_found`
            : `myapp://mitid/verified?status=failed&reason=user_not_found`;

        // ❌ REMOVE expressRedirect.logout(req, res)
        // ✅ Just destroy session if needed:
        req.session.destroy(() => res.redirect(redirectUrl));
        return;
      }

      // Success path
      delete req.session.clientType;
      delete req.session.emailToVerify;

      const redirectUrl =
        clientType === 'web'
          ? `${process.env.FRONTEND_URL}/profileverified`
          : `myapp://mitid/verified?status=success`;

      req.session.destroy(() => res.redirect(redirectUrl));
    } catch (err) {
      console.error("Error during final success handler/DB update:", err);
      res.redirect(`myapp://mitid/verified?status=failed&reason=db_error`);
    }
  },

  async handleMitIdCallbackError(req, res) {
    try {
      const error = req.query.error || 'general_error';
      const errorDescription = req.query.error_description || 'Authentication failed or timed out.';

      console.error(`Criipto Auth Error: ${error} - ${errorDescription}`);

      let clientType = req.session.clientType || null;

      // Determine client type if not stored in session
      if (!clientType) {
        const userAgent = req.headers['user-agent'] || '';
        clientType = userAgent.includes('Mobi') ? 'mobile' : 'web';
      }

      // Clean up session data
      delete req.session.emailToVerify;
      delete req.session.clientType;

      // Prepare redirect URLs
      const redirectUrl =
        clientType === 'web'
          ? `${process.env.FRONTEND_URL}/profileverified?error=${encodeURIComponent(errorDescription)}`
          : `myapp://mitid/verified?status=failed&reason=${encodeURIComponent(errorDescription)}`;

      // ✅ Do NOT call expressRedirect.logout(req, res) directly
      // Instead, just destroy the session and redirect manually
      req.session.destroy(() => {
        res.redirect(redirectUrl);
      });
    } catch (err) {
      console.error("Unexpected error in handleMitIdCallbackError:", err);
      res.redirect(`myapp://mitid/verified?status=failed&reason=internal_error`);
    }
  },
  async handleBlockedByAdmin(req, res) {
    const { email = "" } = req.body;
    if (!email) {
      return res.status(400).send(dataResponse("Email is required", {}));
    }
    const user = await userServices.getUserByEmail(email.toLowerCase());
    if (user && user.adminLocked) {
      return res.status(200).send(dataResponse("User is blocked by admin", { blocked: true }));
    } else {
      return res.status(200).send(dataResponse("User is not blocked by admin", { blocked: false }));
    }
  }

};



module.exports = userController;
