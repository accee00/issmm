import express from "express";
import authenticationRouter from "./modules/authentication/auth_routes.ts";
import organizationRouter from "./modules/organization/organization_routes.ts";
import boardRouter from "./modules/board/board_routes.ts";
import issueRouter from "./modules/issue/issue_routes.ts";
import { errorHandler } from "./middleware/error_handler.ts";
const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use("/api/v1/auth", authenticationRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/boards", boardRouter);
app.use("/api/v1/issues", issueRouter);


app.use(errorHandler);

export { app };
