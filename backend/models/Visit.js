const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
    patientId: { type: String, required: true }, 
    visitType: { type: String, enum: ['OPD', 'IPD_Referral', 'IPD_Admission'], required: true },
    assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required:true },
    visitDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Registered', 'Waiting', 'Declined','Completed'], default: 'Registered' },
    declineReason: { type: String },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPartner' }
}, { timestamps: true });

module.exports = mongoose.model('Visit', VisitSchema);
