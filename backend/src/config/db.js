import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log("⏳ Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4, // ⚠️ YE CRITICAL HAI: Force IPv4
            serverSelectionTimeoutMS: 10000, // 10 seconds tak wait kare
        });
        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Error Details:", error.message);
        // Debugging ke liye check karen agar URI null to nahi
        if (!process.env.MONGODB_URI) console.log("⚠️ Check: MONGODB_URI is missing in .env");
    }
};
export default connectDB;