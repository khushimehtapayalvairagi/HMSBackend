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



const AuthHandler = require('./routes/auth');
const AdminHandler = require('./routes/admin');
const ReceptionistHandler = require('./routes/receptionist');
const doctorHandler = require('./routes/doctor');
const ipdHandler = require('./routes/ipd');
const procedure = require('./routes/procedure');






// Database Connect
connectDB(process.env.DATABASE_URL);









app.use('/api/auth', AuthHandler);
app.use('/api/admin', restrictToLoggedInUserOnly, restrictTo(['ADMIN']), AdminHandler);
app.use('/api/receptionist', restrictToLoggedInUserOnly, restrictTo(['ADMIN', 'RECEPTIONIST']), ReceptionistHandler);
app.use('/api/doctor', restrictToLoggedInUserOnly, restrictTo(['ADMIN', 'DOCTOR']), doctorHandler);
app.use('/api/ipd', restrictToLoggedInUserOnly,restrictTo(['ADMIN','RECEPTIONIST','DOCTOR','NURSE']), ipdHandler);
app.use('/api/procedures', restrictToLoggedInUserOnly,restrictTo(['ADMIN','RECEPTIONIST','DOCTOR','NURSE']), procedure);

server.listen(PORT, () => {
    console.log(`Server is listening at PORT: ${PORT}`);
});
