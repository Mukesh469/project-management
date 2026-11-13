import mongoose from "mongoose";

const connectToMongo = async () => {
    try {
        const mongoConnect = await mongoose.connect(process.env.MONGO_URI);
        console.log("MONGODB_CONNECTED SUCCESSFULLY.");
    } catch (error){
        console.error("Mongodb connection failed", error)
        process.exit(1);
    }   
}

export default connectToMongo;