import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import { errorHandler } from "./middlewares/errors.middleware.js";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.router.js";
import productRouter from "./routes/product.router.js";
import salesRouter from "./routes/sell.route.js";
//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/sales", salesRouter);

app.all("*", (req, res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server`));
});

app.use(errorHandler);

export { app };
