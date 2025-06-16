const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const ReferralPartner = require('../models/ReferralPartner');

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
        const { specialtyName, dayOfWeek } = req.query;

        if (!specialtyName || !dayOfWeek) {
            return res.status(400).json({ message: 'specialtyName and dayOfWeek are required.' });
        }

       
        const specialty = await Specialty.findOne({ name: specialtyName.trim() });
        if (!specialty) {
            return res.status(404).json({ message: `Specialty '${specialtyName}' not found.` });
        }

        const doctors = await Doctor.find({
            specialty: specialty._id,
            schedule: { $elemMatch: { dayOfWeek, isAvailable: true } }
        }).populate('userId', 'name email');

        res.status(200).json({ doctors });
    } catch (error) {
        console.error('Fetch Doctors Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


const createVisitHandler = async (req, res) => {
    try {
        const { patientId, visitType, referredBy, assignedDoctorId} = req.body;

       
        if (!patientId || !visitType || !assignedDoctorId) {
            return res.status(400).json({ message: 'patientId, visitType, and assignedDoctorName are required.' });
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

        const newVisit = new Visit({
            patientId: patient.patientId,
            visitType,
            referredBy: referralPartnerId,
            assignedDoctorId: doctor._id
        });

        await newVisit.save();

        res.status(201).json({ message: 'Visit created successfully.', visit: newVisit });
    } catch (error) {
        console.error('Create Visit Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getVisitsByPatientHandler = async (req, res) => {
    try {
        const { patientId } = req.params;

        const visits = await Visit.find({ patientId:patientId }).sort({ visitDate: -1 });
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

        res.status(200).json({ message: 'Visit status updated successfully.', visit });
    } catch (error) {
        console.error('Update Visit Status Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


module.exports = {registerPatientHandler,getAllPatientsHandler,getPatientByIdHandler,createVisitHandler,getVisitsByPatientHandler
                ,updateVisitStatusHandler,getAvailableDoctorsHandler}