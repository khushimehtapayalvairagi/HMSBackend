const mongoose = require('mongoose');

const IPDAdmission = require('../models/IPDAdmission');
const DailyProgressReport = require('../models/DailyProgressReport');
const Ward = require('../models/Ward');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const Bill = require('../models/Bill');



exports.createIPDAdmission = async (req, res) => {

   console.log('📥 IPDAdmission payload:', req.body);

    try {
        const { patientId, wardId, bedNumber, roomCategoryId,  admittingDoctorId: userDoctorId, expectedDischargeDate } = req.body;

        if (!patientId  || !wardId || !bedNumber || !roomCategoryId || !userDoctorId) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const wardCheck = await Ward.findById(wardId);
        console.log('WardId from request:', wardId);
        console.log('Ward found in DB:', wardCheck);

          const existingAdmission = await IPDAdmission.findOne({ patientId, status: 'Admitted' });
    if (existingAdmission) {
      return res.status(400).json({ message: 'Patient is already admitted and cannot be admitted again.' });
    }

        const [patient,doctor, ward] = await Promise.all([
            Patient.findById(patientId),
            Doctor.findOne({_id:userDoctorId }),
            Ward.findById(wardId)
        ]);

  

   
 

    console.log({
      patientExists: !!patient,
      // visitExists: !!visit,
      doctorExists: !!doctor,
      wardExists: !!ward
    });


        if (!patient || !doctor || !ward) {
            return res.status(404).json({ message: 'Invalid reference: patient, visit, doctor, or ward not found.' });
        }

        const bed = ward.beds.find(b => b.bedNumber === bedNumber);
        if (!bed || bed.status !== 'available') {
            return res.status(400).json({ message: 'Bed is either not found or not available.' });
        }

        
        bed.status = 'occupied';
        await ward.save();

        const admission = new IPDAdmission({
           patientId,
            
            // visitId,
            wardId,
            bedNumber,
            roomCategoryId,
           admittingDoctorId: userDoctorId,
            expectedDischargeDate
        });

        await admission.save();

        patient.status = 'Active';
        await patient.save();

        res.status(201).json({ message: 'IPD Admission successful.', admission });
    } catch (error) {
        console.error('IPD Admission Error:', error);
        res.status(500).json({ message: 'Server error.' });
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
