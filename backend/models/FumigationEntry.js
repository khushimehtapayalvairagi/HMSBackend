const mongoose = require('mongoose');

const FumigationEntrySchema = new mongoose.Schema({
  otRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationTheater', required: true },
  date: { type: Date, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('FumigationEntry', FumigationEntrySchema);
