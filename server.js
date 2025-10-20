// Disable dotenv on Railway - use Railway's environment variables instead
if (process.env.RAILWAY_ENVIRONMENT !== 'production' && !process.env.MYSQLHOST) {
    require('dotenv').config();
}
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Enable CORS
app.use(cors());



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '')));


// Database connection

const db = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'judging_system',
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000
});

// Debug what we're actually using
console.log('🔧 Attempting connection with:');
console.log('  Host:', process.env.MYSQLHOST || process.env.DB_HOST || 'localhost');
console.log('  User:', process.env.MYSQLUSER || process.env.DB_USER || 'root');
console.log('  Database:', process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'judging_system');
console.log('  Port:', process.env.MYSQLPORT || process.env.DB_PORT || '3306');

// Test the pool connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL database pool');
    connection.release(); // Return connection to pool
});
// Debug what we're actually using
console.log('🔧 Attempting connection with:');
console.log('  Host:', process.env.MYSQLHOST || process.env.DB_HOST || 'localhost');
console.log('  User:', process.env.MYSQLUSER || process.env.DB_USER || 'root');
console.log('  Database:', process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'judging_system');
console.log('  Port:', process.env.MYSQLPORT || process.env.DB_PORT || '3306');



// Connect to database


// Generate random password
function generatePassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// ================================================
// STATIC FILE SERVING
// ================================================
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

// ================================================
// AUTHENTICATION ENDPOINTS
// ================================================
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

// ================================================
// EVENT TYPES ENDPOINTS
// ================================================
app.get('/event-types', (req, res) => {
    const sql = 'SELECT * FROM event_types ORDER BY type_name';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching event types:', err);
            return res.status(500).json({ error: 'Error fetching event types' });
        }
        res.json(result);
    });
});

app.post('/create-event-type', (req, res) => {
    const { type_name, description, is_pageant } = req.body;
    
    if (!type_name) {
        return res.status(400).json({ error: 'Event type name is required' });
    }

    const sql = 'INSERT INTO event_types (type_name, description, is_pageant) VALUES (?, ?, ?)';
    db.query(sql, [type_name, description || null, is_pageant || false], (err, result) => {
        if (err) {
            console.error('Error creating event type:', err);
            return res.status(500).json({ error: 'Error creating event type' });
        }
        res.json({ 
            success: true, 
            message: 'Event type created successfully!',
            event_type_id: result.insertId 
        });
    });
});

