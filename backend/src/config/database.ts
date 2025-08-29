import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


const dbUrl: string = process.env.DB_URL as string;

const connectToDatabase = async () => {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to the db");
    } catch (err) {
        console.error("Failed to connect to the db", err);
        throw err;
    }
};

export default connectToDatabase;