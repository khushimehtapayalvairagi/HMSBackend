const OPDConsultation = require('../models/OPDConsultation');
const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const {  getIO } = require('../utils/sockets');
const mongoose = require('mongoose');


const createOPDConsultationHandler = async (req, res) => {
    try {
        const {
            visitId,
            patientId,
            doctorId,
            chiefComplaint,
            diagnosis,
            doctorNotes,
            admissionAdvice,
            labInvestigationsSuggested,
            medicinesPrescribedText,
            transcribedFromPaperNotes,
            transcribedByUserId
        } = req.body;

        
        if (!visitId || !patientId || !doctorId || !chiefComplaint) {
            return res.status(400).json({ message: 'visitId, patientId, doctorId, and chiefComplaint are required.' });
        }

       
        const visit = await Visit.findById(visitId);
        if (!visit) return res.status(404).json({ message: 'Visit not found.' });

       
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    
        const consultation = new OPDConsultation({
            visitId,
            patientId,
            doctorId,
            chiefComplaint,
            diagnosis,
            doctorNotes,
            admissionAdvice: admissionAdvice || false,
            labInvestigationsSuggested: labInvestigationsSuggested || [],
            medicinesPrescribedText,
            transcribedFromPaperNotes: transcribedFromPaperNotes || false,
            transcribedByUserId: transcribedFromPaperNotes ? transcribedByUserId : undefined
        });

        await consultation.save();
       
        visit.status = 'Completed';
        await visit.save();

        if (consultation.admissionAdvice === true) {
        getIO().to('receptionist_room').emit('newIPDAdmissionAdvice', {
            patientId: consultation.patientId,
            visitId: consultation.visitId,
            admittingDoctorId: doctorId,

            doctorId: consultation.doctorId,
            chiefComplaint: consultation.chiefComplaint
        });
        }

        res.status(201).json({ message: 'OPD Consultation saved and visit marked as completed.', consultation });
    } catch (error) {
        console.error('OPD Consultation Creation Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getPatientOPDConsultationsHandler = async (req, res) => {
    try {
        const { patientId } = req.params;

        const consultations = await OPDConsultation.find({ patientId })
            .sort({ consultationDateTime: -1 })
            .populate({
                path: 'doctorId',
                populate: { path: 'userId', select: 'name email' }
            })
            .populate({
                path: 'transcribedByUserId',
                select: 'name email'
            });
            

            
        res.status(200).json({ consultations });
    } catch (error) {
        console.error('Fetch OPD Consultations Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getAssignedVisitsForDoctorHandler = async (req, res) => {
   
    try {

     const { doctorId } = req.params;
         console.log('Doctor ID:', doctorId);


        const visits = await Visit.find({ 
             assignedDoctorId: new mongoose.Types.ObjectId(doctorId) 
            
        })
        .populate('patientDbId')
        .populate({
            path: 'referredBy',
            select: 'name contact_person contact_number'
        })
        .sort({ visitDate: -1 });
  console.log('Visits:', visits);
        res.status(200).json({ visits });
    } catch (error) {
        console.error('Fetch Doctor Visits Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


module.exports = {createOPDConsultationHandler,getPatientOPDConsultationsHandler,getAssignedVisitsForDoctorHandler};