// ================================================
// ENHANCED COMPETITION ENDPOINTS
// ================================================
app.get('/competitions', (req, res) => {
    const sql = `
        SELECT c.*, et.type_name, et.is_pageant,
               COUNT(DISTINCT p.participant_id) as participant_count,
               COUNT(DISTINCT j.judge_id) as judge_count
        FROM competitions c
        JOIN event_types et ON c.event_type_id = et.event_type_id
        LEFT JOIN participants p ON c.competition_id = p.competition_id
        LEFT JOIN judges j ON c.competition_id = j.competition_id
        GROUP BY c.competition_id, c.competition_name, c.competition_date, c.event_description, et.type_name, et.is_pageant
        ORDER BY c.competition_date DESC
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching competitions:', err);
            return res.status(500).json({ error: 'Error fetching competitions' });
        }
        res.json(result);
    });
});

app.get('/competition/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT c.*, et.type_name, et.is_pageant
        FROM competitions c
        JOIN event_types et ON c.event_type_id = et.event_type_id
        WHERE c.competition_id = ?
    `;
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

app.post('/create-competition', (req, res) => {
    const { competition_name, event_type_id, competition_date, event_description } = req.body;
    
    if (!competition_name || !event_type_id || !competition_date) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const sql = 'INSERT INTO competitions (competition_name, event_type_id, competition_date, event_description) VALUES (?, ?, ?, ?)';
    db.query(sql, [competition_name, event_type_id, competition_date, event_description], (err, result) => {
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

app.put('/update-competition/:id', (req, res) => {
    const { id } = req.params;
    const { competition_name, event_type_id, competition_date, event_description } = req.body;

    const sql = 'UPDATE competitions SET competition_name = ?, event_type_id = ?, competition_date = ?, event_description = ? WHERE competition_id = ?';
    db.query(sql, [competition_name, event_type_id, competition_date, event_description, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error updating competition' });
        }
        res.json({ success: true, message: 'Competition updated successfully!' });
    });
});

app.delete('/delete-competition/:id', (req, res) => {
    const { id } = req.params;
    
    // Delete in order due to foreign key constraints
    const deleteQueries = [
        'DELETE FROM detailed_scores WHERE competition_id = ?',
        'DELETE FROM overall_scores WHERE competition_id = ?',
        'DELETE FROM competition_criteria WHERE competition_id = ?',
        'UPDATE judges SET competition_id = NULL WHERE competition_id = ?',
        'DELETE FROM participants WHERE competition_id = ?',
        'DELETE FROM competitions WHERE competition_id = ?'
    ];
    
    let completedQueries = 0;
    
    deleteQueries.forEach((query, index) => {
        db.query(query, [id], (err) => {
            if (err) {
                console.error(`Error in delete query ${index}:`, err);
                if (completedQueries === 0) { // Only send response once
                    return res.status(500).json({ error: 'Error deleting competition' });
                }
                return;
            }
            
            completedQueries++;
            if (completedQueries === deleteQueries.length) {
                res.json({ success: true, message: 'Competition deleted successfully!' });
            }
        });
    });
});

// ================================================
// COMPETITION CRITERIA ENDPOINTS
// ================================================
app.get('/competition-criteria/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT * FROM competition_criteria 
        WHERE competition_id = ? 
        ORDER BY order_number, criteria_id
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching criteria:', err);
            return res.status(500).json({ error: 'Error fetching criteria' });
        }
        res.json(result);
    });
});

app.post('/save-competition-criteria', (req, res) => {
    const { competition_id, criteria } = req.body;
    
    if (!competition_id || !criteria || criteria.length === 0) {
        return res.status(400).json({ error: 'Competition ID and criteria required' });
    }

    // First, delete existing criteria
    db.query('DELETE FROM competition_criteria WHERE competition_id = ?', [competition_id], (err) => {
        if (err) {
            console.error('Error deleting old criteria:', err);
            return res.status(500).json({ error: 'Error updating criteria' });
        }

        // Insert new criteria
        const insertPromises = criteria.map(criterion => {
            return new Promise((resolve, reject) => {
                const sql = `
                    INSERT INTO competition_criteria 
                    (competition_id, criteria_name, description, percentage, max_score, order_number) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                db.query(sql, [
                    competition_id, 
                    criterion.criteria_name, 
                    criterion.description, 
                    criterion.percentage, 
                    criterion.max_score, 
                    criterion.order_number
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        });

        Promise.all(insertPromises)
            .then(() => {
                res.json({ success: true, message: 'Criteria saved successfully!' });
            })
            .catch(err => {
                console.error('Error inserting criteria:', err);
                res.status(500).json({ error: 'Error saving criteria' });
            });
    });
});

// ================================================
// ENHANCED PARTICIPANT ENDPOINTS
// ================================================
app.get('/participants', (req, res) => {
    const sql = `
        SELECT p.*, c.competition_name, et.type_name, et.is_pageant
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        JOIN event_types et ON c.event_type_id = et.event_type_id
        ORDER BY p.participant_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching participants' });
        }
        res.json(result);
    });
});

app.get('/participants/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT p.*, c.competition_name, et.type_name, et.is_pageant
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        JOIN event_types et ON c.event_type_id = et.event_type_id
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

app.get('/participant/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT p.*, c.competition_name, et.type_name, et.is_pageant
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        JOIN event_types et ON c.event_type_id = et.event_type_id
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

app.post('/add-participant', (req, res) => {
    const { 
        participant_name, contestant_number, photo_url, email, phone, age, gender, 
        school_organization, performance_title, performance_description, 
        competition_id, status,
        height, measurements, talents, special_awards
    } = req.body;

    if (!participant_name || !email || !age || !gender || !competition_id) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const sql = `INSERT INTO participants 
                (participant_name, contestant_number, photo_url, email, phone, age, gender, school_organization, 
                 performance_title, performance_description, competition_id, status,
                 height, measurements, talents, special_awards) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [
        participant_name, 
        contestant_number || null,
        photo_url || null,
        email, 
        phone, 
        age, 
        gender, 
        school_organization,
        performance_title, 
        performance_description, 
        competition_id, 
        status || 'pending',
        height || null,
        measurements || null, // Keep this field
        talents || null,
        special_awards || null
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
app.put('/update-participant/:id', (req, res) => {
    const { id } = req.params;
    const { 
        participant_name, contestant_number, photo_url, email, phone, age, gender, 
        school_organization, performance_title, performance_description, 
        competition_id, status, height, measurements, talents, special_awards
    } = req.body;

    if (!participant_name || !email || !age || !gender || !competition_id) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const sql = `UPDATE participants 
                 SET participant_name = ?, contestant_number = ?, photo_url = ?, email = ?, phone = ?, 
                     age = ?, gender = ?, school_organization = ?, performance_title = ?, 
                     performance_description = ?, competition_id = ?, status = ?, 
                     height = ?, measurements = ?, talents = ?, special_awards = ?
                 WHERE participant_id = ?`;
    
    db.query(sql, [
        participant_name, contestant_number, photo_url, email, phone, age, gender, 
        school_organization, performance_title, performance_description, 
        competition_id, status, height, measurements, talents, special_awards, id
    ], (err, result) => {
        if (err) {
            console.error('Error updating participant:', err);
            return res.status(500).json({ error: 'Error updating participant' });
        }
        res.json({ 
            success: true, 
            message: 'Participant updated successfully!'
        });
    });
});

app.put('/update-participant-status/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    const sql = 'UPDATE participants SET status = ? WHERE participant_id = ?';
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating participant status:', err);
            return res.status(500).json({ error: 'Error updating status' });
        }
        res.json({ 
            success: true, 
            message: 'Participant status updated successfully!' 
        });
    });
});

app.delete('/delete-participant/:id', (req, res) => {
    const { id } = req.params;
    
    // Delete scores first
    db.query('DELETE FROM detailed_scores WHERE participant_id = ?', [id], (err) => {
        if (err) console.error('Error deleting detailed scores:', err);
        
        db.query('DELETE FROM overall_scores WHERE participant_id = ?', [id], (err) => {
            if (err) console.error('Error deleting overall scores:', err);
            
            // Then delete participant
            db.query('DELETE FROM participants WHERE participant_id = ?', [id], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Error deleting participant' });
                }
                res.json({ success: true, message: 'Participant deleted successfully!' });
            });
        });
    });
});

// ================================================
// ENHANCED JUDGE ENDPOINTS
// ================================================
app.get('/judges', (req, res) => {
    const sql = `
        SELECT j.*, c.competition_name, et.type_name, et.is_pageant, u.username
        FROM judges j
        LEFT JOIN competitions c ON j.competition_id = c.competition_id
        LEFT JOIN event_types et ON c.event_type_id = et.event_type_id
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

app.get('/judge/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT j.*, c.competition_name, et.type_name, et.is_pageant, u.username
        FROM judges j
        LEFT JOIN competitions c ON j.competition_id = c.competition_id
        LEFT JOIN event_types et ON c.event_type_id = et.event_type_id
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

app.get('/judge-competitions/:judgeId', (req, res) => {
    const { judgeId } = req.params;
    const sql = `
        SELECT DISTINCT c.competition_id, c.competition_name, c.competition_date, c.event_description,
               et.type_name, et.is_pageant,
               COUNT(DISTINCT p.participant_id) as participant_count
        FROM competitions c
        JOIN event_types et ON c.event_type_id = et.event_type_id
        JOIN judges j ON c.competition_id = j.competition_id
        LEFT JOIN participants p ON c.competition_id = p.competition_id
        WHERE j.judge_id = ? 
        GROUP BY c.competition_id, c.competition_name, c.competition_date, c.event_description, et.type_name, et.is_pageant
        ORDER BY c.competition_date DESC
    `;
    db.query(sql, [judgeId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judge competitions' });
        }
        res.json(result);
    });
});

app.post('/add-judge', (req, res) => {
    const { 
        judge_name, email, phone, expertise, 
        experience_years = 0, credentials, competition_id 
    } = req.body;

    if (!judge_name || !email || !expertise) {
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

app.delete('/delete-judge/:id', (req, res) => {
    const { id } = req.params;

    // Get user ID first
    db.query('SELECT user_id FROM judges WHERE judge_id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching judge info' });
        }

        const userId = result.length > 0 ? result[0].user_id : null;

        // Delete related scores first
        db.query('DELETE FROM detailed_scores WHERE judge_id = ?', [id], (err) => {
            if (err) console.error('Error deleting detailed scores:', err);
            
            db.query('DELETE FROM overall_scores WHERE judge_id = ?', [id], (err) => {
                if (err) console.error('Error deleting overall scores:', err);
                
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
    });
});

// ================================================
// DETAILED SCORING ENDPOINTS (New)
// ================================================
app.post('/submit-detailed-scores', (req, res) => {
    const { judge_id, participant_id, competition_id, scores, general_comments } = req.body;
    
    if (!judge_id || !participant_id || !competition_id || !scores || scores.length === 0) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    // First, delete existing detailed scores for this judge-participant combination
    db.query('DELETE FROM detailed_scores WHERE judge_id = ? AND participant_id = ? AND competition_id = ?', 
        [judge_id, participant_id, competition_id], (err) => {
        if (err) {
            console.error('Error deleting old scores:', err);
            return res.status(500).json({ error: 'Error updating scores' });
        }

        // Calculate total weighted score
        let totalScore = 0;
        
        // Insert each detailed score
        const insertPromises = scores.map(score => {
            const weightedScore = (score.score * score.percentage) / 100;
            totalScore += weightedScore;
            
            return new Promise((resolve, reject) => {
                const sql = `
                    INSERT INTO detailed_scores 
                    (judge_id, participant_id, competition_id, criteria_id, score, weighted_score, comments) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(sql, [
                    judge_id, participant_id, competition_id, 
                    score.criteria_id, score.score, weightedScore, score.comments
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
        });

        Promise.all(insertPromises)
            .then(() => {
                // Insert/update overall score
                const overallSql = `
                    INSERT INTO overall_scores (judge_id, participant_id, competition_id, total_score, general_comments)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    total_score = VALUES(total_score), 
                    general_comments = VALUES(general_comments),
                    updated_at = CURRENT_TIMESTAMP
                `;
                
                db.query(overallSql, [judge_id, participant_id, competition_id, totalScore, general_comments], (err) => {
                    if (err) {
                        console.error('Error saving overall score:', err);
                        return res.status(500).json({ error: 'Error saving overall score' });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: 'Detailed scores submitted successfully!',
                        total_score: totalScore
                    });
                });
            })
            .catch(err => {
                console.error('Error inserting detailed scores:', err);
                res.status(500).json({ error: 'Error saving detailed scores' });
            });
    });
});

app.get('/participant-scores/:participantId/:competitionId', (req, res) => {
    const { participantId, competitionId } = req.params;
    const sql = `
        SELECT ds.*, cc.criteria_name, cc.percentage, cc.max_score, j.judge_name
        FROM detailed_scores ds
        JOIN competition_criteria cc ON ds.criteria_id = cc.criteria_id
        JOIN judges j ON ds.judge_id = j.judge_id
        WHERE ds.participant_id = ? AND ds.competition_id = ?
        ORDER BY cc.order_number, ds.judge_id
    `;
    db.query(sql, [participantId, competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching participant scores:', err);
            return res.status(500).json({ error: 'Error fetching scores' });
        }
        res.json(result);
    });
});

app.get('/detailed-scores/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT ds.*, cc.criteria_name, cc.percentage, cc.max_score, 
               j.judge_name, p.participant_name, p.performance_title
        FROM detailed_scores ds
        JOIN competition_criteria cc ON ds.criteria_id = cc.criteria_id
        JOIN judges j ON ds.judge_id = j.judge_id
        JOIN participants p ON ds.participant_id = p.participant_id
        WHERE ds.competition_id = ?
        ORDER BY p.participant_name, cc.order_number, j.judge_name
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching detailed scores:', err);
            return res.status(500).json({ error: 'Error fetching detailed scores' });
        }
        res.json(result);
    });
});

app.get('/overall-scores/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT os.*, j.judge_name, p.participant_name, p.performance_title
        FROM overall_scores os
        JOIN judges j ON os.judge_id = j.judge_id
        JOIN participants p ON os.participant_id = p.participant_id
        WHERE os.competition_id = ?
        ORDER BY p.participant_name, os.total_score DESC
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching overall scores:', err);
            return res.status(500).json({ error: 'Error fetching overall scores' });
        }
        res.json(result);
    });
});

// ================================================
// CRITERIA TEMPLATES ENDPOINTS (New)
// ================================================
app.get('/criteria-templates', (req, res) => {
    const sql = `
        SELECT ct.*, et.type_name
        FROM criteria_templates ct
        JOIN event_types et ON ct.event_type_id = et.event_type_id
        ORDER BY ct.template_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching criteria templates:', err);
            return res.status(500).json({ error: 'Error fetching criteria templates' });
        }
        res.json(result);
    });
});

// ================================================
// LEGACY SCORING ENDPOINT (for backward compatibility)
// ================================================
app.post('/submit-score', (req, res) => {
    const { 
        judge_id, participant_id, competition_id, 
        technical_score, artistic_score, overall_score, comments 
    } = req.body;

    if (!judge_id || !participant_id || !competition_id) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    // This is a legacy endpoint - we'll store it as an overall score
    const sql = `
        INSERT INTO overall_scores (judge_id, participant_id, competition_id, total_score, general_comments)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        total_score = VALUES(total_score), 
        general_comments = VALUES(general_comments),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    db.query(sql, [
        judge_id, participant_id, competition_id, 
        overall_score || 0, comments
    ], (err, result) => {
        if (err) {
            console.error('Error submitting score:', err);
            return res.status(500).json({ error: 'Error submitting score' });
        }
        res.json({ success: true, message: 'Score submitted successfully!' });
    });
});

// ================================================
// STAFF USER MANAGEMENT
// ================================================
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

// ================================================
// REPORTING ENDPOINTS (New)
// ================================================
app.get('/competition-report/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    const queries = {
        competition: `
            SELECT c.*, et.type_name, et.is_pageant
            FROM competitions c
            JOIN event_types et ON c.event_type_id = et.event_type_id
            WHERE c.competition_id = ?
        `,
        participants: `
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
                   SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'waived' THEN 1 ELSE 0 END) as waived
            FROM participants WHERE competition_id = ?
        `,
        judges: `
            SELECT COUNT(*) as total_judges
            FROM judges WHERE competition_id = ?
        `,
        scores: `
            SELECT COUNT(DISTINCT CONCAT(judge_id, '-', participant_id)) as scored_combinations,
                   COUNT(DISTINCT participant_id) as participants_scored,
                   AVG(total_score) as average_score
            FROM overall_scores WHERE competition_id = ?
        `
    };
    
    const results = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.entries(queries).forEach(([key, query]) => {
        db.query(query, [competitionId], (err, result) => {
            if (err) {
                console.error(`Error in ${key} query:`, err);
                return res.status(500).json({ error: `Error fetching ${key} data` });
            }
            
            results[key] = result[0] || result;
            completedQueries++;
            
            if (completedQueries === totalQueries) {
                res.json({
                    success: true,
                    competition: results.competition,
                    statistics: {
                        participants: results.participants,
                        judges: results.judges,
                        scoring: results.scores
                    }
                });
            }
        });
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.get('/pageant-segments/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const sql = `
        SELECT ps.*, 
               COUNT(pss.score_id) as scores_submitted,
               COUNT(DISTINCT pss.participant_id) as participants_scored
        FROM pageant_segments ps
        LEFT JOIN pageant_segment_scores pss ON ps.segment_id = pss.segment_id
        WHERE ps.competition_id = ? AND ps.is_active = TRUE
        GROUP BY ps.segment_id
        ORDER BY ps.order_number, ps.segment_date, ps.segment_time
    `;
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching pageant segments:', err);
            return res.status(500).json({ error: 'Error fetching pageant segments' });
        }
        res.json(result);
    });
});

// Create pageant segment
app.post('/create-pageant-segment', (req, res) => {
    const { competition_id, segment_name, segment_date, segment_time, description, order_number } = req.body;
    
    const sql = 'INSERT INTO pageant_segments (competition_id, segment_name, segment_date, segment_time, description, order_number) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [competition_id, segment_name, segment_date, segment_time, description, order_number || 1], (err, result) => {
        if (err) {
            console.error('Error creating pageant segment:', err);
            return res.status(500).json({ error: 'Error creating pageant segment' });
        }
        res.json({ 
            success: true, 
            message: 'Pageant segment created successfully!',
            segment_id: result.insertId 
        });
    });
});


// Flexible Pageant Creation Endpoint
app.post('/create-flexible-pageant', (req, res) => {
    console.log('Received pageant data:', JSON.stringify(req.body, null, 2));
    
    const { competition_id, total_days, days } = req.body;
    
    if (!competition_id || !days || days.length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'Invalid pageant data - competition_id and days are required' 
        });
    }
    
    let totalSegments = 0;
    const insertPromises = [];
    
    days.forEach(day => {
        // Validate day data
        if (!day.segments || day.segments.length === 0) {
            console.error('Day has no segments:', day);
            return;
        }
        
        day.segments.forEach(segment => {
            totalSegments++;
            
            const promise = new Promise((resolve, reject) => {
                const sql = `INSERT INTO pageant_segments 
                           (competition_id, segment_name, segment_date, segment_time, description, order_number, day_number) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;
                
                // Ensure date is in correct format (YYYY-MM-DD)
                let formattedDate = day.date;
                if (day.date && day.date.includes('T')) {
                    // If datetime string, extract date part
                    formattedDate = day.date.split('T')[0];
                }
                
                console.log('Inserting segment:', {
                    competition_id,
                    segment_name: segment.name,
                    segment_date: formattedDate,
                    segment_time: day.time || '18:00',
                    description: segment.description,
                    order_number: segment.order,
                    day_number: day.day_number
                });
                
                db.query(sql, [
                    competition_id, 
                    segment.name, 
                    formattedDate, 
                    day.time || '18:00', 
                    segment.description || '', 
                    segment.order, 
                    day.day_number
                ], (err, result) => {
                    if (err) {
                        console.error('SQL Error:', err);
                        reject(err);
                    } else {
                        console.log('Segment inserted successfully:', result.insertId);
                        resolve(result);
                    }
                });
            });
            
            insertPromises.push(promise);
        });
    });
    
    if (insertPromises.length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'No segments to insert' 
        });
    }
    
    Promise.all(insertPromises)
    .then(() => {
        console.log('All segments inserted successfully');
        res.json({ 
            success: true, 
            message: 'Flexible pageant created successfully!',
            total_segments: totalSegments
        });
    })
    .catch(error => {
        console.error('Error creating flexible pageant:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error creating pageant setup: ' + error.message 
        });
    });
});
app.listen(PORT, '0.0.0.0', () => {  // ✅ Use the PORT from line 11
  console.log(`🚀 Server running on port ${PORT}`);
});
app.get('/pageant-segments/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    const sql = `
        SELECT * FROM pageant_segments 
        WHERE competition_id = ? AND is_active = TRUE
        ORDER BY day_number, order_number
    `;
    
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching pageant segments:', err);
            return res.status(500).json({ error: 'Error fetching pageant segments' });
        }
        res.json(result);
    });
});

// Delete a pageant segment
app.delete('/delete-pageant-segment/:segmentId', (req, res) => {
    const { segmentId } = req.params;
    
    const sql = 'DELETE FROM pageant_segments WHERE segment_id = ?';
    
    db.query(sql, [segmentId], (err, result) => {
        if (err) {
            console.error('Error deleting pageant segment:', err);
            return res.status(500).json({ error: 'Error deleting segment' });
        }
        res.json({ 
            success: true, 
            message: 'Segment deleted successfully!' 
        });
    });
});
app.get('/pageant-segment-scores/:segmentId/:participantId/:judgeId', (req, res) => {
    const { segmentId, participantId, judgeId } = req.params;
    
    const sql = `
        SELECT pss.*, cc.criteria_name, cc.percentage, cc.max_score
        FROM pageant_segment_scores pss
        JOIN competition_criteria cc ON pss.criteria_id = cc.criteria_id
        WHERE pss.segment_id = ? AND pss.participant_id = ? AND pss.judge_id = ?
        ORDER BY cc.order_number
    `;
    
    db.query(sql, [segmentId, participantId, judgeId], (err, result) => {
        if (err) {
            console.error('Error fetching segment scores:', err);
            return res.status(500).json({ error: 'Error fetching segment scores' });
        }
        res.json(result);
    });
});


// Submit segment scores - FIXED VERSION WITH LOCK COUNTDOWN
app.post('/submit-segment-scores', (req, res) => {
    const { judge_id, participant_id, segment_id, scores, general_comments, total_score } = req.body;
    
    console.log('📥 Received segment score submission:', {
        judge_id,
        participant_id,
        segment_id,
        scores_count: scores?.length,
        total_score
    });
    
    // Validation
    if (!judge_id || !participant_id || !segment_id || !scores || scores.length === 0) {
        console.error('❌ Validation failed:', { judge_id, participant_id, segment_id, scores });
        return res.status(400).json({ 
            success: false,
            error: 'Required fields missing. Need judge_id, participant_id, segment_id, and scores array' 
        });
    }

    // Start transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error('❌ Transaction start error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Database transaction error: ' + err.message 
            });
        }

        console.log('🔄 Transaction started, deleting old scores...');

        // Step 1: Delete existing scores for this judge-participant-segment combination
        const deleteSql = `
            DELETE FROM pageant_segment_scores 
            WHERE judge_id = ? AND participant_id = ? AND segment_id = ?
        `;
        
        db.query(deleteSql, [judge_id, participant_id, segment_id], (err, deleteResult) => {
            if (err) {
                return db.rollback(() => {
                    console.error('❌ Error deleting old scores:', err);
                    res.status(500).json({ 
                        success: false,
                        error: 'Error updating scores: ' + err.message 
                    });
                });
            }

            console.log('✅ Deleted old scores:', deleteResult.affectedRows, 'rows');
            console.log('💾 Inserting', scores.length, 'new scores...');

            // Step 2: Insert new scores
            let insertedCount = 0;
            let insertErrors = [];

            const insertPromises = scores.map((score, index) => {
                return new Promise((resolve, reject) => {
                    const sql = `
                        INSERT INTO pageant_segment_scores 
                        (judge_id, participant_id, segment_id, criteria_id, score, weighted_score, comments) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    console.log(`  Inserting score ${index + 1}:`, {
                        criteria_id: score.criteria_id,
                        score: score.score,
                        weighted_score: score.weighted_score
                    });
                    
                    db.query(sql, [
                        judge_id, 
                        participant_id, 
                        segment_id, 
                        score.criteria_id, 
                        score.score, 
                        score.weighted_score, 
                        score.comments || null
                    ], (err, result) => {
                        if (err) {
                            console.error(`  ❌ Error inserting score ${index + 1}:`, err.message);
                            insertErrors.push(`Score ${index + 1}: ${err.message}`);
                            reject(err);
                        } else {
                            console.log(`  ✅ Inserted score ${index + 1}, insertId:`, result.insertId);
                            insertedCount++;
                            resolve(result);
                        }
                    });
                });
            });

            Promise.all(insertPromises)
            .then(() => {
                console.log('✅ All scores inserted successfully');
                console.log('🔍 Getting competition_id from segment...');

                // Step 3: Get competition_id from segment
                const getCompSql = 'SELECT competition_id FROM pageant_segments WHERE segment_id = ?';
                db.query(getCompSql, [segment_id], (err, result) => {
                    if (err || result.length === 0) {
                        return db.rollback(() => {
                            console.error('❌ Error getting competition:', err || 'No segment found');
                            res.status(500).json({ 
                                success: false,
                                error: 'Error retrieving competition info: ' + (err?.message || 'Segment not found')
                            });
                        });
                    }

                    const competition_id = result[0].competition_id;
                    console.log('✅ Competition ID:', competition_id);
                    console.log('💾 Saving overall score...');

                    // Step 4: Update or insert overall segment score summary WITH LOCK STATUS
                    const overallSql = `
                        INSERT INTO overall_scores 
                        (judge_id, participant_id, competition_id, segment_id, total_score, general_comments, is_locked, locked_at)
                        VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())
                        ON DUPLICATE KEY UPDATE 
                        total_score = VALUES(total_score), 
                        general_comments = VALUES(general_comments),
                        is_locked = FALSE,
                        locked_at = NOW(),
                        updated_at = CURRENT_TIMESTAMP
                    `;
                    
                    db.query(overallSql, [
                        judge_id, 
                        participant_id, 
                        competition_id, 
                        segment_id,
                        total_score || 0, 
                        general_comments || null
                    ], (err, overallResult) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('❌ Error saving overall score:', err);
                                res.status(500).json({ 
                                    success: false,
                                    error: 'Error saving overall score: ' + err.message 
                                });
                            });
                        }

                        console.log('✅ Overall score saved:', overallResult.insertId || overallResult.affectedRows);
                        console.log('🎉 Committing transaction...');

                        // Step 5: Commit transaction
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('❌ Commit error:', err);
                                    res.status(500).json({ 
                                        success: false,
                                        error: 'Error committing scores: ' + err.message 
                                    });
                                });
                            }

                            console.log('✅✅✅ SUCCESS! All scores saved and committed');
                            res.json({ 
                                success: true, 
                                message: 'Segment scores submitted successfully!',
                                total_score: total_score,
                                scores_saved: insertedCount,
                                should_start_countdown: true // ✅ TRIGGER COUNTDOWN ON FRONTEND
                            });
                        });
                    });
                });
            })
            .catch(err => {
                db.rollback(() => {
                    console.error('❌ Error in Promise.all:', err);
                    console.error('Insert errors:', insertErrors);
                    res.status(500).json({ 
                        success: false,
                        error: 'Error saving segment scores: ' + err.message,
                        details: insertErrors 
                    });
                });
            });
        });
    });
});

