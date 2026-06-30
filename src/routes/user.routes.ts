import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const newUser = await User.create({ username, email, password });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: 'User registration failed', details: err });
  }
});

export default router;
