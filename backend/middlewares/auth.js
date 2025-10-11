const { getUser } = require("../utils/auth");
const Staff = require('../models/Staff');


async function restrictToLoggedInUserOnly(req,res,next){
    const userid = req.headers['authorization'];
  console.log("🪶 Authorization Header:", userid);
    if(!userid) return res.status(404).json({
        message:"Token not found"
    })

    // const token = userid.split('Bearer ')[1]; 
         const token = userid.split(" ")[1]
    const user = getUser(token);
    
    if(!user) return res.status(404).json({
        message:"User Not found"
    });

    req.user = user;
    next();
}



function restrictTo(roles){
    return function(req,res,next){
        if(!req.user) return res.status(404).json({
            message:"User not Logged In"
        })

        if(!roles.includes(req.user.role)) return res.status(401).json({
            message:"User not authorized to access this route"
        }) 

        return next();
    }
}


function restrictToDesignation(allowedDesignations = []) {
  return function (req, res, next) {
     if (req.user.role !== 'STAFF') {
      return next();
    }
    

    if (!req.user.designation || !allowedDesignations.includes(req.user.designation)) {
      return res.status(403).json({ message: 'You do not have the required staff designation.' });
    }

    next();
  };
}

module.exports = { restrictToLoggedInUserOnly, restrictTo, restrictToDesignation };
