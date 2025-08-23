const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const Speciality = require("../models/Speciality");
const Department = require("../models/Department");


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
        await Speciality.insertMany(records, { session });
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
