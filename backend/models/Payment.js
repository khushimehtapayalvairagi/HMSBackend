const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
  bill_id_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  payment_date: { type: Date, default: Date.now },
  amount_paid: { type: Number, required: true },
  payment_method: { type: String, enum: ['Cash', 'Card', 'UPI', 'External_Reference'], required: true },
  received_by_user_id_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);