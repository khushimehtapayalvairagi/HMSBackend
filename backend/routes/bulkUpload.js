const express = require('express');
const multer = require('multer');
const {bulkUploadSpeciality,bulkUploadDepartment} = require('../controllers/bulkUpload');

const router = express.Router();
const upload = multer({ dest: '/tmp/uploads' }); 

router.post('/speciality', upload.single('file'),bulkUploadSpeciality);

router.post('/department', upload.single('file'), bulkUploadDepartment);

module.exports = router;
