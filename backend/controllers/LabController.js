// controllers/labController.js
const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');
const LabPayment = require('../models/LabPayment');
const Staff = require('../models/Staff');

const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../uploads/labReports');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const pending = await LabTest.countDocuments({ status: 'Pending' });
    const completed = await LabTest.countDocuments({ status: 'Completed' });
    res.json({ pending, completed });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all lab tests with patient info
exports.getLabTests = async (req, res) => {
  try {
    const tests = await LabTest.find().populate('patientId');
    res.json({ tests });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add test result
exports.addTestResult = async (req, res) => {
  try {
    const { patientId, testType, date,  result } = req.body;
    const test = new LabTest({
      patientId,
      testType,
      date,
       result, 
      status: 'Pending'   // always pending first
    });
    await test.save();
    res.status(201).json({ message: 'Lab test saved (Pending)', test });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Get appointments (simple: lab tests with future date)
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await LabTest.find({ date: { $gte: new Date() } }).populate('patientId');
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }


    const { testId, amount, paymentStatus } = req.body;
    const filePath = `/uploads/labReports/${req.file.filename}`;

const test = await LabTest.findByIdAndUpdate(
  testId,
  { reportFile: filePath, status: 'Completed', labTechnician: req.user._id }, // set logged in staff as technician
  { new: true }
)
  .populate('patientId')
  .populate({ path: 'labTechnician', populate: { path: 'userId', select: 'name' } });

const technicianName = test.labTechnician?.userId?.name || "Not Assigned";

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (amount) {
      await LabPayment.create({
        patientId: test.patientId,
        testId: test._id,
        amount,
        status: paymentStatus || 'Pending',
      });
    }

    res.json({ message: 'Report uploaded and payment created',  test,
  technicianName});
  } catch (err) {
    console.error("Upload report error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const payments = await LabPayment.find({ status: 'Pending' })
      .populate('patientId')
      .populate('testId');
    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark payment as Paid
exports.markPaymentPaid = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await LabPayment.findByIdAndUpdate(
      paymentId,
      { status: 'Paid', paymentDate: new Date() },
      { new: true }
    );

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.json({ message: 'Payment marked as Paid', payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};