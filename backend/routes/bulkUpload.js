const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  bulkUploadSpeciality,
  bulkUploadDepartment,
  bulkUploadDoctors,
  bulkUploadStaff,
  bulkUploadLabourRooms,
  bulkUploadRoomCategories,
  bulkUploadWards,
  bulkUploadProcedures,
  bulkUploadManualChargeItemsHandler,
  bulkUploadReferralPartnersHandler,
    bulkUploadOperationTheatersHandler,
    bulkUploadInventory
} = require('../controllers/bulkUpload');


const router = express.Router();
// const upload = multer({ dest: '/tmp/uploads' }); 
const uploadFolder = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream"
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only Excel files are allowed!"));
};


const upload = multer({ storage, fileFilter });
router.post('/speciality', upload.single('file'),bulkUploadSpeciality);
router.post('/department', upload.single('file'), bulkUploadDepartment);
router.post("/doctors", upload.single("file"), bulkUploadDoctors);
router.post("/staff", upload.single("file"), bulkUploadStaff);
router.post("/labour-rooms/bulk", upload.single("file"), bulkUploadLabourRooms);
router.post("/room-category", upload.single("file"), bulkUploadRoomCategories);
router.post("/wards/bulk", upload.single("file"), bulkUploadWards);
router.post("/procedure/bulk", upload.single("file"), bulkUploadProcedures);
router.post('/manual-charge-item/bulk', upload.single('file'), bulkUploadManualChargeItemsHandler);
router.post('/referral/bulk', upload.single('file'), bulkUploadReferralPartnersHandler);
router.post(
  "/operation-theater/bulk",
  upload.single("file"),
  bulkUploadOperationTheatersHandler
);
router.post("/bulk-upload/item", upload.single("file"), bulkUploadInventory);
module.exports = router;
