const express = require('express');
const cookieParser = require("cookie-parser");
const {connectDB} = require("./utils/config");
const cors = require('cors')
const { restrictToLoggedInUserOnly,restrictTo } = require('./middlewares/auth');
const dotenv = require("dotenv");
dotenv.config();



const PORT= process.env.PORT || 8000;
const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5174', 
    credentials: true,
  }));



const AuthHandler = require("./routes/auth");
const AdminHandler = require("./routes/admin");
const ReceptionistHandler = require("./routes/receptionist");



// Database Connection
connectDB(process.env.DATABASE_URL);

app.listen(PORT,()=>{
    console.log(`Server is listening at PORT: ${PORT}`);
})

app.use('/api/auth',AuthHandler)
app.use('/api/admin',restrictToLoggedInUserOnly,restrictTo(["ADMIN"]),AdminHandler);   
// app.use('/api/staff',restrictToLoggedInUserOnly,restrictTo(["ADMIN","STAFF"]),StaffHandler);   
app.use('/api/receptionist',restrictToLoggedInUserOnly,restrictTo(["ADMIN","RECEPTIONIST"]),ReceptionistHandler);   
// app.use('/api/headnurse',restrictToLoggedInUserOnly,restrictTo(["ADMIN","HEADNURSE"]),HeadNurseHandler);  
// app.use('/api/doctor',restrictToLoggedInUserOnly,restrictTo(["ADMIN","DOCTOR"]),DoctorHandler);
