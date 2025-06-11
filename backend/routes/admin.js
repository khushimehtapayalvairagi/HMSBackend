const express = require("express");

const router = express.Router();

router.post('/register', registerHandler); 
router.get('/users', getAllUsersHandler);
router.post('/users', createUserHandler);

module.exports = router;