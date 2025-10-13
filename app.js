import prisma from "./db/db.ts";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    'http://localhost:5173',
    'https://site--inventory-app--sm9fnltkyqvh.code.run'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(express.json());

app.get('/', (request, response) => {
    return response.json({ status: 'ok'});
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});