const User = require('../models/User');
const Doctor = require('../models/Doctor'); 
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

    if (user.role === 'STAFF') {
      const staffData = await Staff.findOne({ userId: user._id }).populate('department', 'name');
      if (!staffData) {
        return res.status(404).json({ message: 'Staff profile not found.' });
      }

      extraInfo = {
        designation: staffData.designation,
        contactNumber: staffData.contactNumber,
        department: staffData.department ? staffData.department.name : null
      };
    }
    
    const token = setUser(user, {
      designation: staffData?.designation || null
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
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


module.exports = loginHandler;
