import express from "express";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Personal RAG Server is running",
    });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
export default app;
