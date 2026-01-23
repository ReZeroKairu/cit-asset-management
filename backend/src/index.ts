import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(cors()); // Allow frontend to connect
app.use(express.json());

// Example Route with Zod Validation
app.get("/", async (req, res) => {
  res.send("CIT Asset Management API is running");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
