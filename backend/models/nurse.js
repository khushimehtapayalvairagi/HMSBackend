const mongoose = require('mongoose');

const NurseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedWard: { type: String },
    contact: { type: String }
});

module.exports = mongoose.model('Nurse', NurseSchema);
