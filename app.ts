import prisma from "./src/shared/db/db.ts";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { usersRouter } from "./src/users/router/users.router.ts";
import { adminRouter } from "./src/users/router/admin.router.ts";
import type { ErrorRequestHandler } from "express";
import { inventoryRouter } from "./src/inventory/router/inventory.router.ts";
import { ALLOWED_ORIGINS } from "./src/shared/constants/constants.ts";
import { itemsRouter } from "./src/items/router/items.router.ts";
import { categoriesRouter } from "./src/categories/router/categories.router.ts";
import { tagsRouter } from "./src/tags/router/tags.router.ts";
import { discussionsRouter } from "./src/discussions/router/discussions.router.ts";
import { homeRouter } from "./src/home/router/home.router.ts";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Skip-Auth-Interceptor"],
  }),
);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/items", itemsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/discussions", discussionsRouter);
app.use("/api/home", homeRouter);

app.get("/", (_request, response) => {
  return response.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) return next(error);
  const { status = 500, message = "Server error" } = error;
  console.error(error);
  return response.status(status).json({ message });
};
app.use(errorHandler);

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
