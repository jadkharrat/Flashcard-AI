import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import FlashcardRoutes from "./routes/flashcards.ts";
import "./database/connection.ts";
import authRoutes from "./routes/auth.ts";


dotenv.config();
const app = express();
const port = process.env.port || 5050;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/flashcards", FlashcardRoutes);

app.listen(port, () => console.log(`api on: ${port}`));