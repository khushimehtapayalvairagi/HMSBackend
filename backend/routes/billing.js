const express = require('express');
const router = express.Router();
const billing = require('../controllers/billing');

router.post('/bills', billing.createBill);
router.get('/bills/:id', billing.getBillById);
router.get('/bills/patient/:patientId', billing.getBillsByPatient);

router.post('/payments', billing.addPaymentToBill);
router.get('/payments/:billId', billing.getPaymentsForBill);

module.exports = router;
