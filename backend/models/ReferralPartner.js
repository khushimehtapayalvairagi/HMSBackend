const mongoose = require('mongoose');

const ReferralPartnerSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ReferralPartner', ReferralPartnerSchema);
