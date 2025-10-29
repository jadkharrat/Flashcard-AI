import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import FlashcardRoutes from "./routes/flashcards.ts";
import "./database/connection.ts";


dotenv.config();
const app = express();
const port = process.env.port || 5050;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.send("Flashcard AI Backend is running");
});

app.use("/api/flashcards", FlashcardRoutes);

app.listen(port, () => console.log(`api on: ${port}`));