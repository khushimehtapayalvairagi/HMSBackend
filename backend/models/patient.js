const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String },
    address: { type: String },
    status: { type: String, enum: ['admitted', 'discharged', 'outpatient'], default: 'outpatient' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
