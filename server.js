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

// Delete an event type (only if not used by any competitions)
app.delete('/delete-event-type/:id', (req, res) => {
  const { id } = req.params;

  // First, check if any competitions are using this event type
  const checkSql = 'SELECT COUNT(*) AS cnt FROM competitions WHERE event_type_id = ?';
  db.query(checkSql, [id], (err, rows) => {
    if (err) {
      console.error('Error checking event type usage:', err);
      return res.status(500).json({ success: false, error: 'Database error checking usage' });
    }

    const count = rows?.[0]?.cnt || 0;
    if (count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete: this event type is used by ${count} competition(s).`
      });
    }

    // Safe to delete
    const delSql = 'DELETE FROM event_types WHERE event_type_id = ?';
    db.query(delSql, [id], (err2, result) => {
      if (err2) {
        console.error('Error deleting event type:', err2);
        return res.status(500).json({ success: false, error: 'Error deleting event type' });
      }
      return res.json({ success: true, message: 'Event type deleted successfully!' });
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
        status || 'Active',
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
    
    console.log('📊 Fetching competitions for judge:', judgeId);
    
    const sql = `
        SELECT DISTINCT 
            c.competition_id, 
            c.competition_name, 
            c.competition_date, 
            c.event_description,
            et.type_name, 
            et.is_pageant,
            COUNT(DISTINCT p.participant_id) as participant_count,
            COUNT(DISTINCT j.judge_id) as total_judges
        FROM competitions c
        JOIN event_types et ON c.event_type_id = et.event_type_id
        JOIN judges j ON c.competition_id = j.competition_id
        LEFT JOIN participants p ON c.competition_id = p.competition_id
        WHERE j.judge_id = ? 
        GROUP BY c.competition_id, c.competition_name, c.competition_date, 
                 c.event_description, et.type_name, et.is_pageant
        ORDER BY c.competition_date DESC
    `;
    
    db.query(sql, [judgeId], (err, competitions) => {
        if (err) {
            console.error('❌ Error fetching judge competitions:', err);
            return res.status(500).json({ error: 'Error fetching judge competitions' });
        }
        
        console.log(`📋 Found ${competitions.length} competitions for judge ${judgeId}`);
        
        // For each competition, calculate correct scoring progress
        const promises = competitions.map(comp => {
            return new Promise((resolve, reject) => {
                if (comp.is_pageant) {
                    // FOR PAGEANTS: Count unique participant-segment combinations
                    const pageantSql = `
                        SELECT 
                            COUNT(DISTINCT CONCAT(p.participant_id, '-', ps.segment_id)) as total_required,
                            COUNT(DISTINCT CASE 
                                WHEN os.score_id IS NOT NULL 
                                THEN CONCAT(os.participant_id, '-', os.segment_id) 
                            END) as scored_count
                        FROM participants p
                        CROSS JOIN pageant_segments ps
                        LEFT JOIN overall_scores os 
                            ON p.participant_id = os.participant_id 
                            AND ps.segment_id = os.segment_id 
                            AND os.judge_id = ?
                        WHERE p.competition_id = ? 
                            AND ps.competition_id = ?
                            AND ps.is_active = TRUE
                    `;
                    
                    db.query(pageantSql, [judgeId, comp.competition_id, comp.competition_id], (err, result) => {
                        if (err) {
                            console.error('❌ Error calculating pageant progress:', err);
                            reject(err);
                        } else {
                            comp.scored_count = result[0].scored_count || 0;
                            comp.total_required = result[0].total_required || 0;
                            console.log(`✅ PAGEANT ${comp.competition_name}: ${comp.scored_count}/${comp.total_required}`);
                            resolve(comp);
                        }
                    });
                } else {
                    // FOR REGULAR: Count participant scores (FIXED - exclude pageant scores)
                    const regularSql = `
                        SELECT 
                            COUNT(DISTINCT p.participant_id) as total_required,
                            COUNT(DISTINCT CASE 
                                WHEN os.score_id IS NOT NULL 
                                THEN os.participant_id 
                            END) as scored_count,
                            GROUP_CONCAT(DISTINCT p.participant_id ORDER BY p.participant_id) as all_participant_ids,
                            GROUP_CONCAT(DISTINCT CASE 
                                WHEN os.score_id IS NOT NULL 
                                THEN os.participant_id 
                            END ORDER BY os.participant_id) as scored_participant_ids
                        FROM participants p
                        LEFT JOIN overall_scores os 
                            ON p.participant_id = os.participant_id 
                            AND os.judge_id = ?
                            AND os.competition_id = ?
                            AND os.segment_id IS NULL
                        WHERE p.competition_id = ?
                    `;
                    
                    db.query(regularSql, [judgeId, comp.competition_id, comp.competition_id], (err, result) => {
                        if (err) {
                            console.error('❌ Error calculating regular progress:', err);
                            reject(err);
                        } else {
                            comp.scored_count = result[0].scored_count || 0;
                            comp.total_required = result[0].total_required || 0;
                            
                            console.log(`✅ REGULAR ${comp.competition_name}:`, {
                                scored: comp.scored_count,
                                total: comp.total_required,
                                all_participants: result[0].all_participant_ids,
                                scored_participants: result[0].scored_participant_ids
                            });
                            
                            resolve(comp);
                        }
                    });
                }
            });
        });
        
        Promise.all(promises)
            .then(results => {
                console.log('✅ Judge competitions loaded with CORRECT progress tracking');
                res.json(results);
            })
            .catch(err => {
                console.error('❌ Error calculating progress:', err);
                res.status(500).json({ error: 'Error calculating progress: ' + err.message });
            });
    });
});

app.get('/judge-pageant-progress/:judgeId/:competitionId', (req, res) => {
    const { judgeId, competitionId } = req.params;
    
    const sql = `
        SELECT 
            p.participant_id,
            p.participant_name,
            p.contestant_number,
            ps.segment_id,
            ps.segment_name,
            ps.day_number,
            ps.order_number,
            CASE 
                WHEN os.score_id IS NOT NULL THEN TRUE 
                ELSE FALSE 
            END as is_scored
        FROM participants p
        CROSS JOIN pageant_segments ps
        LEFT JOIN overall_scores os 
            ON p.participant_id = os.participant_id 
            AND ps.segment_id = os.segment_id 
            AND os.judge_id = ?
        WHERE p.competition_id = ? 
            AND ps.competition_id = ?
            AND ps.is_active = TRUE
        ORDER BY p.participant_name, ps.day_number, ps.order_number
    `;
    
    db.query(sql, [judgeId, competitionId, competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching pageant progress:', err);
            return res.status(500).json({ error: 'Error fetching progress' });
        }
        
        // Group by participant
        const participantProgress = {};
        
        result.forEach(row => {
            if (!participantProgress[row.participant_id]) {
                participantProgress[row.participant_id] = {
                    participant_id: row.participant_id,
                    participant_name: row.participant_name,
                    contestant_number: row.contestant_number,
                    segments: [],
                    scored_count: 0,
                    total_segments: 0
                };
            }
            
            participantProgress[row.participant_id].segments.push({
                segment_id: row.segment_id,
                segment_name: row.segment_name,
                day_number: row.day_number,
                order_number: row.order_number,
                is_scored: row.is_scored
            });
            
            participantProgress[row.participant_id].total_segments++;
            
            if (row.is_scored) {
                participantProgress[row.participant_id].scored_count++;
            }
        });
        
        res.json({
            participants: Object.values(participantProgress),
            summary: {
                total_participants: Object.keys(participantProgress).length,
                total_segments: result.length,
                scored_segments: result.filter(r => r.is_scored).length
            }
        });
    });
});



console.log(' Fixed endpoint loaded - Pageant scoring progress now shows correctly');

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










console.log('✅ FIXED: Single countdown - scores saved unlocked, frontend locks after 10 seconds');

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


app.get('/pageant-leaderboard/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    // Step 1: Get all segment scores grouped by participant and segment
    const sql = `
        SELECT 
            p.participant_id,
            p.participant_name,
            p.contestant_number,
            p.performance_title,
            ps.segment_id,
            ps.segment_name,
            ps.day_number,
            os.judge_id,
            os.total_score
        FROM participants p
        JOIN overall_scores os ON p.participant_id = os.participant_id
        JOIN pageant_segments ps ON os.segment_id = ps.segment_id
        WHERE ps.competition_id = ? AND ps.is_active = TRUE
        ORDER BY p.participant_id, ps.day_number, ps.order_number
    `;
    
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('❌ Error fetching pageant leaderboard:', err);
            return res.status(500).json({ error: 'Error fetching leaderboard: ' + err.message });
        }
        
        if (result.length === 0) {
            return res.json([]);
        }
        
        // Step 2: Group scores by participant and segment
        const participantMap = {};
        
        result.forEach(row => {
            if (!participantMap[row.participant_id]) {
                participantMap[row.participant_id] = {
                    participant_id: row.participant_id,
                    participant_name: row.participant_name,
                    contestant_number: row.contestant_number,
                    performance_title: row.performance_title,
                    segments: {},
                    judges: new Set(),
                    segments_completed: new Set()
                };
            }
            
            const participant = participantMap[row.participant_id];
            participant.judges.add(row.judge_id);
            participant.segments_completed.add(row.segment_id);
            
            // Group by segment
            if (!participant.segments[row.segment_id]) {
                participant.segments[row.segment_id] = {
                    name: row.segment_name,
                    day_number: row.day_number,
                    scores: []
                };
            }
            
            participant.segments[row.segment_id].scores.push(row.total_score);
        });
        
        // Step 3: Calculate SEGMENT AVERAGES first, then overall average
        const leaderboard = Object.values(participantMap).map(participant => {
            const segmentAverages = [];
            
            // For each segment, calculate the average across all judges
            Object.values(participant.segments).forEach(segment => {
                const sum = segment.scores.reduce((acc, score) => acc + parseFloat(score), 0);
                const average = sum / segment.scores.length;
                segmentAverages.push(average);
            });
            
            // Overall average is the average of segment averages
            const overallAverage = segmentAverages.length > 0 
                ? segmentAverages.reduce((acc, avg) => acc + avg, 0) / segmentAverages.length 
                : 0;
            
            return {
                participant_id: participant.participant_id,
                participant_name: participant.participant_name,
                contestant_number: participant.contestant_number,
                performance_title: participant.performance_title,
                average_score: overallAverage.toFixed(2),
                judge_count: participant.judges.size,
                segments_completed: participant.segments_completed.size
            };
        });
        
        // Step 4: Sort by average score descending
        leaderboard.sort((a, b) => parseFloat(b.average_score) - parseFloat(a.average_score));
        
        console.log('✅ Pageant leaderboard calculated correctly with segment averaging');
        res.json(leaderboard);
    });
});



app.get('/overall-scores/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    // First, check if this is a pageant competition
    db.query('SELECT is_pageant FROM competitions c JOIN event_types et ON c.event_type_id = et.event_type_id WHERE c.competition_id = ?', 
        [competitionId], (err, compResult) => {
        
        if (err || compResult.length === 0) {
            console.error('Error checking competition type:', err);
            return res.status(500).json({ error: 'Error fetching competition' });
        }
        
        const isPageant = compResult[0].is_pageant;
        
        if (isPageant) {
            // FOR PAGEANTS: Use the SAME calculation as /pageant-leaderboard
            console.log('📊 Fetching PAGEANT scores with segment averaging for competition:', competitionId);
            
            const sql = `
                SELECT 
                    p.participant_id,
                    p.participant_name,
                    p.contestant_number,
                    p.performance_title,
                    ps.segment_id,
                    ps.segment_name,
                    ps.day_number,
                    os.judge_id,
                    j.judge_name,
                    os.total_score
                FROM participants p
                JOIN overall_scores os ON p.participant_id = os.participant_id
                JOIN judges j ON os.judge_id = j.judge_id
                JOIN pageant_segments ps ON os.segment_id = ps.segment_id
                WHERE ps.competition_id = ? AND ps.is_active = TRUE
                ORDER BY p.participant_id, ps.day_number, ps.order_number, os.judge_id
            `;
            
            db.query(sql, [competitionId], (err, result) => {
                if (err) {
                    console.error('❌ Error fetching pageant scores:', err);
                    return res.status(500).json({ error: 'Error fetching scores' });
                }
                
                if (result.length === 0) {
                    return res.json([]);
                }
                
                // STEP 1: Group by participant and segment
                const participantMap = {};
                
                result.forEach(row => {
                    if (!participantMap[row.participant_id]) {
                        participantMap[row.participant_id] = {
                            participant_id: row.participant_id,
                            participant_name: row.participant_name,
                            contestant_number: row.contestant_number,
                            performance_title: row.performance_title,
                            segments: {},
                            all_judges: new Set()
                        };
                    }
                    
                    const participant = participantMap[row.participant_id];
                    participant.all_judges.add(row.judge_id);
                    
                    // Group by segment
                    if (!participant.segments[row.segment_id]) {
                        participant.segments[row.segment_id] = {
                            segment_name: row.segment_name,
                            day_number: row.day_number,
                            scores: []
                        };
                    }
                    
                    participant.segments[row.segment_id].scores.push({
                        judge_name: row.judge_name,
                        score: parseFloat(row.total_score)
                    });
                });
                
                // STEP 2: Calculate SEGMENT AVERAGES first, then OVERALL AVERAGE
                const finalScores = Object.values(participantMap).map(participant => {
                    const segmentAverages = [];
                    
                    // For each segment, calculate average of judge scores
                    Object.values(participant.segments).forEach(segment => {
                        const sum = segment.scores.reduce((acc, s) => acc + s.score, 0);
                        const average = sum / segment.scores.length;
                        segmentAverages.push(average);
                    });
                    
                    // Overall average is the average of segment averages
                    const overallAverage = segmentAverages.reduce((acc, avg) => acc + avg, 0) / segmentAverages.length;
                    
                    return {
                        participant_id: participant.participant_id,
                        participant_name: participant.participant_name,
                        contestant_number: participant.contestant_number,
                        performance_title: participant.performance_title,
                        total_score: overallAverage.toFixed(2),
                        judge_name: `${participant.all_judges.size} judges`,
                        judge_count: participant.all_judges.size,
                        segments_completed: Object.keys(participant.segments).length
                    };
                });
                
                console.log('✅ Pageant scores calculated with CORRECT segment averaging');
                res.json(finalScores);
            });
            
        } else {
            // FOR REGULAR COMPETITIONS: Standard query
            console.log('📊 Fetching REGULAR competition scores for competition:', competitionId);
            
            const sql = `
                SELECT os.*, j.judge_name, p.participant_name, p.performance_title
                FROM overall_scores os
                JOIN judges j ON os.judge_id = j.judge_id
                JOIN participants p ON os.participant_id = p.participant_id
                WHERE os.competition_id = ? AND os.segment_id IS NULL
                ORDER BY p.participant_name, os.total_score DESC
            `;
            
            db.query(sql, [competitionId], (err, result) => {
                if (err) {
                    console.error('❌ Error fetching regular scores:', err);
                    return res.status(500).json({ error: 'Error fetching scores' });
                }
                res.json(result);
            });
        }
    });
});

console.log('✅ FIXED: Multi-day pageant scoring now calculates segment averages correctly!');

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


app.post('/submit-detailed-scores', (req, res) => {
    const { judge_id, participant_id, competition_id, scores, general_comments } = req.body;
    
    console.log('📥 Submitting REGULAR competition scores:', { 
        judge_id, 
        participant_id, 
        competition_id,
        scores_count: scores ? scores.length : 0 
    });
    
    if (!judge_id || !participant_id || !competition_id || !scores || scores.length === 0) {
        console.error('❌ Missing required fields:', { judge_id, participant_id, competition_id, has_scores: !!scores });
        return res.status(400).json({ error: 'Required fields missing' });
    }

    // Delete old detailed scores
    db.query('DELETE FROM detailed_scores WHERE judge_id = ? AND participant_id = ? AND competition_id = ? AND segment_id IS NULL', 
        [judge_id, participant_id, competition_id], (err) => {
        if (err) {
            console.error('❌ Error deleting old scores:', err);
            return res.status(500).json({ error: 'Error updating scores' });
        }

        let totalScore = 0;
        
        const insertPromises = scores.map(score => {
            const weightedScore = (score.score * score.percentage) / 100;
            totalScore += weightedScore;
            
            return new Promise((resolve, reject) => {
                const sql = `
                    INSERT INTO detailed_scores 
                    (judge_id, participant_id, competition_id, segment_id, criteria_id, score, weighted_score, comments) 
                    VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
                `;
                db.query(sql, [
                    judge_id, participant_id, competition_id, 
                    score.criteria_id, score.score, weightedScore, score.comments || null
                ], (err, result) => {
                    if (err) {
                        console.error('❌ Error inserting detailed score:', err);
                        reject(err);
                    } else {
                        console.log('✅ Detailed score inserted, ID:', result.insertId);
                        resolve(result);
                    }
                });
            });
        });

        Promise.all(insertPromises)
            .then(() => {
                console.log('✅ All detailed scores inserted. Total:', totalScore.toFixed(2));
                
                // CRITICAL: Insert into overall_scores with segment_id = NULL
                const overallSql = `
                    INSERT INTO overall_scores 
                    (judge_id, participant_id, competition_id, segment_id, total_score, general_comments, is_locked, locked_at)
                    VALUES (?, ?, ?, NULL, ?, ?, FALSE, NULL)
                    ON DUPLICATE KEY UPDATE 
                    total_score = VALUES(total_score), 
                    general_comments = VALUES(general_comments),
                    is_locked = FALSE,
                    locked_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                `;
                
                db.query(overallSql, [judge_id, participant_id, competition_id, totalScore, general_comments || null], (err, result) => {
                    if (err) {
                        console.error('❌ Error saving overall score:', err);
                        return res.status(500).json({ 
                            success: false,
                            error: 'Error saving overall score: ' + err.message 
                        });
                    }
                    
                    console.log('✅ Overall score saved successfully:', {
                        judge_id,
                        participant_id,
                        competition_id,
                        total_score: totalScore.toFixed(2),
                        affected_rows: result.affectedRows
                    });
                    
                    res.json({ 
                        success: true, 
                        message: 'Scores submitted successfully!',
                        total_score: totalScore,
                        should_start_countdown: true
                    });
                });
            })
            .catch(err => {
                console.error('❌ Error inserting detailed scores:', err);
                res.status(500).json({ 
                    success: false,
                    error: 'Error saving detailed scores: ' + err.message 
                });
            });
    });
});

console.log('✅ FIXED: /submit-detailed-scores endpoint now properly saves with segment_id = NULL');


// ==========================================
// PAGEANT: submit per-segment scores (judge)
// ==========================================
app.post('/submit-segment-scores', (req, res) => {
  const { judge_id, participant_id, segment_id, scores, general_comments, total_score } = req.body;

  if (!judge_id || !participant_id || !segment_id || !Array.isArray(scores) || scores.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Step 1: remove any previous scores for this judge+participant+segment (safe re-submit)
  const deleteDetailsSql = `
    DELETE FROM pageant_segment_scores
    WHERE judge_id = ? AND participant_id = ? AND segment_id = ?
  `;
  db.query(deleteDetailsSql, [judge_id, participant_id, segment_id], (delErr) => {
    if (delErr) {
      console.error('❌ Error clearing old pageant_segment_scores:', delErr);
      return res.status(500).json({ success: false, error: 'Error updating segment scores' });
    }

    // Step 2: insert per-criteria rows
    const insertDetailSql = `
      INSERT INTO pageant_segment_scores
        (judge_id, participant_id, segment_id, criteria_id, score, weighted_score, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    let computedTotal = 0;
    const inserts = scores.map(s => {
      const sc = parseFloat(s.score) || 0;
      const w  = parseFloat(s.weighted_score) || 0;
      computedTotal += w;
      return new Promise((resolve, reject) => {
        db.query(
          insertDetailSql,
          [judge_id, participant_id, segment_id, s.criteria_id, sc, w, s.comments || null],
          (err) => err ? reject(err) : resolve()
        );
      });
    });

    Promise.all(inserts).then(() => {
      // Step 3: upsert the segment total in overall_scores (with segment_id!)
      const upsertOverallSql = `
        INSERT INTO overall_scores (judge_id, participant_id, competition_id, segment_id, total_score, is_locked, locked_at)
        SELECT ?, ?, ps.competition_id, ?, ?, FALSE, NULL
        FROM pageant_segments ps
        WHERE ps.segment_id = ?
        ON DUPLICATE KEY UPDATE total_score = VALUES(total_score), updated_at = NOW()
      `;

      const total = (typeof total_score === 'number') ? total_score : computedTotal;

      db.query(
        upsertOverallSql,
        [judge_id, participant_id, segment_id, total, segment_id],
        (ovErr) => {
          if (ovErr) {
            console.error('❌ Error upserting overall_scores (pageant):', ovErr);
            return res.status(500).json({ success: false, error: 'Error saving segment total' });
          }

          // Optional: store a copy of judge’s general comments into detailed table as a note row,
          // or keep it separate if you have another place. Skipped here.

          // Tell the frontend it may start the short auto-lock countdown
          res.json({
            success: true,
            message: 'Segment scores saved',
            should_start_countdown: true
          });
        }
      );
    }).catch((insErr) => {
      console.error('❌ Error inserting pageant segment scores:', insErr);
      res.status(500).json({ success: false, error: 'Error inserting segment scores' });
    });
  });
});



// ==========================================
// 3. DRAFT ENDPOINTS
// ==========================================

// Save draft (works for both pageant & regular)
app.post('/save-draft-scores', (req, res) => {
    const { judge_id, participant_id, segment_id, scores, general_comments, total_score } = req.body;
    
    console.log('💾 Saving draft:', { judge_id, participant_id, segment_id: segment_id || 'NULL (regular)' });
    
    if (!judge_id || !participant_id) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const draftData = JSON.stringify({ 
        scores: scores || [], 
        general_comments: general_comments || '', 
        total_score: total_score || 0 
    });
    
    const sql = `
        INSERT INTO draft_scores (judge_id, participant_id, segment_id, draft_data, saved_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE draft_data = VALUES(draft_data), saved_at = NOW()
    `;
    
    db.query(sql, [judge_id, participant_id, segment_id || null, draftData], (err) => {
        if (err) {
            console.error('❌ Draft save error:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        console.log('✅ Draft saved');
        res.json({ success: true, message: 'Draft saved' });
    });
});

// Get draft - FOR PAGEANTS (with segment_id)
app.get('/get-draft-scores/:judgeId/:participantId/:segmentId', (req, res) => {
    const { judgeId, participantId, segmentId } = req.params;
    
    console.log('📥 Getting PAGEANT draft:', { judgeId, participantId, segmentId });
    
    const sql = `
        SELECT draft_data, saved_at 
        FROM draft_scores 
        WHERE judge_id = ? AND participant_id = ? AND segment_id = ?
    `;
    
    db.query(sql, [judgeId, participantId, segmentId], (err, result) => {
        if (err) {
            console.error('❌ Error getting draft:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (result.length > 0) {
            try {
                const draft = JSON.parse(result[0].draft_data);
                res.json({ success: true, draft: draft, saved_at: result[0].saved_at });
            } catch (parseError) {
                res.json({ success: false, message: 'Draft corrupted' });
            }
        } else {
            res.json({ success: false, message: 'No draft found' });
        }
    });
});

// Get draft - FOR REGULAR (without segment_id)
app.get('/get-draft-scores/:judgeId/:participantId', (req, res) => {
    const { judgeId, participantId } = req.params;
    
    console.log('📥 Getting REGULAR draft:', { judgeId, participantId });
    
    const sql = `
        SELECT draft_data, saved_at 
        FROM draft_scores 
        WHERE judge_id = ? AND participant_id = ? AND segment_id IS NULL
    `;
    
    db.query(sql, [judgeId, participantId], (err, result) => {
        if (err) {
            console.error('❌ Error getting draft:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (result.length > 0) {
            try {
                const draft = JSON.parse(result[0].draft_data);
                res.json({ success: true, draft: draft, saved_at: result[0].saved_at });
            } catch (parseError) {
                res.json({ success: false, message: 'Draft corrupted' });
            }
        } else {
            res.json({ success: false, message: 'No draft found' });
        }
    });
});

app.delete('/delete-draft-scores/:judgeId/:participantId/:segmentId', (req, res) => {
    const { judgeId, participantId, segmentId } = req.params;
    
    console.log('🗑️ Deleting PAGEANT draft');
    
    const sql = 'DELETE FROM draft_scores WHERE judge_id = ? AND participant_id = ? AND segment_id = ?';
    
    db.query(sql, [judgeId, participantId, segmentId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, deleted: result.affectedRows > 0 });
    });
});

// Delete draft - FOR REGULAR (without segmentId)
app.delete('/delete-draft-scores/:judgeId/:participantId', (req, res) => {
    const { judgeId, participantId } = req.params;
    
    console.log('🗑️ Deleting REGULAR draft');
    
    const sql = 'DELETE FROM draft_scores WHERE judge_id = ? AND participant_id = ? AND segment_id IS NULL';
    
    db.query(sql, [judgeId, participantId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, deleted: result.affectedRows > 0 });
    });
});

// ==========================================
// 4. LOCK CHECK ENDPOINTS
// ==========================================

// Check lock - FOR PAGEANTS (with segment_id)
app.get('/check-score-lock/:judgeId/:participantId/:competitionId/:segmentId', (req, res) => {
    const { judgeId, participantId, competitionId, segmentId } = req.params;
    
    console.log('🔍 Checking PAGEANT lock:', { judgeId, participantId, competitionId, segmentId });
    
    const sql = `
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
            return res.json({ is_locked: false, can_edit: true, seconds_remaining: 10 });
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

// Check lock - FOR REGULAR (without segment_id)
app.get('/check-score-lock/:judgeId/:participantId/:competitionId', (req, res) => {
    const { judgeId, participantId, competitionId } = req.params;
    
    console.log('🔍 Checking REGULAR lock:', { judgeId, participantId, competitionId });
    
    const sql = `
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
            return res.json({ is_locked: false, can_edit: true, seconds_remaining: 10 });
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

// ==========================================
// 5. AUTO-LOCK SCORE ENDPOINT
// ==========================================
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
    
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('❌ Auto-lock error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error locking score' 
            });
        }
        
        console.log('✅ Score locked immediately, affected rows:', result.affectedRows);
        
        res.json({ 
            success: true, 
            message: 'Score locked successfully',
            affected_rows: result.affectedRows,
            locked_at: new Date().toISOString()
        });
    });
});

