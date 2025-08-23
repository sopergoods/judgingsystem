const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '')));

// Simple MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'judging_system'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Generate random password
function generatePassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/staff-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'staff-dashboard.html'));
});

app.get('/judge-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'judge-dashboard.html'));
});

app.get('/staff', (req, res) => {
    res.sendFile(path.join(__dirname, 'staff-dashboard.html'));
});

app.get('/judge', (req, res) => {
    res.sendFile(path.join(__dirname, 'judge-dashboard.html'));
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result[0];
        console.log('Login successful:', user.username, 'Role:', user.role);
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                user_id: user.user_id,
                username: user.username,
                role: user.role,
                full_name: user.full_name || user.username
            }
        });
    });
});

// Get competitions
app.get('/competitions', (req, res) => {
    const sql = 'SELECT * FROM competitions ORDER BY competition_date DESC';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching competitions:', err);
            return res.status(500).json({ error: 'Error fetching competitions' });
        }
        res.json(result);
    });
});

// Get single competition
app.get('/competition/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM competitions WHERE competition_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching competition' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        res.json(result[0]);
    });
});

// Create competition
app.post('/create-competition', (req, res) => {
    const { competition_name, category, competition_date } = req.body;
    
    if (!competition_name || !category || !competition_date) {
        return res.status(400).json({ error: 'All fields required' });
    }

    const sql = 'INSERT INTO competitions (competition_name, category, competition_date) VALUES (?, ?, ?)';
    db.query(sql, [competition_name, category, competition_date], (err, result) => {
        if (err) {
            console.error('Error creating competition:', err);
            return res.status(500).json({ error: 'Error creating competition' });
        }
        res.json({ 
            success: true, 
            message: 'Competition created successfully!',
            competition_id: result.insertId 
        });
    });
});

// Update competition
app.put('/update-competition/:id', (req, res) => {
    const { id } = req.params;
    const { competition_name, category, competition_date } = req.body;

    const sql = 'UPDATE competitions SET competition_name = ?, category = ?, competition_date = ? WHERE competition_id = ?';
    db.query(sql, [competition_name, category, competition_date, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error updating competition' });
        }
        res.json({ success: true, message: 'Competition updated successfully!' });
    });
});

// Delete competition
app.delete('/delete-competition/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM competitions WHERE competition_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting competition' });
        }
        res.json({ success: true, message: 'Competition deleted successfully!' });
    });
});

// Get participants
app.get('/participants', (req, res) => {
    const sql = `
        SELECT p.*, c.competition_name, c.category
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        ORDER BY p.participant_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching participants' });
        }
        res.json(result);
    });
});

// Get participants by competition
app.get('/participants/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT p.*, c.competition_name, c.category
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        WHERE p.competition_id = ?
        ORDER BY p.participant_name
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching participants' });
        }
        res.json(result);
    });
});

// Get single participant
app.get('/participant/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT p.*, c.competition_name, c.category
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        WHERE p.participant_id = ?
    `;
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching participant' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json(result[0]);
    });
});

// Add participant
app.post('/add-participant', (req, res) => {
    const { 
        participant_name, email, phone, age, gender, 
        school_organization, performance_title, performance_description, 
        competition_id, registration_fee = 'pending'
    } = req.body;

    if (!participant_name || !email || !age || !gender || !performance_title || !competition_id) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const sql = `INSERT INTO participants 
                (participant_name, email, phone, age, gender, school_organization, 
                 performance_title, performance_description, competition_id, registration_fee) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [
        participant_name, email, phone, age, gender, school_organization,
        performance_title, performance_description, competition_id, registration_fee
    ], (err, result) => {
        if (err) {
            console.error('Error adding participant:', err);
            return res.status(500).json({ error: 'Error adding participant' });
        }
        res.json({ 
            success: true, 
            message: 'Participant added successfully!',
            participant_id: result.insertId 
        });
    });
});

// Update participant
app.put('/update-participant/:id', (req, res) => {
    const { id } = req.params;
    const { 
        participant_name, email, phone, age, gender, 
        school_organization, performance_title, performance_description, 
        competition_id, registration_fee
    } = req.body;

    const sql = `UPDATE participants 
                 SET participant_name = ?, email = ?, phone = ?, age = ?, gender = ?, 
                     school_organization = ?, performance_title = ?, performance_description = ?, 
                     competition_id = ?, registration_fee = ? 
                 WHERE participant_id = ?`;
    
    db.query(sql, [
        participant_name, email, phone, age, gender, school_organization,
        performance_title, performance_description, competition_id, 
        registration_fee || 'pending', id
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error updating participant' });
        }
        res.json({ success: true, message: 'Participant updated successfully!' });
    });
});

// Delete participant
app.delete('/delete-participant/:id', (req, res) => {
    const { id } = req.params;
    
    // Delete scores first
    db.query('DELETE FROM scores WHERE participant_id = ?', [id], (err) => {
        if (err) console.error('Error deleting scores:', err);
        
        // Then delete participant
        db.query('DELETE FROM participants WHERE participant_id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error deleting participant' });
            }
            res.json({ success: true, message: 'Participant deleted successfully!' });
        });
    });
});

// Get judges
app.get('/judges', (req, res) => {
    const sql = `
        SELECT j.*, c.competition_name, c.category, u.username
        FROM judges j
        JOIN competitions c ON j.competition_id = c.competition_id
        LEFT JOIN users u ON j.user_id = u.user_id
        ORDER BY j.judge_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judges' });
        }
        res.json(result);
    });
});

