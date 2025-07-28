const OPDConsultation = require('../models/OPDConsultation');
const Doctor = require('../models/Doctor');
const IPDAdmission = require('../models/IPDAdmission');
const Patient = require('../models/Patient');
const Department = require('../models/Department');
const AnesthesiaRecord = require('../models/AnesthesiaRecord');
const ProcedureSchedule = require('../models/ProcedureSchedule');
const FumigationEntry = require('../models/FumigationEntry');
const LabourRoomDetails = require('../models/LabourRoomDetail');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');



exports.getCentralOPDRegister = async (req, res) => {
  try {
    const { startDate, endDate, doctorId, departmentId } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.consultationDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (doctorId) {
      query.doctorId = doctorId;
    }

    if (departmentId) {
      const doctors = await Doctor.find({ department: departmentId }, '_id');
      const doctorIds = doctors.map(doc => doc._id);
      query.doctorId = { $in: doctorIds };
    }

    const consultations = await OPDConsultation.find(query)
      .populate({
        path: 'visitId',
        populate: [
          { path: 'assignedDoctorId', populate: { path: 'userId', select: 'name email' } },
          { path: 'referredBy', select: 'name contactNumber' }
        ]
      })
      .populate({
        path: 'patientId',
        select: 'patientId name age gender address phone status'
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'department', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      })
      .populate({
        path: 'transcribedByUserId',
        select: 'name role email'
      })
      .sort({ consultationDateTime: -1 });

    res.status(200).json({ consultations });
  } catch (error) {
    console.error('Central OPD Report Error:', error);
    res.status(500).json({ message: 'Server error while generating OPD register.' });
  }
};



exports.getDepartmentWiseOPDRegister = async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.consultationDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

  
    let doctorQuery = {};
    if (departmentId) {
      doctorQuery.department = departmentId;
    }
    const doctors = await Doctor.find(doctorQuery).select('_id department').populate('department');
    const doctorMap = {};
    const doctorIds = doctors.map(doc => {
      doctorMap[doc._id.toString()] = doc.department;
      return doc._id;
    });

    const consultations = await OPDConsultation.find({
      ...dateFilter,
      doctorId: { $in: doctorIds }
    })
      .populate({
        path: 'patientId',
        select: 'name age gender patientId'
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'department', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      })
      .sort({ consultationDateTime: -1 });

 
    const departmentGroups = {};
    consultations.forEach(c => {
      const deptName = c.doctorId?.department?.name || 'Unknown';
      if (!departmentGroups[deptName]) {
        departmentGroups[deptName] = [];
      }
      departmentGroups[deptName].push(c);
    });

    res.status(200).json({ departmentWiseRegister: departmentGroups });
  } catch (error) {
    console.error('Department-wise OPD Report Error:', error);
    res.status(500).json({ message: 'Server error while generating department-wise OPD register.' });
  }
};


exports.getNewVsOldOPDPatients = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const consultationsInRange = await OPDConsultation.find({
      consultationDateTime: { $gte: start, $lte: end }
    }).select('patientId consultationDateTime');

    const patientIds = [...new Set(consultationsInRange.map(c => c.patientId.toString()))];

    let newCount = 0;
    let oldCount = 0;

    for (const pid of patientIds) {
      const firstVisit = await OPDConsultation.findOne({ patientId: pid })
        .sort({ consultationDateTime: 1 })
        .select('consultationDateTime');

      if (!firstVisit) continue;

      if (firstVisit.consultationDateTime >= start && firstVisit.consultationDateTime <= end) {
        newCount++;
      } else {
        oldCount++;
      }
    }

    res.status(200).json({
      totalConsultations: consultationsInRange.length,
      uniquePatients: patientIds.length,
      newPatients: newCount,
      oldPatients: oldCount
    });
  } catch (error) {
    console.error('New vs Old OPD Patient Report Error:', error);
    res.status(500).json({ message: 'Server error while generating new vs old patient report.' });
  }
};



exports.getDoctorWiseOPDRegister = async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;

    const doctorFilter = {};
    if (departmentId) {
      doctorFilter.department = departmentId;
    }

    const doctors = await Doctor.find(doctorFilter)
      .populate('userId', 'name email')
      .populate('specialty', 'name')
      .populate('department', 'name');

    const start = startDate ? new Date(startDate) : new Date('2000-01-01');
    const end = endDate ? new Date(endDate) : new Date();

    const results = [];

    for (const doctor of doctors) {
      const consultations = await OPDConsultation.find({
        doctorId: doctor._id,
        consultationDateTime: { $gte: start, $lte: end }
      })
        .populate('patientId', 'name patientId')
        .select('consultationDateTime chiefComplaint diagnosis patientId');

      if (consultations.length > 0) {
        results.push({
          doctor: {
            _id: doctor._id,
            name: doctor.userId.name,
            specialty: doctor.specialty.name,
            department: doctor.department?.name || 'N/A'
          },
          totalConsultations: consultations.length,
          consultations
        });
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Doctor-wise OPD Report Error:', error);
    res.status(500).json({ message: 'Server error while generating doctor-wise OPD report.' });
  }
};


