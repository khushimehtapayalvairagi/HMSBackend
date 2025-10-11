const mongoose = require('mongoose');

const LabPaymentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  paymentDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('LabPayment', LabPaymentSchema);
