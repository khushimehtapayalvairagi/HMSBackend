const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./utils/config');
const cors = require('cors');
const dotenv = require('dotenv');
const { setupSocket } = require('./utils/sockets'); 
const {restrictToLoggedInUserOnly,restrictTo} = require('./middlewares/auth')
dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app); 

setupSocket(server); 

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));





const AuthHandler = require("./routes/auth");
const AdminHandler = require("./routes/admin");
// const StaffHandler = require("./routes/staff");
const ReceptionistHandler = require("./routes/receptionist");
// const HeadNurseHandler = require("./routes/headnurse");
const DoctorHandler = require("./routes/doctor");


// Database Connect
connectDB(process.env.DATABASE_URL);

server.listen(PORT, () => {
    console.log(`Server is listening at PORT: ${PORT}`);
});


app.use('/api/auth',AuthHandler)
app.use('/api/admin',restrictToLoggedInUserOnly,restrictTo(["ADMIN","RECEPTIONIST"]),AdminHandler);   
// app.use('/api/staff',restrictToLoggedInUserOnly,restrictTo(["ADMIN","STAFF"]),StaffHandler);   
app.use('/api/receptionist',restrictToLoggedInUserOnly,restrictTo(["ADMIN","RECEPTIONIST"]),ReceptionistHandler);   
// app.use('/api/headnurse',restrictToLoggedInUserOnly,restrictTo(["ADMIN","HEADNURSE"]),HeadNurseHandler);  
app.use('/api/doctor',restrictToLoggedInUserOnly,restrictTo(["ADMIN","DOCTOR"]),DoctorHandler);





