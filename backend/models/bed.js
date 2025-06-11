const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    status: { type: String, enum: ['available', 'occupied', 'cleaning'], default: 'available' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null }
});

module.exports = mongoose.model('Bed', BedSchema);