// Get all segment scores for a competition (for reporting)
app.get('/competition-segment-scores/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    const sql = `
        SELECT pss.*, 
               ps.segment_name, ps.day_number,
               cc.criteria_name, cc.percentage,
               j.judge_name,
               p.participant_name
        FROM pageant_segment_scores pss
        JOIN pageant_segments ps ON pss.segment_id = ps.segment_id
        JOIN competition_criteria cc ON pss.criteria_id = cc.criteria_id
        JOIN judges j ON pss.judge_id = j.judge_id
        JOIN participants p ON pss.participant_id = p.participant_id
        WHERE ps.competition_id = ?
        ORDER BY p.participant_name, ps.day_number, ps.order_number, cc.order_number
    `;
    
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching competition segment scores:', err);
            return res.status(500).json({ error: 'Error fetching segment scores' });
        }
        res.json(result);
    });
});

// Get participant's total score across all segments
app.get('/participant-total-pageant-score/:participantId/:competitionId', (req, res) => {
    const { participantId, competitionId } = req.params;
    
    const sql = `
        SELECT 
            p.participant_name,
            ps.segment_name,
            ps.day_number,
            j.judge_name,
            SUM(pss.weighted_score) as segment_total,
            COUNT(DISTINCT pss.criteria_id) as criteria_count
        FROM pageant_segment_scores pss
        JOIN pageant_segments ps ON pss.segment_id = ps.segment_id
        JOIN participants p ON pss.participant_id = p.participant_id
        JOIN judges j ON pss.judge_id = j.judge_id
        WHERE pss.participant_id = ? AND ps.competition_id = ?
        GROUP BY ps.segment_id, pss.judge_id, p.participant_name, ps.segment_name, ps.day_number, j.judge_name
        ORDER BY ps.day_number, ps.order_number
    `;
    
    db.query(sql, [participantId, competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching participant pageant scores:', err);
            return res.status(500).json({ error: 'Error fetching scores' });
        }
        
        // Calculate grand total
        let grandTotal = 0;
        result.forEach(segment => {
            grandTotal += parseFloat(segment.segment_total || 0);
        });
        
        res.json({
            segments: result,
            grand_total: grandTotal,
            segment_count: result.length
        });
    });
});

// Get pageant leaderboard
app.get('/pageant-leaderboard/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    const sql = `
        SELECT 
            p.participant_id,
            p.participant_name,
            p.performance_title,
            AVG(os.total_score) as average_score,
            COUNT(DISTINCT os.judge_id) as judge_count,
            COUNT(DISTINCT pss.segment_id) as segments_scored
        FROM participants p
        LEFT JOIN overall_scores os ON p.participant_id = os.participant_id 
            AND os.competition_id = ?
        LEFT JOIN pageant_segment_scores pss ON p.participant_id = pss.participant_id
        LEFT JOIN pageant_segments ps ON pss.segment_id = ps.segment_id 
            AND ps.competition_id = ?
        WHERE p.competition_id = ?
        GROUP BY p.participant_id, p.participant_name, p.performance_title
        HAVING average_score IS NOT NULL
        ORDER BY average_score DESC
    `;
    
    db.query(sql, [competitionId, competitionId, competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching pageant leaderboard:', err);
            return res.status(500).json({ error: 'Error fetching leaderboard' });
        }
        res.json(result);
    });
});

// Get segment scores for editing
app.get('/pageant-segment-scores/:segmentId/:participantId/:judgeId', (req, res) => {
    const { segmentId, participantId, judgeId } = req.params;
    
    const sql = `
        SELECT pss.*, cc.criteria_name, cc.percentage, cc.max_score
        FROM pageant_segment_scores pss
        JOIN competition_criteria cc ON pss.criteria_id = cc.criteria_id
        WHERE pss.segment_id = ? AND pss.participant_id = ? AND pss.judge_id = ?
        ORDER BY cc.order_number
    `;
    
    db.query(sql, [segmentId, participantId, judgeId], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error fetching scores' });
        }
        res.json(result);
    });
});

// Get segment-specific criteria
app.get('/segment-criteria/:segmentId', (req, res) => {
    const { segmentId } = req.params;
    
    const sql = `
        SELECT cc.*, sc.segment_criteria_id
        FROM competition_criteria cc
        JOIN segment_criteria sc ON cc.criteria_id = sc.criteria_id
        WHERE sc.segment_id = ? AND sc.is_active = TRUE
        ORDER BY cc.order_number
    `;
    
    db.query(sql, [segmentId], (err, result) => {
        if (err) {
            console.error('Error fetching segment criteria:', err);
            return res.status(500).json({ error: 'Error fetching segment criteria' });
        }
        res.json(result);
    });
});
// Save draft scores
// ================================================
// FIXED DRAFT ENDPOINTS
// ================================================

// Save draft scores
app.post('/save-draft-scores', (req, res) => {
    const { judge_id, participant_id, segment_id, competition_id, scores, general_comments, total_score } = req.body;
    
    console.log('💾 Saving draft:', { judge_id, participant_id, segment_id, competition_id });
    
    if (!judge_id || !participant_id || !competition_id) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields' 
        });
    }
    
    const draftData = JSON.stringify({ 
        scores: scores || [], 
        general_comments: general_comments || '', 
        total_score: total_score || 0 
    });
    
    const sql = `
        INSERT INTO draft_scores 
        (judge_id, participant_id, segment_id, competition_id, draft_data, saved_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        draft_data = VALUES(draft_data),
        saved_at = NOW()
    `;
    
    db.query(sql, [
        judge_id, 
        participant_id, 
        segment_id || null, 
        competition_id,
        draftData
    ], (err, result) => {
        if (err) {
            console.error('❌ Draft save error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error: ' + err.message 
            });
        }
        
        console.log('✅ Draft saved');
        res.json({ 
            success: true,
            message: 'Draft saved',
            saved_at: new Date().toISOString()
        });
    });
});

// Get draft scores
// ================================================
// FIXED: Get draft scores - TWO ROUTES (no optional params)
// ================================================

// Get draft WITH segmentId
app.get('/get-draft-scores/:judgeId/:participantId/:competitionId/:segmentId', (req, res) => {
    const { judgeId, participantId, competitionId, segmentId } = req.params;
    
    let sql = `
        SELECT draft_data, saved_at 
        FROM draft_scores 
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id = ?
    `;
    
    db.query(sql, [judgeId, participantId, competitionId, segmentId], (err, result) => {
        if (err) {
            console.error('❌ Error getting draft:', err);
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        if (result.length > 0) {
            try {
                const draft = JSON.parse(result[0].draft_data);
                res.json({ 
                    success: true, 
                    draft: draft,
                    saved_at: result[0].saved_at
                });
            } catch (parseError) {
                res.json({ 
                    success: false, 
                    message: 'Draft data corrupted' 
                });
            }
        } else {
            res.json({ 
                success: false, 
                message: 'No draft found' 
            });
        }
    });
});

// Get draft WITHOUT segmentId (regular competition)
app.get('/get-draft-scores/:judgeId/:participantId/:competitionId', (req, res) => {
    const { judgeId, participantId, competitionId } = req.params;
    
    let sql = `
        SELECT draft_data, saved_at 
        FROM draft_scores 
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id IS NULL
    `;
    
    db.query(sql, [judgeId, participantId, competitionId], (err, result) => {
        if (err) {
            console.error('❌ Error getting draft:', err);
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        if (result.length > 0) {
            try {
                const draft = JSON.parse(result[0].draft_data);
                res.json({ 
                    success: true, 
                    draft: draft,
                    saved_at: result[0].saved_at
                });
            } catch (parseError) {
                res.json({ 
                    success: false, 
                    message: 'Draft data corrupted' 
                });
            }
        } else {
            res.json({ 
                success: false, 
                message: 'No draft found' 
            });
        }
    });
});

// ================================================
// FIXED: Delete draft - TWO ROUTES (no optional params)
// ================================================

// Delete draft WITH segmentId
app.delete('/delete-draft-scores/:judgeId/:participantId/:competitionId/:segmentId', (req, res) => {
    const { judgeId, participantId, competitionId, segmentId } = req.params;
    
    let sql = 'DELETE FROM draft_scores WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id = ?';
    
    db.query(sql, [judgeId, participantId, competitionId, segmentId], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        res.json({ 
            success: true,
            deleted: result.affectedRows > 0
        });
    });
});

// Delete draft WITHOUT segmentId (regular competition)
app.delete('/delete-draft-scores/:judgeId/:participantId/:competitionId', (req, res) => {
    const { judgeId, participantId, competitionId } = req.params;
    
    let sql = 'DELETE FROM draft_scores WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id IS NULL';
    
    db.query(sql, [judgeId, participantId, competitionId], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        res.json({ 
            success: true,
            deleted: result.affectedRows > 0
        });
    });
});

console.log('✅ Fixed draft endpoints loaded (4 routes total)');

console.log('✅ Fixed draft endpoints loaded');

// Assign criteria to a segment
app.post('/assign-segment-criteria', (req, res) => {
    const { segment_id, criteria_ids } = req.body;
    
    if (!segment_id || !criteria_ids || criteria_ids.length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'Segment ID and criteria IDs are required' 
        });
    }
    
    // First, delete existing criteria assignments for this segment
    db.query('DELETE FROM segment_criteria WHERE segment_id = ?', [segment_id], (err) => {
        if (err) {
            console.error('Error deleting old segment criteria:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error updating segment criteria' 
            });
        }
        
        // Insert new criteria assignments
        const insertPromises = criteria_ids.map(criteria_id => {
            return new Promise((resolve, reject) => {
                const sql = `
                    INSERT INTO segment_criteria (segment_id, criteria_id) 
                    VALUES (?, ?)
                `;
                db.query(sql, [segment_id, criteria_id], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        });
        
        Promise.all(insertPromises)
        .then(() => {
            res.json({ 
                success: true, 
                message: 'Segment criteria assigned successfully!' 
            });
        })
        .catch(err => {
            console.error('Error inserting segment criteria:', err);
            res.status(500).json({ 
                success: false,
                error: 'Error assigning segment criteria' 
            });
        });
    });
});
console.log('✅ Pageant Segment Scoring Endpoints Added');

// ================================================
// SCORE LOCKING & UNLOCK REQUEST ENDPOINTS
// NEW CODE - ADD THIS ENTIRE SECTION
// ================================================

// Check if score is locked
// ✅ BEST APPROACH - Two separate routes
// Route WITH segmentId
// ================================================
// FIXED SCORE LOCKING ENDPOINTS
// ================================================

// Check if score is locked - WITH segmentId
app.get('/check-score-lock/:judgeId/:participantId/:competitionId/:segmentId', (req, res) => {
    const { judgeId, participantId, competitionId, segmentId } = req.params;
    
    let sql = `
        SELECT is_locked, locked_at, 
               TIMESTAMPDIFF(SECOND, locked_at, NOW()) as seconds_since_lock
        FROM overall_scores
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id = ?
    `;
    
    db.query(sql, [judgeId, participantId, competitionId, segmentId], (err, result) => {
        if (err) {
            console.error('Error checking lock:', err);
            return res.status(500).json({ error: 'Error checking lock status' });
        }
        
        if (result.length === 0) {
            return res.json({ 
                is_locked: false, 
                can_edit: true,
                seconds_remaining: 10
            });
        }
        
        const score = result[0];
        const secondsSinceLock = score.seconds_since_lock || 0;
        
       const canEdit = !score.is_locked || secondsSinceLock < 10;
        const secondsRemaining = Math.max(0, 10 - secondsSinceLock);
        
        console.log(`🔍 Lock check: locked=${score.is_locked}, seconds=${secondsSinceLock}, can_edit=${canEdit}`);
        
        res.json({
            is_locked: score.is_locked,
            locked_at: score.locked_at,
            seconds_since_lock: secondsSinceLock,
            can_edit: canEdit,
            seconds_remaining: secondsRemaining
        });
    });
});

// Check if score is locked - WITHOUT segmentId
app.get('/check-score-lock/:judgeId/:participantId/:competitionId', (req, res) => {
    const { judgeId, participantId, competitionId } = req.params;
    
    let sql = `
        SELECT is_locked, locked_at, 
               TIMESTAMPDIFF(SECOND, locked_at, NOW()) as seconds_since_lock
        FROM overall_scores
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id IS NULL
    `;
    
    db.query(sql, [judgeId, participantId, competitionId], (err, result) => {
        if (err) {
            console.error('Error checking lock:', err);
            return res.status(500).json({ error: 'Error checking lock status' });
        }
        
        if (result.length === 0) {
            return res.json({ 
                is_locked: false, 
                can_edit: true,
                seconds_remaining: 10
            });
        }
        
        const score = result[0];
        const secondsSinceLock = score.seconds_since_lock || 0;
        
       const canEdit = !score.is_locked || secondsSinceLock < 10;
    const secondsRemaining = Math.max(0, 10 - secondsSinceLock);
        
        res.json({
            is_locked: score.is_locked,
            locked_at: score.locked_at,
            seconds_since_lock: secondsSinceLock,
            can_edit: canEdit,
            seconds_remaining: secondsRemaining
        });
    });
});

console.log('✅ Fixed lock check endpoints loaded');

// Route WITHOUT segmentId
app.get('/check-score-lock/:judgeId/:participantId/:competitionId', (req, res) => {
    const { judgeId, participantId, competitionId } = req.params;
    
    let sql = `
        SELECT is_locked, locked_at, 
               TIMESTAMPDIFF(SECOND, locked_at, NOW()) as seconds_since_lock
        FROM overall_scores
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id IS NULL
    `;
    
    db.query(sql, [judgeId, participantId, competitionId], (err, result) => {
        if (err) {
            console.error('Error checking lock:', err);
            return res.status(500).json({ error: 'Error checking lock status' });
        }
        
        if (result.length === 0) {
            return res.json({ is_locked: false, can_edit: true });
        }
        
        const score = result[0];
        const canEdit = !score.is_locked || (score.seconds_since_lock && score.seconds_since_lock < 10);
        
        res.json({
            is_locked: score.is_locked,
            locked_at: score.locked_at,
            seconds_since_lock: score.seconds_since_lock || 0,
            can_edit: canEdit
        });
    });
});


app.get('/check-score-lock/:judgeId/:participantId/:competitionId/:segmentId', (req, res) => {
    const { judgeId, participantId, competitionId, segmentId } = req.params;
    
    let sql = `
        SELECT is_locked, locked_at, 
               TIMESTAMPDIFF(SECOND, locked_at, NOW()) as seconds_since_lock
        FROM overall_scores
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id = ?
    `;
    
    db.query(sql, [judgeId, participantId, competitionId, segmentId], (err, result) => {
        if (err) {
            console.error('Error checking lock:', err);
            return res.status(500).json({ error: 'Error checking lock status' });
        }
        
        if (result.length === 0) {
            // No score exists yet - not locked
            return res.json({ is_locked: false, can_edit: true });
        }
        
        const score = result[0];
        
        // Can edit if: NOT locked OR locked less than 45 seconds ago
        const canEdit = !score.is_locked || (score.seconds_since_lock && score.seconds_since_lock < 10);
        
        res.json({
            is_locked: score.is_locked,
            locked_at: score.locked_at,
            seconds_since_lock: score.seconds_since_lock || 0,
            can_edit: canEdit,
            score_exists: true
        });
    });
});

// Check score lock status - WITHOUT segmentId (regular competition)
app.get('/check-score-lock/:judgeId/:participantId/:competitionId', (req, res) => {
    const { judgeId, participantId, competitionId } = req.params;
    
    let sql = `
        SELECT is_locked, locked_at, 
               TIMESTAMPDIFF(SECOND, locked_at, NOW()) as seconds_since_lock
        FROM overall_scores
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id IS NULL
    `;
    
    db.query(sql, [judgeId, participantId, competitionId], (err, result) => {
        if (err) {
            console.error('Error checking lock:', err);
            return res.status(500).json({ error: 'Error checking lock status' });
        }
        
        if (result.length === 0) {
            // No score exists yet - not locked
            return res.json({ is_locked: false, can_edit: true });
        }
        
        const score = result[0];
        
        // Can edit if: NOT locked OR locked less than 45 seconds ago
        const canEdit = !score.is_locked || (score.seconds_since_lock && score.seconds_since_lock < 10);
        
        res.json({
            is_locked: score.is_locked,
            locked_at: score.locked_at,
            seconds_since_lock: score.seconds_since_lock || 0,
            can_edit: canEdit,
            score_exists: true
        });
    });
});

console.log('Check lock endpoints added');
// ================================================
// FIXED AUTO-LOCK ENDPOINT
// ================================================
app.post('/auto-lock-score', (req, res) => {
    const { judge_id, participant_id, competition_id, segment_id, score_type } = req.body;
    
    console.log('🔒 Auto-locking score:', { judge_id, participant_id, competition_id, segment_id, score_type });
    
    let sql = `
        UPDATE overall_scores
        SET is_locked = TRUE, locked_at = NOW()
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ?
    `;
    
    const params = [judge_id, participant_id, competition_id];
    
    if (segment_id && segment_id !== 'null' && segment_id !== 'undefined') {
        sql += ' AND segment_id = ?';
        params.push(segment_id);
    } else {
        sql += ' AND segment_id IS NULL';
    }
    
    sql += ' AND (is_locked = FALSE OR is_locked IS NULL)';
    
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('❌ Auto-lock error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error locking score' 
            });
        }
        
        console.log('✅ Auto-lock result, affected rows:', result.affectedRows);
        
        if (result.affectedRows === 0) {
            return res.json({ 
                success: true, 
                message: 'Score already locked',
                already_locked: true
            });
        }
        
        const getScoreIdSql = `
            SELECT overall_score_id FROM overall_scores
            WHERE judge_id = ? AND participant_id = ? AND competition_id = ?
            ${segment_id && segment_id !== 'null' && segment_id !== 'undefined' ? 'AND segment_id = ?' : 'AND segment_id IS NULL'}
        `;

        const scoreParams = [judge_id, participant_id, competition_id];
        if (segment_id && segment_id !== 'null' && segment_id !== 'undefined') {
            scoreParams.push(segment_id);
        }

        db.query(getScoreIdSql, scoreParams, (err, scoreResult) => {
            if (err || scoreResult.length === 0) {
                return res.json({ 
                    success: true, 
                    message: 'Score locked successfully',
                    affected_rows: result.affectedRows
                });
            }
            
            const overall_score_id = scoreResult[0].overall_score_id;
            
            const historySql = `
                INSERT INTO score_edit_history 
                (score_id, judge_id, participant_id, competition_id, segment_id, score_type, edit_type, edited_at)
                VALUES (?, ?, ?, ?, ?, ?, 'auto_lock', NOW())
            `;
            
            db.query(historySql, [
                overall_score_id,
                judge_id, 
                participant_id, 
                competition_id, 
                segment_id || null, 
                score_type || 'overall'
            ], (err) => {
                if (err) {
                    console.error('⚠️ Error logging history:', err);
                }
                
                res.json({ 
                    success: true, 
                    message: 'Score locked successfully',
                    affected_rows: result.affectedRows,
                    locked_at: new Date().toISOString()
                });
            });
        });
    });
});

console.log('✅ Fixed auto-lock endpoint loaded');

// Submit unlock request
app.post('/request-unlock', (req, res) => {
    const { judge_id, participant_id, segment_id, competition_id, reason, score_type } = req.body;
    
    console.log(' Unlock request received:', { judge_id, participant_id, competition_id, segment_id, score_type });
    
    if (!judge_id || !participant_id || !competition_id || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if there's already a pending request
    const checkSql = `
        SELECT * FROM unlock_requests 
        WHERE judge_id = ? AND participant_id = ? AND competition_id = ?
        AND (segment_id = ? OR (segment_id IS NULL AND ? IS NULL))
        AND status = 'pending'
    `;
    
    db.query(checkSql, [judge_id, participant_id, competition_id, segment_id || null, segment_id || null], (err, existing) => {
        if (err) {
            console.error('Error checking existing requests:', err);
            return res.status(500).json({ error: 'Error checking existing requests' });
        }
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                error: 'You already have a pending unlock request for this score' 
            });
        }
        
        // Create unlock request
        const sql = `
            INSERT INTO unlock_requests 
            (judge_id, participant_id, segment_id, competition_id, score_type, reason, status, requested_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;
        
        db.query(sql, [
            judge_id, 
            participant_id, 
            segment_id || null, 
            competition_id, 
            score_type || 'overall', 
            reason
        ], (err, result) => {
            if (err) {
                console.error('Error creating unlock request:', err);
                return res.status(500).json({ error: 'Error submitting unlock request' });
            }
            
            console.log('✅ Unlock request created, ID:', result.insertId);
            
            res.json({ 
                success: true, 
                message: 'Unlock request submitted successfully! Admin will review it shortly.',
                request_id: result.insertId
            });
        });
    });
});

