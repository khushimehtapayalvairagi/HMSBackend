const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    specialization: { type: String, required: true },
    department: { type: String },
    contact: { type: String }
});

module.exports = mongoose.model('Doctor', DoctorSchema);