exports.getCentralIPDRegister = async (req, res) => {
  try {
    const { startDate, endDate, departmentId, doctorId } = req.query;

    const match = {};

    if (startDate || endDate) {
      match.admissionDate = {};
      if (startDate) match.admissionDate.$gte = new Date(startDate);
      if (endDate) match.admissionDate.$lte = new Date(endDate);
    }

    if (doctorId) {
      match.admittingDoctorId = doctorId;
    }

    if (departmentId) {
      // First get all doctors in the department
      const doctorsInDept = await Doctor.find({ department: departmentId }).select('_id');
      match.admittingDoctorId = { $in: doctorsInDept.map(doc => doc._id) };
    }

    const admissions = await IPDAdmission.find(match)
      .populate('patientId', 'name patientId')
      .populate({
        path: 'admittingDoctorId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'department', select: 'name' }
        ]
      })
      .populate('wardId', 'name')
      .populate('roomCategoryId', 'name')
      .sort({ admissionDate: -1 });

    const result = admissions.map(ad => ({
      _id: ad._id,
      admissionDate: ad.admissionDate,
      expectedDischargeDate: ad.expectedDischargeDate,
      actualDischargeDate: ad.actualDischargeDate,
      status: ad.status,
      bedNumber: ad.bedNumber,
      patient: ad.patientId,
      doctor: ad.admittingDoctorId
        ? {
            _id: ad.admittingDoctorId._id,
            name: ad.admittingDoctorId.userId?.name,
            department: ad.admittingDoctorId.department?.name
          }
        : null,
      ward: ad.wardId,
      roomCategory: ad.roomCategoryId
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Central IPD Register Error:', error);
    res.status(500).json({ message: 'Server error while generating Central IPD Register.' });
  }
};


exports.getDepartmentWiseIPDRegister = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    if (startDate || endDate) {
      match.admissionDate = {};
      if (startDate) match.admissionDate.$gte = new Date(startDate);
      if (endDate) match.admissionDate.$lte = new Date(endDate);
    }

    const admissions = await IPDAdmission.find(match)
      .populate('patientId', 'name patientId')
      .populate({
        path: 'admittingDoctorId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'department', select: 'name' }
        ]
      });

    const deptMap = {};

    for (const ad of admissions) {
      const dept = ad.admittingDoctorId?.department;
      const deptId = dept?._id?.toString();
      const deptName = dept?.name || 'Unknown';

      if (!deptMap[deptId]) {
        deptMap[deptId] = {
          department: deptName,
          departmentId: deptId,
          totalAdmissions: 0,
          admissions: []
        };
      }

      deptMap[deptId].totalAdmissions += 1;

      deptMap[deptId].admissions.push({
        _id: ad._id,
        admissionDate: ad.admissionDate,
        status: ad.status,
        bedNumber: ad.bedNumber,
        patient: ad.patientId,
        doctor: ad.admittingDoctorId
          ? {
              _id: ad.admittingDoctorId._id,
              name: ad.admittingDoctorId.userId?.name
            }
          : null
      });
    }

    res.status(200).json(Object.values(deptMap));
  } catch (error) {
    console.error('Department-wise IPD Register Error:', error);
    res.status(500).json({ message: 'Server error generating department-wise IPD register.' });
  }
};



