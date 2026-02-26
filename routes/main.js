const express = require("express");
const userRouter = require("./user");
const companyRouter = require("./company");
const adminRouter = require("./admin");
const {
  invalidPathHandler,
  errorResponder,
  assignHTTPError,
} = require("../middleware/error.middleware");
const midItSignatureRouter = require("./midItSignature");
const generalRouter = require("./general");
const paymentRouter = require("./payment");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("e-fuldmagt backend server");
});

router.use("/user", userRouter);
router.use("/company", companyRouter);
router.use("/admin", adminRouter);
router.use("/general", generalRouter);
router.use("/payment", paymentRouter);
router.use("/midItSignature", midItSignatureRouter);
router.use(assignHTTPError);
router.use(errorResponder);
router.use(invalidPathHandler);

module.exports = router;
