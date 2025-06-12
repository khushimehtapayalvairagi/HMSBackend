const express = require("express");
const {registerHandler,getAllUsersHandler,deleteUserHandler}  = require("../controllers/admin")
const router = express.Router();

router.post('/register', registerHandler); 
router.get('/users', getAllUsersHandler);
router.delete('/users/:id',deleteUserHandler);


module.exports = router;