const mongoose = require('mongoose');

const RelativeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    relationship: { type: String, required: true }
}, { _id: false });

const PatientSchema = new mongoose.Schema({
    patientId: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required:true },
    address: { type: String, required: true },
    relatives: { type: [RelativeSchema], validate: [relativesLimit, '{PATH} exceeds the limit of 3'], required:true },
    status: { type: String, enum: ['Inactive','Active', ], default: 'Inactive' }
}, { timestamps: true });

function relativesLimit(val) {
    return val.length <= 3;
}

module.exports = mongoose.model('Patient', PatientSchema);
