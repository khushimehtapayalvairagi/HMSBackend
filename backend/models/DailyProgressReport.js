const mongoose = require('mongoose');

const DailyProgressReportSchema = new mongoose.Schema({
    ipdAdmissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission', required: true },
    reportDateTime: { type: Date, default: Date.now },
    recordedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    vitals: {
        temperature: Number,
        pulse: Number,
        bp: String,
        respiratoryRate: Number
    },
    nurseNotes: String,
    treatmentsAdministeredText: String,
    medicineConsumptionText: String
}, { timestamps: true });

module.exports = mongoose.model('DailyProgressReport', DailyProgressReportSchema);
