const express = require("express");

const router = express.Router();

router.post('/patients', registerPatientHandler);
router.post('/appointments', bookAppointmentHandler);
router.put('/appointments/:id', updateAppointmentHandler);
router.delete('/appointments/:id', cancelAppointmentHandler);
router.post('/invoices', receptionistGenerateInvoiceHandler);

module.exports = router;