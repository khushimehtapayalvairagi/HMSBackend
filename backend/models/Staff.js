const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contactNumber: { type: String, required: true, unique:true },
    designation: { type: String, enum: ['Head Nurse', 'Assistant Doctor', 'Receptionist','Inventory Manager', 'Other'], required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true }   

});

module.exports = mongoose.model('Staff', StaffSchema);
