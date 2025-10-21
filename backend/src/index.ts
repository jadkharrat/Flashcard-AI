import express from "express";
import cors from "cors";
import dotenv from "dotenv";


dotenv.config();
const app = express();
const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Flashcard AI Backend is running");
});

app.listen(port, () => console.log(`api on: ${port}`));