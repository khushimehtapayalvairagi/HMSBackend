const mongoose = require('mongoose');

const ProcedureSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    cost: { type: Number, required: true }
});

module.exports = mongoose.model('Procedure', ProcedureSchema);
