const mongoose = require('mongoose');

const StockTransactionSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    transactionType: { type: String, enum: ['In', 'Out'], required: true },
    quantity: { type: Number, required: true },
    dateTime: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StockTransaction', StockTransactionSchema);