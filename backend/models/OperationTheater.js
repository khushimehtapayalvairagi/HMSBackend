const mongoose = require('mongoose');

const OperationTheaterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Example: OT1, OT2
    status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' }
}, { timestamps: true });

module.exports = mongoose.model('OperationTheater', OperationTheaterSchema);
