const express = require("express");

const router = express.Router();

router.post('/doctors', registerDoctorHandler);
router.post('/nurses', registerNurseHandler);
router.post('/invoices', generateInvoiceHandler);

module.exports = router;