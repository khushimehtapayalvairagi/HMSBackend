const express = require("express");
const {registerHandler}  = require("../controllers/admin")

const router = express.Router();

router.post('/register', registerHandler);
// router.post('/invoices', generateInvoiceHandler);

module.exports = router;