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
    const verified = jwt.verify(token, secret);
    console.log("✅ Token verified:", verified);
    return verified;
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return null;
  }
}



module.exports = {
    setUser,getUser
}