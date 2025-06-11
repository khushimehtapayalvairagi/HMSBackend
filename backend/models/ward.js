const mongoose = require('mongoose');

const WardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 }
});

module.exports = mongoose.model('Ward', WardSchema);
