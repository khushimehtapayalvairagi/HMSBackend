const ProcedureSchedule = require('../models/ProcedureSchedule');
const AnesthesiaRecord = require('../models/AnesthesiaRecord');
const LabourRoomDetail = require('../models/LabourRoomDetail');

exports.scheduleProcedure = async (req, res) => {
     console.log('Received body for anesthesia record:', req.body);
    try {
        const {
            patientId, ipdAdmissionId, procedureType, roomId, scheduledDateTime,
            procedureId, surgeonId, assistantIds, anestheticId
        } = req.body;

        if (!patientId || !procedureType || !roomId || !scheduledDateTime || !procedureId || !surgeonId) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const procedure = new ProcedureSchedule({
            patientId,
            ipdAdmissionId,
            procedureType,
            roomId,
            scheduledDateTime,
            procedureId,
            surgeonId,
            assistantIds,
            anestheticId
        });

        await procedure.save();
        res.status(201).json({ message: 'Procedure scheduled successfully.', procedure });

    } catch (error) {
        console.error('Schedule Procedure Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.getSchedulesByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const procedures = await ProcedureSchedule.find({ patientId })
            .populate('procedureId surgeonId anestheticId roomId assistantIds');

        res.status(200).json({ procedures });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};


exports.updateProcedureStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Scheduled', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        const procedure = await ProcedureSchedule.findById(id);
        if (!procedure) return res.status(404).json({ message: 'Procedure not found.' });

        procedure.status = status;
        await procedure.save();

        res.status(200).json({ message: 'Procedure status updated.', procedure });

    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};


exports.createAnesthesiaRecord = async (req, res) => {
  console.log('Received body for anesthesia record:', req.body);

    try {
        const {
            procedureScheduleId, anestheticId, anesthesiaName,
            anesthesiaType, induceTime, endTime, medicinesUsedText
        } = req.body;

        if (!procedureScheduleId || !anestheticId || !anesthesiaName || !anesthesiaType) {
            return res.status(400).json({ message: 'Missing required anesthesia fields.' });
        }

        const record = new AnesthesiaRecord({
            procedureScheduleId, anestheticId, anesthesiaName,
            anesthesiaType, induceTime, endTime, medicinesUsedText
        });

        await record.save();
        res.status(201).json({ message: 'Anesthesia record created.', record });

    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};


exports.getAnesthesiaRecord = async (req, res) => {
    try {
        const { procedureScheduleId } = req.params;
        const record = await AnesthesiaRecord.findOne({ procedureScheduleId }).populate('anestheticId');

        if (!record) return res.status(404).json({ message: 'No record found.' });
        res.status(200).json({ record });

    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.createLabourRoomDetail = async (req, res) => {
     console.log('Received body for anesthesia record:', req.body);
   
    try {
        const {
            procedureScheduleId, patientId, babyName, gender,
            dobBaby, timeOfBirth, weight, deliveryType, capturedByUserId
        } = req.body;

        if (!procedureScheduleId || !patientId || !gender || !dobBaby || !timeOfBirth || !deliveryType || !capturedByUserId) {
            return res.status(400).json({ message: 'Missing required birth fields.' });
        }

        const detail = new LabourRoomDetail({
            procedureScheduleId, patientId, babyName, gender,
            dobBaby, timeOfBirth, weight, deliveryType, capturedByUserId
        });

        await detail.save();
        res.status(201).json({ message: 'Labour room details saved.', detail });

    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.getLabourRoomDetail = async (req, res) => {
    try {
        const { procedureScheduleId } = req.params;

        const detail = await LabourRoomDetail.findOne({ procedureScheduleId }).populate('capturedByUserId', 'name email');
        if (!detail) return res.status(404).json({ message: 'No labour record found.' });

        res.status(200).json({ detail });

    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};
