const express = require('express');
const multer = require('multer');
const { 
  bulkUploadSpeciality,
  bulkUploadDepartment,
  bulkUploadDoctors,
  bulkUploadStaff
} = require('../controllers/bulkUpload');


const router = express.Router();
const upload = multer({ dest: '/tmp/uploads' }); 

router.post('/speciality', upload.single('file'),bulkUploadSpeciality);
router.post('/department', upload.single('file'), bulkUploadDepartment);
router.post("/doctors", upload.single("file"), bulkUploadDoctors);
router.post("/staff", upload.single("file"), bulkUploadStaff);


module.exports = router;
