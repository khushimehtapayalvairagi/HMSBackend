const express = require("express");

const router = express.Router();

router.post('/login', loginHandler);

module.exports = router;