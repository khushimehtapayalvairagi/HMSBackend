const mongoose  = require("mongoose");

async function connectDB(url){
    await mongoose.connect(url).then( () =>{console.log("Database connected successfully")}).catch((err) => {console.error(err)});
console.log("DATABASE_URL =", process.env.DATABASE_URL);

}

module.exports = {connectDB};