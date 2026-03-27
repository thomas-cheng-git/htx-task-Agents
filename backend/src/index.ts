import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import skillsRouter from './routes/skills';
import developersRouter from './routes/developers';
import tasksRouter from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/skills', skillsRouter);
app.use('/api/developers', developersRouter);
app.use('/api/tasks', tasksRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
