const express = require("express");
const {registerHandler}= require("../controllers/admin")
const router = express.Router();

router.post('/register', registerHandler);
// router.post('/appointments', bookAppointmentHandler);
// router.put('/appointments/:id', updateAppointmentHandler);
// router.delete('/appointments/:id', cancelAppointmentHandler);
// router.post('/invoices', receptionistGenerateInvoiceHandler);

module.exports = router;