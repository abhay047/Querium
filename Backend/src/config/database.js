import mongoose from "mongoose";

function connectToDb() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI environment variable is not defined");
        return;
    }
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("Connected to DB");
        })
        .catch((err) => {
            console.error("Database connection error:", err.message || err);
        });
}

export default connectToDb;
