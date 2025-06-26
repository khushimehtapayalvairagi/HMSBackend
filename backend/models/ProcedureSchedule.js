const mongoose = require('mongoose');

const ProcedureScheduleSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    ipdAdmissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission' }, // optional
    procedureType: { type: String, enum: ['OT', 'Labour Room'], required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationTheater', required: true },
    scheduledDateTime: { type: Date, required: true },
    procedureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Procedure', required: true },
    surgeonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    assistantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Doctor or Staff
    anestheticId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], default: 'Scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('ProcedureSchedule', ProcedureScheduleSchema);
