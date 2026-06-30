import express from 'express';
import dotenv from 'dotenv';
import { dbConnect } from './lib/dbConnect';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/users', userRoutes);

app.listen(PORT, async () => {
  await dbConnect();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