exports.getOTProcedureRegister = async (req, res) => {
  try {
    const { startDate, endDate, status, surgeonId, departmentId } = req.query;

    const match = { procedureType: 'OT' };

    if (status) match.status = status;
    if (surgeonId) match.surgeonId = surgeonId;

    if (startDate || endDate) {
      match.scheduledDateTime = {};
      if (startDate) match.scheduledDateTime.$gte = new Date(startDate);
      if (endDate) match.scheduledDateTime.$lte = new Date(endDate);
    }

    const schedules = await ProcedureSchedule.find(match)
      .populate('procedureId', 'name cost')
      .populate('patientId', 'name patientId')
      .populate({
        path: 'surgeonId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'department', select: 'name' }
        ]
      });

    let result = schedules;

    if (departmentId) {
      result = schedules.filter(s =>
        s.surgeonId?.department?._id?.toString() === departmentId
      );
    }

    const formatted = result.map(s => ({
      _id: s._id,
      scheduledDateTime: s.scheduledDateTime,
      status: s.status,
      procedure: s.procedureId,
      patient: s.patientId,
      surgeon: s.surgeonId
        ? {
            _id: s.surgeonId._id,
            name: s.surgeonId.userId?.name
          }
        : null,
      department: s.surgeonId?.department
        ? {
            _id: s.surgeonId.department._id,
            name: s.surgeonId.department.name
          }
        : null
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('OT Procedure Register Error:', error);
    res.status(500).json({ message: 'Error generating OT procedure register.' });
  }
};



exports.getAnesthesiaRegister = async (req, res) => {
  try {
    const { startDate, endDate, anestheticId, procedureType } = req.query;

    const match = {};

    if (startDate || endDate) {
      match.induceTime = {};
      if (startDate) match.induceTime.$gte = new Date(startDate);
      if (endDate) match.induceTime.$lte = new Date(endDate);
    }

    if (anestheticId) match.anestheticId = anestheticId;

    const records = await AnesthesiaRecord.find(match)
      .populate({
        path: 'procedureScheduleId',
        populate: [
          { path: 'procedureId', select: 'name cost' },
          { path: 'patientId', select: 'name patientId' },
          { path: 'anestheticId', populate: { path: 'userId', select: 'name' } }
        ]
      });

    // Optional filter by procedureType ('OT' or 'Labour Room')
    const filtered = procedureType
      ? records.filter(
          rec => rec.procedureScheduleId?.procedureType === procedureType
        )
      : records;

    const result = filtered.map(rec => {
      const ps = rec.procedureScheduleId;

      return {
        _id: rec._id,
        anesthesiaName: rec.anesthesiaName,
        anesthesiaType: rec.anesthesiaType,
        induceTime: rec.induceTime,
        endTime: rec.endTime,
        procedureType: ps?.procedureType || null,
        scheduledDateTime: ps?.scheduledDateTime || null,
        procedure: ps?.procedureId || null,
        patient: ps?.patientId || null,
        anesthetist: ps?.anestheticId
          ? {
              _id: ps.anestheticId._id,
              name: ps.anestheticId.userId?.name
            }
          : null
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Anesthesia Register Error:', error);
    res.status(500).json({ message: 'Error generating anesthesia register.' });
  }
};


exports.getOTFumigationReport = async (req, res) => {
  try {
    const { startDate, endDate, otRoomId } = req.query;

    const match = {};

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    if (otRoomId) match.otRoomId = otRoomId;

    const entries = await FumigationEntry.find(match)
      .populate('otRoomId', 'name') 
      .populate('performedBy', 'name role');

    res.status(200).json(entries);
  } catch (error) {
    console.error('Fumigation Report Error:', error);
    res.status(500).json({ message: 'Error generating fumigation report.' });
  }
};



exports.getBirthRecordReport = async (req, res) => {
  try {
    const { startDate, endDate, gender, delivery_type } = req.query;

    const match = {};

    if (startDate || endDate) {
      match.dob_baby = {};
      if (startDate) match.dob_baby.$gte = new Date(startDate);
      if (endDate) match.dob_baby.$lte = new Date(endDate);
    }

    if (gender) match.gender = gender;
    if (delivery_type) match.delivery_type = delivery_type;

    const records = await LabourRoomDetails.find(match)
      .populate('patientId', 'name age gender patientId')
      .populate('procedureScheduleId', 'scheduledDateTime procedureType')
      .populate('captured_by_user_id', 'name role');

    res.status(200).json(records);
  } catch (error) {
    console.error('Birth Record Report Error:', error);
    res.status(500).json({ message: 'Error generating birth record report.' });
  }
};



exports.getBillingSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    if (startDate || endDate) {
      match.bill_date = {};
      if (startDate) match.bill_date.$gte = new Date(startDate);
      if (endDate) match.bill_date.$lte = new Date(endDate);
    }

    const summary = await Bill.aggregate([
      { $match: match },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.item_type',
          totalAmount: { $sum: '$items.sub_total' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          breakdown: {
            $push: {
              type: '$_id',
              amount: '$totalAmount',
              count: '$count'
            }
          },
          grandTotal: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          breakdown: 1,
          grandTotal: 1
        }
      }
    ]);

    const paymentStatusBreakdown = await Bill.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$payment_status',
          totalAmount: { $sum: '$total_amount' }
        }
      }
    ]);

    res.status(200).json({
      summary: summary[0] || { breakdown: [], grandTotal: 0 },
      paymentStatusBreakdown
    });
  } catch (error) {
    console.error('Billing Summary Error:', error);
    res.status(500).json({ message: 'Error generating billing summary report.' });
  }
};



exports.getPaymentReconciliationReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    if (startDate || endDate) {
      match.payment_date = {};
      if (startDate) match.payment_date.$gte = new Date(startDate);
      if (endDate) match.payment_date.$lte = new Date(endDate);
    }

    const payments = await Payment.find(match)
      .populate('received_by_user_id_ref', 'name role')
      .populate('bill_id_ref', 'patient_id_ref total_amount payment_status');

    const methodBreakdown = {};
    const userBreakdown = {};
    let totalAmount = 0;

    for (const p of payments) {
      totalAmount += p.amount_paid;

      if (!methodBreakdown[p.payment_method]) methodBreakdown[p.payment_method] = 0;
      methodBreakdown[p.payment_method] += p.amount_paid;

  
      const user = p.received_by_user_id_ref?.name || 'Unknown';
      if (!userBreakdown[user]) userBreakdown[user] = 0;
      userBreakdown[user] += p.amount_paid;
    }

    res.status(200).json({
      totalReceived: totalAmount,
      methodBreakdown,
      userBreakdown,
      payments
    });
  } catch (error) {
    console.error('Payment Reconciliation Report Error:', error);
    res.status(500).json({ message: 'Failed to generate report.' });
  }
};