// ==========================================
// 6. UNLOCK REQUEST ENDPOINTS
// ==========================================

// Submit unlock request
app.post('/request-unlock', (req, res) => {
    const { judge_id, participant_id, segment_id, competition_id, reason, score_type } = req.body;
    
    console.log('📨 Unlock request received:', { judge_id, participant_id, competition_id, segment_id, score_type });
    
    if (!judge_id || !participant_id || !competition_id || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
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

// Review unlock request (admin only)
app.post('/review-unlock-request/:requestId', (req, res) => {
    const { requestId } = req.params;
    const { action, admin_notes, admin_user_id } = req.body;
    
    console.log('👨‍💼 Admin reviewing request:', requestId, 'Action:', action);
    
    if (!action || (action !== 'approve' && action !== 'reject')) {
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    db.query('SELECT * FROM unlock_requests WHERE request_id = ?', [requestId], (err, requests) => {
        if (err || requests.length === 0) {
            return res.status(500).json({ error: 'Unlock request not found' });
        }
        
        const request = requests[0];
        
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
                    
                    console.log('✅ Score unlocked, affected rows:', unlockResult.affectedRows);
                    
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


app.get('/segment-weights/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    const sql = `
        SELECT segment_id, segment_name, segment_weight, day_number, order_number
        FROM pageant_segments
        WHERE competition_id = ? AND is_active = TRUE
        ORDER BY day_number, order_number
    `;
    
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching segment weights:', err);
            return res.status(500).json({ error: 'Error fetching segment weights' });
        }
        
        // Calculate total weight
        const totalWeight = result.reduce((sum, seg) => sum + parseFloat(seg.segment_weight || 0), 0);
        
        res.json({
            segments: result,
            total_weight: totalWeight,
            is_valid: Math.abs(totalWeight - 100) < 0.1
        });
    });
});

// Update segment weights
app.post('/update-segment-weights', (req, res) => {
    const { competition_id, segments } = req.body;
    
    if (!competition_id || !segments || segments.length === 0) {
        return res.status(400).json({ error: 'Competition ID and segments required' });
    }
    
    // Validate total weight equals 100%
    const totalWeight = segments.reduce((sum, seg) => sum + parseFloat(seg.weight || 0), 0);
    
    if (Math.abs(totalWeight - 100) > 0.1) {
        return res.status(400).json({ 
            error: `Total weight must equal 100%. Current total: ${totalWeight.toFixed(2)}%` 
        });
    }
    
    // Update each segment weight
    const updatePromises = segments.map(segment => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE pageant_segments SET segment_weight = ? WHERE segment_id = ?';
            db.query(sql, [segment.weight, segment.segment_id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });
    
    Promise.all(updatePromises)
        .then(() => {
            res.json({ 
                success: true, 
                message: 'Segment weights updated successfully!',
                total_weight: totalWeight
            });
        })
        .catch(err => {
            console.error('Error updating segment weights:', err);
            res.status(500).json({ error: 'Error updating segment weights' });
        });
});

// Get weighted grand total for pageant leaderboard
// Get weighted grand total for pageant leaderboard
app.get('/pageant-grand-total/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    // First, get all segment scores with weights
    const sql = `
        SELECT 
            p.participant_id,
            p.participant_name,
            p.contestant_number,
            p.photo_url,
            ps.segment_id,
            ps.segment_name,
            ps.segment_weight,
            ps.day_number,
            ps.order_number,
            os.judge_id,
            os.total_score
        FROM participants p
        JOIN overall_scores os ON p.participant_id = os.participant_id
        JOIN pageant_segments ps ON os.segment_id = ps.segment_id
        WHERE ps.competition_id = ? AND ps.is_active = TRUE
        ORDER BY p.participant_id, ps.day_number, ps.order_number, os.judge_id
    `;
    
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching grand total:', err);
            return res.status(500).json({ error: 'Error fetching grand total: ' + err.message });
        }
        
        if (result.length === 0) {
            return res.json([]);
        }
        
        // Process results in JavaScript
        const participantMap = {};
        
        result.forEach(row => {
            if (!participantMap[row.participant_id]) {
                participantMap[row.participant_id] = {
                    participant_id: row.participant_id,
                    participant_name: row.participant_name,
                    contestant_number: row.contestant_number,
                    photo_url: row.photo_url,
                    segments: {},
                    judges: new Set(),
                    segments_completed: new Set()
                };
            }
            
            const participant = participantMap[row.participant_id];
            
            // Track unique segments and judges
            participant.segments_completed.add(row.segment_id);
            participant.judges.add(row.judge_id);
            
            // Group scores by segment
            if (!participant.segments[row.segment_id]) {
                participant.segments[row.segment_id] = {
                    name: row.segment_name,
                    weight: row.segment_weight,
                    scores: []
                };
            }
            
            participant.segments[row.segment_id].scores.push(row.total_score);
        });
        
        // Calculate averages and weighted totals
        const leaderboard = Object.values(participantMap).map(participant => {
            let weighted_grand_total = 0;
            const segments = [];
            
            Object.values(participant.segments).forEach(segment => {
                // Calculate average score for this segment
                const sum = segment.scores.reduce((acc, score) => acc + score, 0);
                const average_score = sum / segment.scores.length;
                const weighted_contribution = (average_score * segment.weight) / 100;
                
                weighted_grand_total += weighted_contribution;
                
                segments.push({
                    name: segment.name,
                    average_score: average_score.toFixed(2),
                    weight: segment.weight,
                    weighted_contribution: weighted_contribution.toFixed(2)
                });
            });
            
            return {
                participant_id: participant.participant_id,
                participant_name: participant.participant_name,
                contestant_number: participant.contestant_number,
                photo_url: participant.photo_url,
                segments: segments,
                weighted_grand_total: weighted_grand_total.toFixed(2),
                segments_completed: participant.segments_completed.size,
                judge_count: participant.judges.size
            };
        });
        
        // Sort by weighted_grand_total descending
        leaderboard.sort((a, b) => parseFloat(b.weighted_grand_total) - parseFloat(a.weighted_grand_total));
        
        res.json(leaderboard);
    });
});

// Get individual participant's weighted score breakdown
app.get('/participant-weighted-breakdown/:participantId/:competitionId', (req, res) => {
    const { participantId, competitionId } = req.params;
    
    const sql = `
        SELECT 
            p.participant_name,
            p.contestant_number,
            ps.segment_name,
            ps.segment_weight,
            ps.day_number,
            j.judge_name,
            os.total_score,
            (os.total_score * ps.segment_weight / 100) as weighted_contribution
        FROM overall_scores os
        JOIN pageant_segments ps ON os.segment_id = ps.segment_id
        JOIN participants p ON os.participant_id = p.participant_id
        JOIN judges j ON os.judge_id = j.judge_id
        WHERE os.participant_id = ? AND ps.competition_id = ?
        ORDER BY ps.day_number, ps.order_number, j.judge_name
    `;
    
    db.query(sql, [participantId, competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching participant breakdown:', err);
            return res.status(500).json({ error: 'Error fetching breakdown' });
        }
        
        // Group by segment
        const segmentMap = {};
        result.forEach(row => {
            if (!segmentMap[row.segment_name]) {
                segmentMap[row.segment_name] = {
                    segment_name: row.segment_name,
                    segment_weight: row.segment_weight,
                    day_number: row.day_number,
                    judge_scores: [],
                    average_score: 0,
                    weighted_contribution: 0
                };
            }
            
            segmentMap[row.segment_name].judge_scores.push({
                judge_name: row.judge_name,
                score: row.total_score
            });
        });
        
        // Calculate averages
        const segments = Object.values(segmentMap).map(seg => {
            const sum = seg.judge_scores.reduce((acc, j) => acc + j.score, 0);
            seg.average_score = (sum / seg.judge_scores.length).toFixed(2);
            seg.weighted_contribution = (seg.average_score * seg.segment_weight / 100).toFixed(2);
            return seg;
        });
        
        const grand_total = segments.reduce((sum, seg) => sum + parseFloat(seg.weighted_contribution), 0);
        
        res.json({
            participant_name: result[0]?.participant_name || 'Unknown',
            contestant_number: result[0]?.contestant_number || 'N/A',
            segments: segments,
            weighted_grand_total: grand_total.toFixed(2)
        });
    });
});


console.log('✅ Complete scoring system loaded - Pageants & Regular competitions');

app.get('/debug-scores/:judgeId/:competitionId', (req, res) => {
    const { judgeId, competitionId } = req.params;
    
    const queries = {
        overall_scores: `
            SELECT * FROM overall_scores 
            WHERE judge_id = ? AND competition_id = ?
        `,
        detailed_scores: `
            SELECT * FROM detailed_scores 
            WHERE judge_id = ? AND competition_id = ?
        `,
        participants: `
            SELECT * FROM participants 
            WHERE competition_id = ?
        `,
        competition: `
            SELECT c.*, et.is_pageant 
            FROM competitions c 
            JOIN event_types et ON c.event_type_id = et.event_type_id
            WHERE c.competition_id = ?
        `
    };
    
    const results = {};
    let completed = 0;
    
    // Get overall_scores
    db.query(queries.overall_scores, [judgeId, competitionId], (err, data) => {
        results.overall_scores = err ? { error: err.message } : data;
        if (++completed === 4) res.json(results);
    });
    
    // Get detailed_scores
    db.query(queries.detailed_scores, [judgeId, competitionId], (err, data) => {
        results.detailed_scores = err ? { error: err.message } : data;
        if (++completed === 4) res.json(results);
    });
    
    // Get participants
    db.query(queries.participants, [competitionId], (err, data) => {
        results.participants = err ? { error: err.message } : data;
        if (++completed === 4) res.json(results);
    });
    
    // Get competition
    db.query(queries.competition, [competitionId], (err, data) => {
        results.competition = err ? { error: err.message } : data;
        if (++completed === 4) res.json(results);
    });
});


app.listen(PORT, '0.0.0.0', () => {  // ✅ Use the PORT from line 11
  console.log(`🚀 Server running on port ${PORT}`);
});