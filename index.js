import express from "express";
import customError from "./utils/customError.js";
import errorController from "./utils/errorController.js";
import globalRouter from "./globalRouter.js";
import connectDb from "./DB/config.js";
import cors from "cors"


// server configuration ---
const PORT = process.env.PORT || 8080;
const app = express();

app.use(cors("*"));

connectDb();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// endpoints
app.use("/api", globalRouter);

// health route
app.get("/health", (req, res) => {
  res.send("API is running...");
});

// Error handlers
app.all("*", (req, res, next) => {
  next(new customError(`cant find the ${req.originalUrl}`, 404));
});

app.use(errorController);

app.listen(PORT, () => {
  console.log("Server is listening on port ", PORT);
});
