const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const ReferralPartner = require('../models/ReferralPartner');
const Doctor = require('../models/Doctor');

const Specialty = require('../models/Specialty');
const {  getIO } = require('../utils/sockets');


const generatePatientId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `HSP${year}${month}${day}${hours}${minutes}${seconds}`;
};

const registerPatientHandler = async (req, res) => {
    try {
        const { fullName, dob, gender, contactNumber, email, address, relatives } = req.body;

        if (!fullName || !dob || !gender || !contactNumber || !address || !relatives || !email) {
            return res.status(400).json({ message: 'Required fields are missing.' });
        }

        if (relatives && relatives.length > 3) {
            return res.status(400).json({ message: 'Maximum of 3 relatives allowed.' });
        }

        const patientId =  generatePatientId();

        const patient = new Patient({
            patientId,
            fullName,
            dob,
            gender,
            contactNumber,
            email,
            address,
            relatives
        });

        await patient.save();

        res.status(201).json({ message: 'Patient registered successfully.', patient });
    } catch (error) {
        console.error('Register Patient Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getAllPatientsHandler = async (req, res) => {
    try {
        const patients = await Patient.find();
        res.status(200).json({ patients });
    } catch (error) {
        console.error('Fetch Patients Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getPatientByIdHandler = async (req, res) => {
    try {
        const { id } = req.params;
      
        const patient = await Patient.findOne({ patientId: id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        res.status(200).json({ patient });
    } catch (error) {
        console.error('Fetch Patient By patientId Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getAvailableDoctorsHandler = async (req, res) => {
  try {
    const { specialtyName, dayOfWeek } = req.body;
    if (!specialtyName || !dayOfWeek) {
      return res.status(400).json({ message: 'specialtyName and dayOfWeek are required in the body.' });
    }

    const specialty = await Specialty.findOne({ name: specialtyName.trim() });
    if (!specialty) {
      return res.status(404).json({ message: `Specialty '${specialtyName}' not found.` });
    }

    const doctors = await Doctor.find({
      specialty: specialty._id,
      schedule: {
        $elemMatch: {
          dayOfWeek,
          isAvailable: true,
        },
      },
    }).populate('userId', 'name email');

    res.status(200).json({ doctors });
  } catch (error) {
    console.error('Fetch Doctors Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};


const createVisitHandler = async (req, res) => {
    try {
        const { patientId, visitType, referredBy, assignedDoctorId, payment } = req.body;

        if (!patientId || !visitType || !assignedDoctorId) {
            return res.status(400).json({ message: 'patientId, visitType, and assignedDoctorId are required.' });
        }

      
        if (visitType === 'OPD') {
            if (!payment || typeof payment.amount !== 'number' || payment.amount <= 0 || payment.isPaid !== true) {
                return res.status(400).json({ message: 'Valid payment details are required for OPD visits and payment must be marked as paid.' });
            }
        }

        const patient = await Patient.findOne({ patientId: patientId.trim() });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        let referralPartnerId = null;

       
        if (visitType === 'IPD_Referral') {
            if (!referredBy) {
                return res.status(400).json({ message: 'Referral Partner is required for IPD_Referral visits.' });
            }

            const referralPartner = await ReferralPartner.findOne({ name: referredBy.trim() });
            if (!referralPartner) {
                return res.status(404).json({ message: `Referral Partner '${referredBy}' not found.` });
            }

            referralPartnerId = referralPartner._id;
        }

       
        if ((visitType === 'OPD' || visitType === 'IPD_Admission') && referredBy) {
            const referralPartner = await ReferralPartner.findOne({ name: referredBy.trim() });
            if (!referralPartner) {
                return res.status(404).json({ message: `Referral Partner '${referredBy}' not found.` });
            }

            referralPartnerId = referralPartner._id;
        }

       
        const doctor = await Doctor.findById(assignedDoctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Assigned doctor not found.' });
        }
        // console.log(doctor);
        console.log(patient);
      
        const newVisit = new Visit({
            patientId: patient.patientId, 
            patientDbId: patient._id,    
            visitType,
            referredBy: referralPartnerId,
           assignedDoctorId:  doctor.userId,

            payment: visitType === 'OPD' ? payment : undefined
        });

        await newVisit.save();
console.log('Saved Visit:', newVisit);
       getIO().to(`doctor_${newVisit.assignedDoctorId}`).emit('newAssignedPatient', {
            visitId: newVisit._id,
            patientId: newVisit.patientId,
            visitType: newVisit.visitType,
              
       
        });
console.log(`Emitting newAssignedPatient event to doctor_${newVisit.assignedDoctorId}`)
    
        res.status(201).json({ message: 'Visit created successfully.', visit: newVisit });
    } catch (error) {
        console.error('Create Visit Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getVisitsByPatientHandler = async (req, res) => {
    try {
        const { patientId } = req.params;

        const visits = await Visit.find({ patientId: patientId })
            .sort({ visitDate: -1 })
          
            .populate({
                path: 'assignedDoctorId',
                populate: { path: 'userId', select: 'name email' }
            })
            .populate({
                path: 'referredBy',
                select: 'name contact_person contact_number' 
            });

        res.status(200).json({ visits });
    } catch (error) {
        console.error('Fetch Visits Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const updateVisitStatusHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { newStatus, declineReason } = req.body;

        const allowedStatuses = ['Waiting', 'Declined', 'Completed'];

        if (!newStatus || !allowedStatuses.includes(newStatus)) {
            return res.status(400).json({ message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}` });
        }

        if (newStatus === 'Declined' && (!declineReason || declineReason.trim() === '')) {
            return res.status(400).json({ message: 'declineReason is required when visit is declined.' });
        }

        const visit = await Visit.findById(id);
        if (!visit) {
            return res.status(404).json({ message: 'Visit not found.' });
        }

        visit.status = newStatus;

        if (newStatus === 'Declined') {
            visit.declineReason = declineReason.trim();
        } else {
            visit.declineReason = undefined;
        }

       
  



        await visit.save();
        if (newStatus === 'Waiting') {
  getIO().to(`doctor_${visit.assignedDoctorId}`).emit('newAssignedPatient', {
    doctorId: visit.assignedDoctorId,
    visitId: visit._id,
    patientName: visit.patientDbId?.fullName || 'New patient',
  });
}

        res.status(200).json({ message: 'Visit status updated successfully.', visit });
    } catch (error) {
        console.error('Update Visit Status Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};



module.exports = {registerPatientHandler,getAllPatientsHandler,getPatientByIdHandler,createVisitHandler,getVisitsByPatientHandler
                ,updateVisitStatusHandler,getAvailableDoctorsHandler}