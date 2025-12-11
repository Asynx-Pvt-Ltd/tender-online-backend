import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';

const routor = require('./routor/route');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI, {});

const connectToMongoDB = mongoose.connection;
connectToMongoDB.on(
	'error',
	console.error.bind(console, 'MongoDB connection error:'),
);
connectToMongoDB.once('open', () => {
	console.log('Connected to MongoDB');
});

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(cors());
// app.use(
//   cors({
//     origin: [
//       "http://localhost:3002",
//       "http://localhost:3001",
//       "https://tender-online-web.vercel.app",
//       "https://tender-online-admin-ibob.vercel.app",
//       "https://tender-online-web-l5ws.vercel.app",
//       "https://tenderonline.in/",
//       "https://demo.tenderonline.in",
//       "https://demo.tenderonline.in/",
//       "https://admin.tenderonline.co.in",
//       "https://tender-online.vercel.app",
//       "https://www.tenderonline.in",
//       "https://tenderonline.in/",
//       "https://www.tenderonline.co.in",
//       "https://tenderonline.co.in",
//       "https://tender-online.vercel.app",
//       "http://localhost:3000",
//       "http://localhost:3002",
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(express.static('public'));

// Apply the authenticateUser middleware to all routes starting with '/api'
app.use('/api', routor);

// Health check route
app.get('/', (req: Request, res: Response) => {
	res.send('Express + TypeScript Server');
});

// Start the server
app.listen(4500, '0.0.0.0', () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});
