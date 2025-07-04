const mongoose = require('mongoose');

const LabourRoomDetailSchema = new mongoose.Schema({
    procedureScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProcedureSchedule', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    babyName: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dobBaby: { type: Date, required: true },
    timeOfBirth: { type: String, required: true },
    weight: { type: String },
    deliveryType: { type: String, enum: ['Normal', 'C-section'], required: true },
    capturedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('LabourRoomDetail', LabourRoomDetailSchema);
