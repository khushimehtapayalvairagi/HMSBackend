const mongoose = require('mongoose');

const LabourRoomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String }
});

module.exports = mongoose.model('LabourRoom', LabourRoomSchema);
