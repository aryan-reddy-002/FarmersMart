const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapasync");
const orderController = require("../controllers/orderController");



router.post("/checkout", wrapAsync(orderController.checkout));

router.get("/:id", wrapAsync(orderController.showOrder));

router.get("/verify/:id/:token", wrapAsync(orderController.verifyOrder));

module.exports = router;