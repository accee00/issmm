import express from "express";
import authenticationRouter from './modules/authentication/auth_routes.ts'
import { errorHandler } from "./middleware/error_handler.ts";
const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));


app.use('/api/v1/auth',authenticationRouter);


app.use(errorHandler);

export { app };
