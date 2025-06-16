const User = require('../models/User'); 
const bcrypt = require('bcrypt');

const registerHandler = async (req, res) => {
    // console.log("Registering:", req.body);
    try {
        const { name, email, password, role } = req.body;

        // const requesterRole = req.user.role; 
        
        // // if (requesterRole === 'ADMIN') {
        // //     if (role === 'ADMIN') {
        // //         return res.status(403).json({ message: 'Admin cannot create another admin.' });
        // //     }
        // // } else if (requesterRole === 'STAFF') {
        // //     if (role !== 'DOCTOR' && role !== 'HEADNURSE' && role !== 'NURSE') {
        // //         return res.status(403).json({ message: 'Staff can only create doctor, head nurse, or nurse.' });
        // //     }
        // // } else if (requesterRole === 'RECEPTIONIST') {
        // //     if (role !== 'PATIENT') {
        // //         return res.status(403).json({ message: 'Receptionist can only create patients.' });
        // //     }
        // // } else {
        // //     return res.status(403).json({ message: 'You are not allowed to register users.' });
        // // }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

       
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

  
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


const getAllUsersHandler = async (req, res) => {
    try {
       
        const users = await User.find({}, '-password'); 

        res.status(200).json({
            message: 'Users fetched successfully.',
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const deleteUserHandler = async (req, res) => {
    try {
        const { id } = req.params;

      
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};



module.exports = {registerHandler,getAllUsersHandler,deleteUserHandler};