// Get all unlock requests (for admin)
app.get('/unlock-requests', (req, res) => {
    const sql = `
        SELECT 
            ur.*,
            j.judge_name,
            p.participant_name,
            c.competition_name,
            ps.segment_name,
            u.username as reviewed_by_username,
            TIMESTAMPDIFF(HOUR, ur.requested_at, NOW()) as hours_pending
        FROM unlock_requests ur
        JOIN judges j ON ur.judge_id = j.judge_id
        JOIN participants p ON ur.participant_id = p.participant_id
        JOIN competitions c ON ur.competition_id = c.competition_id
        LEFT JOIN pageant_segments ps ON ur.segment_id = ps.segment_id
        LEFT JOIN users u ON ur.reviewed_by_user_id = u.user_id
        ORDER BY 
            CASE ur.status 
                WHEN 'pending' THEN 1 
                WHEN 'approved' THEN 2 
                WHEN 'rejected' THEN 3 
            END,
            ur.requested_at DESC
    `;
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching unlock requests:', err);
            return res.status(500).json({ error: 'Error fetching unlock requests' });
        }
        res.json(result);
    });
});

// Get unlock requests for a specific judge
app.get('/unlock-requests/judge/:judgeId', (req, res) => {
    const { judgeId } = req.params;
    
    const sql = `
        SELECT 
            ur.*,
            p.participant_name,
            c.competition_name,
            ps.segment_name,
            u.username as reviewed_by_username
        FROM unlock_requests ur
        JOIN participants p ON ur.participant_id = p.participant_id
        JOIN competitions c ON ur.competition_id = c.competition_id
        LEFT JOIN pageant_segments ps ON ur.segment_id = ps.segment_id
        LEFT JOIN users u ON ur.reviewed_by_user_id = u.user_id
        WHERE ur.judge_id = ?
        ORDER BY ur.requested_at DESC
    `;
    
    db.query(sql, [judgeId], (err, result) => {
        if (err) {
            console.error('Error fetching judge unlock requests:', err);
            return res.status(500).json({ error: 'Error fetching unlock requests' });
        }
        res.json(result);
    });
});

