
// module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all users with pagination
router.get('/', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  db.all(`SELECT * FROM users LIMIT ? OFFSET ?`, [limit, offset], (err, users) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve users', 
        error: err.message 
      });
    }

    db.get('SELECT COUNT(*) as count FROM users', (countErr, total) => {
      if (countErr) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to count total users', 
          error: countErr.message 
        });
      }

      res.json({
        status: 'success',
        users,
        totalPages: Math.ceil(total.count / limit),
        currentPage: page
      });
    });
  });
});

// Create user
router.post('/', (req, res) => {
  const { firstName, lastName, email, department } = req.body;

  // Check if user already exists
  db.get('SELECT * FROM users WHERE email = ?', [email], (checkErr, existingUser) => {
    if (checkErr) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Error checking user existence', 
        error: checkErr.message 
      });
    }

    if (existingUser) {
      return res.status(409).json({ 
        status: 'error', 
        message: 'User with this email already exists' 
      });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !department) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields' 
      });
    }

    db.run(
      'INSERT INTO users (firstName, lastName, email, department) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, department],
      function(err) {
        if (err) {
          return res.status(400).json({ 
            status: 'error', 
            message: 'Failed to create user', 
            error: err.message 
          });
        }
        res.status(201).json({ 
          status: 'success', 
          message: 'User created successfully',
          id: this.lastID 
        });
      }
    );
  });
});

// Update user
router.put('/:id', (req, res) => {
  const { firstName, lastName, email, department } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !department) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Missing required fields' 
    });
  }

  db.run(
    'UPDATE users SET firstName=?, lastName=?, email=?, department=? WHERE id=?',
    [firstName, lastName, email, department, req.params.id],
    (err) => {
      if (err) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Failed to update user', 
          error: err.message 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'User not found' 
        });
      }

      res.json({ 
        status: 'success', 
        message: 'User updated successfully' 
      });
    }
  );
});

// Delete user
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id=?', req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to delete user', 
        error: err.message 
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }

    res.json({ 
      status: 'success', 
      message: 'User deleted successfully' 
    });
  });
});

module.exports = router;