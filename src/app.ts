import express, { Application, Request, Response } from "express";
import ChatRoute from "./module/ai-service/aiservice.route.js"
import cors from "cors"

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Personal RAG Server is running",
  });
});

app.use("/api/v1", ChatRoute);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;

