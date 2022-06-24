const express = require("express");
const router = express.Router();

const adminRouter = require("./modules/admin");
const userRouter = require("./modules/user");

router.use("/v1/admin", adminRouter);
router.use("/v1/users", userRouter);

module.exports = router;
