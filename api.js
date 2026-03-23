const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'xyz_secret_key_2025';

// Register
router.post('/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (Database.getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = Database.createUser({
    username,
    email,
    password: hashedPassword,
    premium: false
  });

  const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);

  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, email: user.email, premium: user.premium }
  });
});

// Login
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const user = Database.getUserByEmail(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  Database.updateUser(email, { lastLogin: new Date().toISOString() });

  const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);

  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, email: user.email, premium: user.premium }
  });
});

// Get user profile
router.get('/user/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = Database.getUserByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        premium: user.premium,
        messagesCount: user.messagesCount,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Upgrade to premium
router.post('/premium/upgrade', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { paymentMethod } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add transaction
    Database.addTransaction({
      userId: decoded.id,
      amount: 5000,
      status: 'completed',
      paymentMethod: paymentMethod || 'gopay'
    });

    // Update user to premium
    const user = Database.updateUser(decoded.email, { premium: true });

    res.json({
      success: true,
      message: 'Successfully upgraded to premium!',
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        premium: user.premium
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Send message
router.post('/chat/message', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { message } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = Database.getUserByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limit = user.premium ? 500 : 50;
    if (user.messagesCount >= limit) {
      return res.status(403).json({ error: 'Message limit reached' });
    }

    const messageCount = Database.incrementMessages(decoded.email);

    res.json({
      success: true,
      messageCount,
      limit,
      message: 'Message sent successfully'
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
