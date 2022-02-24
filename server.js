import "./config.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routers/userRouter.js";
import chatRouter from "./routers/chatRouter.js";
import "./db/mongoose.js";

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(userRouter);
app.use(chatRouter);

app.listen(port, () => {
  console.log(`App listening on port: ${port}`);
});
