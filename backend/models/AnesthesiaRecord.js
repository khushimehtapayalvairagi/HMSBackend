const mongoose = require('mongoose');

const AnesthesiaRecordSchema = new mongoose.Schema({
    procedureScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProcedureSchedule', required: true },
    anestheticId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    anesthesiaName: { type: String, required: true },
    anesthesiaType: { type: String, enum: ['General', 'Local', 'Epidural'], required: true },
    induceTime: { type: Date },
    endTime: { type: Date },
    medicinesUsedText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AnesthesiaRecord', AnesthesiaRecordSchema);
