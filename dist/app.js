import express from "express";
import ChatRoute from "./module/ai-service/aiservice.route.js";
import cors from "cors";
const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Personal RAG Server is running Rag Working fine",
    });
});
app.use("/api/v1", ChatRoute);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
export default app;
