import dotenv from 'dotenv';
dotenv.config()

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pathToFileURL } from 'node:url';
import errorHandler from './middlewares/errorHandler.js';
import connectToMongo from './config/db.js';

import authRoutes from './routes/authRoutes.js'

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware order matters! Parse before CORS
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// CORS configuration (after parsing, before routes)
app.use(cors({
    origin: "http://localhost:5173",  // Frontend URL
    credentials: true,                 // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600
}));

app.get("/", (req, res) => {
    res.send("Welcome to the project management API.")
})

app.use('/api/auth/', authRoutes);
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
});
app.use(errorHandler);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET || !process.env.MONGO_URI) {
        throw new Error("Configure ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET and MONGO_URI before starting the API.");
    }
    await connectToMongo();
    app.listen(PORT, () => {
        console.log(`Backend is running on: http://localhost:${PORT}`)
    });
}

export default app;

