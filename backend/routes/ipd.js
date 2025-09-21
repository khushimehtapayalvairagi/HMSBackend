const express = require('express');
const router = express.Router();
const ipdController = require('../controllers/IPDAdmission');

router.post('/admissions', ipdController.createIPDAdmission);
router.get('/admissions/:patientDbId', ipdController.getIPDAdmissionsByPatient);
router.put('/admissions/:id/discharge', ipdController.dischargeIPDAdmission);
router.post('/reports', ipdController.createDailyProgressReport);
router.get('/reports/:ipdAdmissionId', ipdController.getDailyReportsByAdmission);

module.exports = router;
