const User = require('../models/user');
const Doctor = require('../models/doctor');
const bcrypt = require('bcrypt');
const Staff = require('../models/Staff');
const { setUser } = require("../utils/auth");

const loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let extraInfo = {};
    let tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
    let staff=null;
    let doctor=null;
    if (user.role === 'STAFF') {
      staff = await Staff.findOne({ userId: user._id }).populate('department', 'name');
      if (!staff) {
        return res.status(404).json({ message: 'Staff profile not found.' });
      }

      extraInfo = {
        designation: staff.designation,
        contactNumber: staff.contactNumber,
        department: staff.department ? staff.department.name : null
      };

      tokenPayload._id = staff._id; 
      tokenPayload.designation = staff.designation;

    } else if (user.role === 'DOCTOR') {
      doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found.' });
      }
             doctor.isAvailable = true;
  await doctor.save();
      tokenPayload._id = doctor._id; 
    } else {
      tokenPayload._id = user._id; 
    }

    const token = setUser(tokenPayload); 

    let finalId = user._id;
    if (user.role === 'STAFF' && staff) {
      finalId = staff._id;
    } else if (user.role === 'DOCTOR' && doctor) {
      finalId = doctor._id;
    }

    // console.log(finalId);
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: finalId,
          userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...extraInfo
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const logoutHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const { role, userId } = req.user; 

    if (role === "DOCTOR") {
      const doctor = await Doctor.findOne({ userId });
      if (doctor) {
        doctor.isAvailable = false;
        await doctor.save();
      }
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  loginHandler,
  logoutHandler,
};
