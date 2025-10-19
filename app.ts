import prisma from "./src/shared/db/db.ts";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { usersRouter } from "./src/users/router/usersRouter.ts";
import { adminRouter } from "./src/users/router/adminRouter.ts"
import type { ErrorRequestHandler  } from "express";
import { inventoryRouter } from "./src/inventory/router/inventoryRouter.ts";
import { ALLOWED_ORIGINS } from "./src/shared/constants/constants.ts";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowedIds by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(express.json());
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/inventory', inventoryRouter);

app.get('/', (request, response) => {
    return response.json({ status: 'ok'});
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
    if (response.headersSent) return next(error);
    const { status = 500, message = "Server error" } = error;
    console.error(error);
    return response.status(status).json({ error: message });
};
app.use(errorHandler);

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});