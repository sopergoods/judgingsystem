const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '')));

// Enhanced MySQL connection with better error handling
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'judging_system',
    multipleStatements: true
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to Enhanced MySQL database');
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
        participant_name, email, phone, age, gender, 
        school_organization, performance_title, performance_description, 
        competition_id, status,
        // Pageant specific fields
        height, measurements, talents, special_awards
    } = req.body;

    if (!participant_name || !email || !age || !gender || !competition_id) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    // FIX: Remove the double comma in the SQL statement
    const sql = `INSERT INTO participants 
                (participant_name, email, phone, age, gender, school_organization, 
                 performance_title, performance_description, competition_id, status,
                 height, measurements, talents, special_awards) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [
        participant_name, email, phone, age, gender, school_organization,
        performance_title, performance_description, competition_id, status || 'pending',
        height, measurements, talents, special_awards
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

// Submit pageant segment scores
app.post('/submit-segment-scores', (req, res) => {
    const { judge_id, participant_id, segment_id, scores } = req.body;
    
    if (!judge_id || !participant_id || !segment_id || !scores || scores.length === 0) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    // Delete existing scores for this segment
    db.query('DELETE FROM pageant_segment_scores WHERE judge_id = ? AND participant_id = ? AND segment_id = ?', 
        [judge_id, participant_id, segment_id], (err) => {
        if (err) {
            console.error('Error deleting old segment scores:', err);
            return res.status(500).json({ error: 'Error updating scores' });
        }

        // Insert new scores
        const insertPromises = scores.map(score => {
            return new Promise((resolve, reject) => {
                const sql = `
                    INSERT INTO pageant_segment_scores 
                    (judge_id, participant_id, segment_id, criteria_id, score, weighted_score, comments) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(sql, [
                    judge_id, participant_id, segment_id, 
                    score.criteria_id, score.score, score.weighted_score, score.comments
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        });

        Promise.all(insertPromises)
            .then(() => {
                res.json({ 
                    success: true, 
                    message: 'Segment scores submitted successfully!'
                });
            })
            .catch(err => {
                console.error('Error inserting segment scores:', err);
                res.status(500).json({ error: 'Error saving segment scores' });
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
app.listen(port, () => {
    console.log(`running na sya guys http://localhost:${port}`);
   ;

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

// Submit segment scores - FIXED VERSION
app.post('/submit-segment-scores', (req, res) => {
    const { judge_id, participant_id, segment_id, scores, general_comments, total_score } = req.body;
    
    if (!judge_id || !participant_id || !segment_id || !scores || scores.length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'Required fields missing' 
        });
    }

    // Start transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Database transaction error' 
            });
        }

        // Delete existing scores for this judge-participant-segment combination
        const deleteSql = `
            DELETE FROM pageant_segment_scores 
            WHERE judge_id = ? AND participant_id = ? AND segment_id = ?
        `;
        
        db.query(deleteSql, [judge_id, participant_id, segment_id], (err) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error deleting old scores:', err);
                    res.status(500).json({ 
                        success: false,
                        error: 'Error updating scores' 
                    });
                });
            }

            // Insert new scores
            const insertPromises = scores.map(score => {
                return new Promise((resolve, reject) => {
                    const sql = `
                        INSERT INTO pageant_segment_scores 
                        (judge_id, participant_id, segment_id, criteria_id, score, weighted_score, comments) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.query(sql, [
                        judge_id, 
                        participant_id, 
                        segment_id, 
                        score.criteria_id, 
                        score.score, 
                        score.weighted_score, 
                        score.comments || null
                    ], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            });

            Promise.all(insertPromises)
            .then(() => {
                // Get competition_id from segment
                const getCompSql = 'SELECT competition_id FROM pageant_segments WHERE segment_id = ?';
                db.query(getCompSql, [segment_id], (err, result) => {
                    if (err || result.length === 0) {
                        return db.rollback(() => {
                            res.status(500).json({ 
                                success: false,
                                error: 'Error retrieving competition info' 
                            });
                        });
                    }

                    const competition_id = result[0].competition_id;

                    // Update or insert overall segment score summary
                    const overallSql = `
                        INSERT INTO overall_scores 
                        (judge_id, participant_id, competition_id, total_score, general_comments, segment_id)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                        total_score = VALUES(total_score), 
                        general_comments = VALUES(general_comments),
                        updated_at = CURRENT_TIMESTAMP
                    `;
                    
                    db.query(overallSql, [
                        judge_id, 
                        participant_id, 
                        competition_id, 
                        total_score || 0, 
                        general_comments || null, 
                        segment_id
                    ], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error saving overall score:', err);
                                res.status(500).json({ 
                                    success: false,
                                    error: 'Error saving overall score' 
                                });
                            });
                        }

                        // Commit transaction
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Commit error:', err);
                                    res.status(500).json({ 
                                        success: false,
                                        error: 'Error committing scores' 
                                    });
                                });
                            }

                            res.json({ 
                                success: true, 
                                message: 'Segment scores submitted successfully!',
                                total_score: total_score
                            });
                        });
                    });
                });
            })
            .catch(err => {
                db.rollback(() => {
                    console.error('Error inserting segment scores:', err);
                    res.status(500).json({ 
                        success: false,
                        error: 'Error saving segment scores' 
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