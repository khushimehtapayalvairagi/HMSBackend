const mongoose  = require("mongoose");

async function connectDB(url){
    await mongoose.connect(url).then( () =>{console.log("Database connected successfully")}).catch((err) => {console.error(err)});

}

module.exports = {connectDB};