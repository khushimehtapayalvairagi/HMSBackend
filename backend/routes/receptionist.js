const express = require("express");
const {registerPatientHandler,getAllPatientsHandler,getPatientByIdHandler,createVisitHandler,getVisitsByPatientHandler
        ,updateVisitStatusHandler,getAvailableDoctorsHandler}= require("../controllers/receptionist")
const router = express.Router();

router.post('/patients', registerPatientHandler);
router.get('/patients', getAllPatientsHandler);
router.get('/patients/:id', getPatientByIdHandler);

router.get('/doctors', getAvailableDoctorsHandler);
router.post('/visits',  createVisitHandler);
router.get('/visits/:patientId',  getVisitsByPatientHandler);

router.put('/visits/status/:id', updateVisitStatusHandler);


module.exports = router;