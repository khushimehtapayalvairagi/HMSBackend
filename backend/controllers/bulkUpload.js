const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const Specialty = require("../models/Specialty");
const Department = require("../models/Department");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Staff = require("../models/Staff");


exports.bulkUploadSpeciality = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  let records = [];
  let errorRows = [];
  let rowIndex = 1;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      rowIndex++;
      if (!row.name || !row.description) {
        errorRows.push(rowIndex);
      } else {
        records.push({
          name: row.name.trim(),
          description: row.description.trim(),
        });
      }
    })
    .on("end", async () => {
      fs.unlinkSync(req.file.path);

      if (errorRows.length > 0) {
        return res.status(400).json({
          message: "Validation failed. Fix errors and try again.",
          errorRows,
        });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await Specialty.insertMany(records, { session });
        await session.commitTransaction();
        session.endSession();

        res.json({
          message: "Specialities uploaded successfully",
          insertedCount: records.length,
        });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();

        res.status(500).json({
          message: "Transaction failed. No records inserted.",
          error: err.message,
        });
      }
    })
    .on("error", (err) => {
      res.status(500).json({ message: "Error processing file" });
    });
};


exports.bulkUploadDepartment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  let records = [];
  let errorRows = [];
  let rowIndex = 1;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      rowIndex++;
      if (!row.name || !row.description) {
        errorRows.push(rowIndex);
      } else {
        records.push({
          name: row.name.trim(),
          description: row.description.trim(),
        });
      }
    })
    .on("end", async () => {
      fs.unlinkSync(req.file.path);

      if (errorRows.length > 0) {
        return res.status(400).json({
          message: "Validation failed. Fix errors and try again.",
          errorRows,
        });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await Department.insertMany(records, { session });
        await session.commitTransaction();
        session.endSession();

        res.json({
          message: "Departments uploaded successfully",
          insertedCount: records.length,
        });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();

        res.status(500).json({
          message: "Transaction failed. No records inserted.",
          error: err.message,
        });
      }
    })
    .on("error", (err) => {
      res.status(500).json({ message: "Error processing file" });
    });
};
exports.bulkUploadDoctors = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const filePath = req.file.path;
  let rowIndex = 1;
  let doctors = [];
  let errors = [];

  try {
    const parseCSV = () =>
      new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (row) => {
            rowIndex++;
            doctors.push({ rowIndex, ...row });
          })
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });

    await parseCSV();

    if (!doctors.length) throw new Error("CSV is empty!");

    let inserted = [];

    for (const row of doctors) {
      try {
        const {
          name,
          email,
          password,
          doctorType,
          specialty,
          department,
          medicalLicenseNumber,
          schedule,
        } = row;

        if (!name || !email || !password || !doctorType || !specialty || !department || !medicalLicenseNumber) {
          throw new Error("Missing required doctor fields.");
        }

        const exists = await User.findOne({ email }).session(session);
        if (exists) throw new Error(`Email '${email}' already exists.`);

        const specialtyData = await Specialty.findOne({
          name: new RegExp(`^${specialty.trim()}$`, "i"),
        }).session(session);
        if (!specialtyData) throw new Error(`Specialty '${specialty}' not found.`);

        const departmentData = await Department.findOne({
          name: new RegExp(`^${department.trim()}$`, "i"),
        }).session(session);
        if (!departmentData) throw new Error(`Department '${department}' not found.`);

        let parsedSchedule = [];
        if (schedule) {
          try {
            parsedSchedule = JSON.parse(schedule);
          } catch {
            throw new Error("Invalid schedule JSON format.");
          }
        }

        // create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          role: "DOCTOR",
        });
        await newUser.save({ session });

        // create doctor
        const doctor = new Doctor({
          userId: newUser._id,
          doctorType,
          specialty: specialtyData._id,
          department: departmentData._id,
          medicalLicenseNumber,
          schedule: parsedSchedule,
        });
        await doctor.save({ session });

        inserted.push(newUser._id);
      } catch (err) {
        errors.push({ row: row.rowIndex, error: err.message });
      }
    }

    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Validation failed. Fix errors and re-upload.",
        errorRows: errors,
      });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Doctors uploaded successfully",
      successCount: inserted.length,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Bulk upload failed", error: err.message });
  }
};

exports.bulkUploadStaff = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const filePath = req.file.path;
  let rowIndex = 1;
  let staffMembers = [];
  let errors = [];

  try {
    const parseCSV = () =>
      new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (row) => {
            rowIndex++;
            staffMembers.push({ rowIndex, ...row });
          })
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });

    await parseCSV();

    if (!staffMembers.length) throw new Error("CSV is empty!");

    let inserted = [];

    for (const row of staffMembers) {
      try {
        const { name, email, password, contactNumber, designation, department } = row;

        if (!name || !email || !password || !contactNumber || !designation) {
          throw new Error("Missing required staff fields.");
        }

        const exists = await User.findOne({ email }).session(session);
        if (exists) throw new Error(`Email '${email}' already exists.`);

        let departmentData = null;
        if (department) {
          departmentData = await Department.findOne({
            name: new RegExp(`^${department.trim()}$`, "i"),
          }).session(session);
          if (!departmentData) throw new Error(`Department '${department}' not found.`);
        }

        // create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          role: "STAFF",
        });
        await newUser.save({ session });

        // create staff
        const staff = new Staff({
          userId: newUser._id,
          contactNumber,
          designation,
          department: departmentData ? departmentData._id : null,
        });
        await staff.save({ session });

        inserted.push(newUser._id);
      } catch (err) {
        errors.push({ row: row.rowIndex, error: err.message });
      }
    }

    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Validation failed. Fix errors and re-upload.",
        errorRows: errors,
      });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Staff uploaded successfully",
      successCount: inserted.length,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Bulk upload failed", error: err.message });
  }
};

