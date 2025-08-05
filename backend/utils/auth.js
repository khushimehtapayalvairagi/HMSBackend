const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const secret = process.env.JWT_SECRET

function setUser(payload) {
  return jwt.sign(payload, secret, { expiresIn: '7d' }); 
}

function getUser(token){
    if(!token) return null;
    try {
        return jwt.verify(token,secret);
    } catch (error) {
        return null;
    }
}


module.exports = {
    setUser,getUser
}