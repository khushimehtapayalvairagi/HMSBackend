const express = require('express');
const router = express.Router();
const billing = require('../controllers/billing');
 const {getAllManualChargeItemsHandler}= require("../controllers/admin")
router.post('/bills', billing.createBill);
router.get('/bills/:id', billing.getBillById);
router.get('/bills/patient/:patientId', billing.getBillsByPatient);

router.post('/payments', billing.addPaymentToBill);
router.get('/payments/:billId', billing.getPaymentsForBill);
router.get('/manual-charge-items', getAllManualChargeItemsHandler);
module.exports = router;
