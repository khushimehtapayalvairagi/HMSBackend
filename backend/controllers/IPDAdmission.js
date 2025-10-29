const mongoose = require('mongoose');

const IPDAdmission = require('../models/IPDAdmission');
const DailyProgressReport = require('../models/DailyProgressReport');
const Ward = require('../models/Ward');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const Bill = require('../models/Bill');

exports.createIPDAdmission = async (req, res) => {
  console.log("📥 Incoming IPD Admission Payload:", req.body);

  try {
    const {
      patientId,
      wardId,
      bedNumber,
      roomCategoryId,
      admittingDoctorId,
      expectedDischargeDate,
    } = req.body;

    // --- 1. Validate required fields ---
    if (!patientId || !wardId || !bedNumber || !roomCategoryId || !admittingDoctorId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // --- 2. Check that doctorId is a valid ObjectId ---
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(admittingDoctorId)) {
      return res.status(400).json({
        message: `Invalid Doctor ID format: ${admittingDoctorId}`,
      });
    }

    // --- 3. Debug: verify doctor actually exists in DB ---
    const doctorDoc = await Doctor.findById(admittingDoctorId).lean();
    if (!doctorDoc) {
      const totalDoctors = await Doctor.countDocuments();
      const sampleDoctors = await Doctor.find({}, { _id: 1, userId: 1 }).limit(5);
      console.error("❌ Doctor not found for ID:", admittingDoctorId);
      console.log("🩺 Total doctors in DB:", totalDoctors);
      console.log("🩺 Sample doctor IDs:", sampleDoctors);
      return res.status(404).json({
        message: "Doctor not found in database.",
        doctorId: admittingDoctorId,
        sampleDoctorIds: sampleDoctors,
      });
    }

    // --- 4. Fetch patient and ward ---
    const [patient, ward] = await Promise.all([
      Patient.findById(patientId),
      Ward.findById(wardId),
    ]);

    if (!patient || !ward) {
      return res.status(404).json({
        message: "Invalid patient or ward reference.",
        patientFound: !!patient,
        wardFound: !!ward,
      });
    }

    // --- 5. Prevent duplicate active admissions ---
    const existingAdmission = await IPDAdmission.findOne({
      patientId,
      status: "Admitted",
    });
    if (existingAdmission) {
      return res.status(400).json({
        message: "Patient is already admitted and cannot be admitted again.",
      });
    }

    // --- 6. Verify bed availability ---
    const bed = ward.beds.find((b) => b.bedNumber === bedNumber);
    if (!bed) {
      return res.status(400).json({ message: "Bed not found in this ward." });
    }
    if (bed.status !== "available") {
      return res.status(400).json({ message: "Bed already occupied." });
    }

    bed.status = "occupied";
    await ward.save();

    // --- 7. Create Admission ---
    const admission = await IPDAdmission.create({
      patientId,
      wardId,
      bedNumber,
      roomCategoryId,
      admittingDoctorId,
      expectedDischargeDate,
      status: "Admitted",
    });

    patient.status = "Active";
    await patient.save();

    return res.status(201).json({
      message: "IPD Admission successful.",
      admission,
    });
  } catch (error) {
    console.error("❌ IPD Admission Error:", error);
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};




exports.getIPDAdmissionsByPatient = async (req, res) => {

    try {
        const { patientId } = req.params;
        const admissions = await IPDAdmission.find({ patientId })
       .populate('patientId', 'patientId fullName')

        // .populate('visitId')  
            .populate( 'wardId roomCategoryId')
            .populate({
    path: 'admittingDoctorId',
    populate: { path: 'userId', select: 'name' }
  });
        res.status(200).json({ admissions });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};




exports.dischargeIPDAdmission = async (req, res) => {

  try {
    const { id } = req.params;

    const admission = await IPDAdmission.findById(id);
    if (!admission) return res.status(404).json({ message: 'Admission not found.' });

    const unpaidBills = await Bill.find({
      ipd_admission_id_ref: admission._id,
      payment_status: { $ne: 'Paid' }
    });
    
    if (unpaidBills.length > 0) {
      return res.status(400).json({ message: 'Cannot discharge patient: unpaid bills exist.' });
    }

    const ward = await Ward.findById(admission.wardId);
    if (ward) {
      const bed = ward.beds.find(b => b.bedNumber === admission.bedNumber);
      if (bed) {
        bed.status = 'available';
        await ward.save();
      }
    }

    admission.status = 'Discharged';
    admission.actualDischargeDate = new Date();
    await admission.save();

    await Patient.findByIdAndUpdate(admission.patientId, { status: 'Discharged' });

    res.status(200).json({ message: 'Patient discharged successfully.' });
  } catch (error) {
    console.error('Discharge Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};



// exports.dischargeIPDAdmission = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const admission = await IPDAdmission.findById(id);
//         if (!admission) return res.status(404).json({ message: 'Admission not found.' });

//         const ward = await Ward.findById(admission.wardId);
//         if (ward) {
//             const bed = ward.beds.find(b => b.bedNumber === admission.bedNumber);
//             if (bed) {
//                 bed.status = 'available';
//                 await ward.save();
//             }
//         }

//         admission.status = 'Discharged';
//         admission.actualDischargeDate = new Date();

//         await admission.save();
//         console.log('✅ After save:', admission.status);

//         await Patient.findByIdAndUpdate(admission.patientId, { status: 'Discharged' });

//         res.status(200).json({ message: 'Patient discharged successfully.' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error.' });
//     }
// };


exports.createDailyProgressReport = async (req, res) => {
    try {
        const { ipdAdmissionId, recordedByUserId, vitals, nurseNotes, treatmentsAdministeredText, medicineConsumptionText } = req.body;

        if (!ipdAdmissionId || !recordedByUserId) {
            return res.status(400).json({ message: 'ipdAdmissionId and recordedByUserId are required.' });
        }

        const report = new DailyProgressReport({
            ipdAdmissionId,
            recordedByUserId,
            vitals,
            nurseNotes,
            treatmentsAdministeredText,
            medicineConsumptionText
        });

        await report.save();

        res.status(201).json({ message: 'Daily report saved.', report });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.getDailyReportsByAdmission = async (req, res) => {
    try {
        const { ipdAdmissionId } = req.params;

        const reports = await DailyProgressReport.find({ ipdAdmissionId })
           .populate({
  path: 'recordedByUserId',
  populate: {
    path: 'userId',
    select: 'name role'
  }
})

            .sort({ reportDateTime: -1 });
console.log("Fetched reports with populated recordedByUserId:", JSON.stringify(reports, null, 2));
        res.status(200).json({ reports });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};