// Approve or reject unlock request (admin only)
app.post('/review-unlock-request/:requestId', (req, res) => {
    const { requestId } = req.params;
    const { action, admin_notes, admin_user_id } = req.body;
    
    console.log('👨‍💼 Admin reviewing request:', requestId, 'Action:', action);
    
    if (!action || (action !== 'approve' && action !== 'reject')) {
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Get request details first
    db.query('SELECT * FROM unlock_requests WHERE request_id = ?', [requestId], (err, requests) => {
        if (err || requests.length === 0) {
            return res.status(500).json({ error: 'Unlock request not found' });
        }
        
        const request = requests[0];
        
        // Update unlock request status
        const updateRequestSql = `
            UPDATE unlock_requests 
            SET status = ?, reviewed_by_user_id = ?, reviewed_at = NOW(), admin_notes = ?
            WHERE request_id = ?
        `;
        
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        
        db.query(updateRequestSql, [newStatus, admin_user_id, admin_notes, requestId], (err) => {
            if (err) {
                console.error('Error updating unlock request:', err);
                return res.status(500).json({ error: 'Error updating unlock request' });
            }
            
            console.log('✅ Request status updated to:', newStatus);
            
            // If approved, unlock the score
            if (action === 'approve') {
                let unlockSql = `
                    UPDATE overall_scores
                    SET is_locked = FALSE, locked_at = NULL
                    WHERE judge_id = ? AND participant_id = ? AND competition_id = ?
                `;
                
                const unlockParams = [request.judge_id, request.participant_id, request.competition_id];
                
                if (request.segment_id) {
                    unlockSql += ' AND segment_id = ?';
                    unlockParams.push(request.segment_id);
                } else {
                    unlockSql += ' AND segment_id IS NULL';
                }
                
                db.query(unlockSql, unlockParams, (err, unlockResult) => {
                    if (err) {
                        console.error('Error unlocking score:', err);
                        return res.status(500).json({ error: 'Error unlocking score' });
                    }
                    
                    console.log('Score unlocked, affected rows:', unlockResult.affectedRows);
                    
                    // Log the admin unlock
                    const historySql = `
                        INSERT INTO score_edit_history 
                        (judge_id, participant_id, competition_id, segment_id, score_type, edit_type, edited_by_user_id, edit_reason, edited_at)
                        VALUES (?, ?, ?, ?, ?, 'admin_unlock', ?, ?, NOW())
                    `;
                    
                    db.query(historySql, [
                        request.judge_id, 
                        request.participant_id, 
                        request.competition_id,
                        request.segment_id,
                        request.score_type,
                        admin_user_id,
                        admin_notes || 'Admin approved unlock request'
                    ]);
                    
                    res.json({ 
                        success: true, 
                        message: 'Unlock request approved! Judge can now edit the score.',
                        action: 'approved'
                    });
                });
            } else {
                res.json({ 
                    success: true, 
                    message: 'Unlock request rejected.',
                    action: 'rejected'
                });
            }
        });
    });
});

console.log('✅ Score Locking & Unlock Request Endpoints Added');