import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()
const databaseConnect=async()=>{
      await  mongoose.connect(process.env.DB_URL,
        { useNewUrlParser: true}
        )
            .then(()=>{console.log("databseConnected")})
            .catch(err=>console.log(err));
    }

export default databaseConnect;    