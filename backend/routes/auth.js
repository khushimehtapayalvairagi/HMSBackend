const express = require("express");
const  { loginHandler} = require("../controllers/auth")
const { restrictToLoggedInUserOnly } = require("../middlewares/auth")
const router = express.Router();


router.post('/login', loginHandler);
// router.post('/logout',restrictToLoggedInUserOnly, logoutHandler);
module.exports = router;