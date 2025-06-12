const express = require("express");
const loginHandler = require("../controllers/auth")
const router = express.Router();

router.post('/login', loginHandler);

module.exports = router;