// Get single judge
app.get('/judge/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT j.*, c.competition_name, c.category, u.username
        FROM judges j
        JOIN competitions c ON j.competition_id = c.competition_id
        LEFT JOIN users u ON j.user_id = u.user_id
        WHERE j.judge_id = ?
    `;
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judge' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Judge not found' });
        }
        res.json(result[0]);
    });
});

// Get judge competitions
app.get('/judge-competitions/:judgeId', (req, res) => {
    const { judgeId } = req.params;
    const sql = `
        SELECT DISTINCT c.competition_id, c.competition_name, c.category, c.competition_date,
               COUNT(p.participant_id) as participant_count
        FROM competitions c
        JOIN judges j ON c.competition_id = j.competition_id
        LEFT JOIN participants p ON c.competition_id = p.competition_id
        WHERE j.judge_id = ? 
        GROUP BY c.competition_id, c.competition_name, c.category, c.competition_date
        ORDER BY c.competition_date DESC
    `;
    db.query(sql, [judgeId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judge competitions' });
        }
        res.json(result);
    });
});

// Add judge
app.post('/add-judge', (req, res) => {
    const { 
        judge_name, email, phone, expertise, 
        experience_years = 0, credentials, competition_id 
    } = req.body;

    if (!judge_name || !email || !expertise || !competition_id) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const username = judge_name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
    const password = generatePassword(8);

    // Create user first
    const createUserSql = 'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)';
    db.query(createUserSql, [username, password, 'judge', judge_name], (err, userResult) => {
        if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Error creating judge account' });
        }

        const userId = userResult.insertId;

        // Create judge
        const addJudgeSql = `INSERT INTO judges 
                           (judge_name, email, phone, expertise, experience_years, credentials, competition_id, user_id) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(addJudgeSql, [
            judge_name, email, phone, expertise, experience_years, credentials, competition_id, userId
        ], (err, judgeResult) => {
            if (err) {
                // Remove user if judge creation fails
                db.query('DELETE FROM users WHERE user_id = ?', [userId]);
                console.error('Error adding judge:', err);
                return res.status(500).json({ error: 'Error adding judge' });
            }

            res.json({
                success: true,
                message: 'Judge added successfully!',
                credentials: {
                    username: username,
                    password: password,
                    judge_name: judge_name,
                    judge_id: judgeResult.insertId,
                    user_id: userId
                }
            });
        });
    });
});

// Update judge
app.put('/update-judge/:id', (req, res) => {
    const { id } = req.params;
    const { 
        judge_name, email, phone, expertise, 
        experience_years, credentials, competition_id 
    } = req.body;

    const sql = `UPDATE judges 
                 SET judge_name = ?, email = ?, phone = ?, expertise = ?, 
                     experience_years = ?, credentials = ?, competition_id = ? 
                 WHERE judge_id = ?`;
    
    db.query(sql, [judge_name, email, phone, expertise, experience_years, credentials, competition_id, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error updating judge' });
        }
        res.json({ success: true, message: 'Judge updated successfully!' });
    });
});

// Delete judge
app.delete('/delete-judge/:id', (req, res) => {
    const { id } = req.params;

    // Get user ID first
    db.query('SELECT user_id FROM judges WHERE judge_id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judge info' });
        }

        const userId = result.length > 0 ? result[0].user_id : null;

        // Delete judge
        db.query('DELETE FROM judges WHERE judge_id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error deleting judge' });
            }

            // Delete user if exists
            if (userId) {
                db.query('DELETE FROM users WHERE user_id = ?', [userId], (err) => {
                    if (err) console.error('Error deleting user:', err);
                });
            }

            res.json({ success: true, message: 'Judge deleted successfully!' });
        });
    });
});

// Submit score
app.post('/submit-score', (req, res) => {
    const { 
        judge_id, participant_id, competition_id, 
        technical_score, artistic_score, overall_score, comments 
    } = req.body;

    if (!judge_id || !participant_id || !competition_id) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const sql = `INSERT INTO scores 
                (judge_id, participant_id, competition_id, technical_score, artistic_score, overall_score, comments)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                technical_score = VALUES(technical_score), 
                artistic_score = VALUES(artistic_score), 
                overall_score = VALUES(overall_score), 
                comments = VALUES(comments)`;
    
    db.query(sql, [
        judge_id, participant_id, competition_id, 
        technical_score || 0, artistic_score || 0, overall_score || 0, comments
    ], (err, result) => {
        if (err) {
            console.error('Error submitting score:', err);
            return res.status(500).json({ error: 'Error submitting score' });
        }
        res.json({ success: true, message: 'Score submitted successfully!' });
    });
});

// Get scores
app.get('/scores/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT s.*, p.participant_name, p.performance_title, j.judge_name, j.expertise
        FROM scores s
        JOIN participants p ON s.participant_id = p.participant_id
        JOIN judges j ON s.judge_id = j.judge_id
        WHERE s.competition_id = ?
        ORDER BY p.participant_name, j.judge_name
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching scores' });
        }
        res.json(result);
    });
});

// Create staff user
app.post('/create-staff', (req, res) => {
    const { username, password, full_name } = req.body;

    if (!username || !password || !full_name) {
        return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const sql = 'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, password, 'staff', full_name], (err, result) => {
        if (err) {
            console.error('Error creating staff:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({
            success: true,
            message: 'Staff user created successfully',
            user_id: result.insertId
        });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});