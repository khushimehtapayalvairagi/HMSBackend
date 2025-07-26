const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorType: { type: String, enum: ['Consultant', 'On-roll'], required: true },
    specialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    medicalLicenseNumber: { type: String, required: true, unique: true },
    schedule: [{
        dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isAvailable: { type: Boolean, default: true }
    }]
});

module.exports = mongoose.model('Doctor', DoctorSchema);
