const express = require('express');
const mysql = require('mysql');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3002;

// Middleware for parsing JSON data and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS) from the root folder
app.use(express.static(path.join(__dirname, '')));

// Create MySQL connection with better error handling
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'judging_system',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

// Connect to MySQL with better error handling
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// Handle connection errors
db.on('error', function(err) {
    console.log('Database error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Attempting to reconnect to database...');
        db.connect();
    } else {
        throw err;
    }
});

// Function to generate random password
function generatePassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Route to serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route to serve the admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login route - Fixed to use user_id instead of userid
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const user = result[0];
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                user_id: user.user_id,
                username: user.username,
                role: user.role
            }
        });
    });
});

// Route to get competitions assigned to a judge - Fixed query
app.get('/judge-competitions/:judgeId', (req, res) => {
    const { judgeId } = req.params;
    
    if (isNaN(judgeId)) {
        return res.status(400).json({ error: 'Invalid judge ID' });
    }
    
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
            console.error('Error fetching judge competitions:', err);
            return res.status(500).json({ error: 'Error fetching competitions' });
        }
        res.json(result);
    });
});

// Route to get participants for a specific competition
app.get('/participants/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    if (isNaN(competitionId)) {
        return res.status(400).json({ error: 'Invalid competition ID' });
    }
    
    const sql = `
        SELECT p.participant_id, p.participant_name, p.email, p.phone, p.age, 
               p.gender, p.school_organization, p.performance_title, 
               p.performance_description, p.registration_fee,
               c.competition_name, c.competition_id, c.category
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        WHERE p.competition_id = ?
        ORDER BY p.participant_name
    `;
    
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching participants:', err);
            return res.status(500).json({ error: 'Error fetching participants' });
        }
        res.json(result);
    });
});

// Route to get all competitions (Read)
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

// Route to get category choices
app.get('/categories', (req, res) => {
    res.json(['music', 'dance', 'art', 'singing']);
});

// Route to create a competition (Create)
app.post('/create-competition', (req, res) => {
    const { competition_name, category, competition_date } = req.body;

    // Improved validation
    if (!competition_name || !category || !competition_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate category
    const validCategories = ['music', 'dance', 'art', 'singing'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category. Must be one of: music, dance, art, singing' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(competition_date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
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

// Route to update a competition (Update)
app.put('/update-competition/:id', (req, res) => {
    const { id } = req.params;
    const { competition_name, category, competition_date } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid competition ID' });
    }

    if (!competition_name || !category || !competition_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate category
    const validCategories = ['music', 'dance', 'art', 'singing'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category. Must be one of: music, dance, art, singing' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(competition_date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const sql = 'UPDATE competitions SET competition_name = ?, category = ?, competition_date = ? WHERE competition_id = ?';
    db.query(sql, [competition_name, category, competition_date, id], (err, result) => {
        if (err) {
            console.error('Error updating competition:', err);
            return res.status(500).json({ error: 'Error updating competition' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        res.json({ success: true, message: 'Competition updated successfully!' });
    });
});

// Route to delete a competition (Delete)
app.delete('/delete-competition/:id', (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid competition ID' });
    }

    const sql = 'DELETE FROM competitions WHERE competition_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting competition:', err);
            return res.status(500).json({ error: 'Error deleting competition' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        res.json({ success: true, message: 'Competition deleted successfully!' });
    });
});

// Route to add a participant - Updated to match your schema
app.post('/add-participant', (req, res) => {
    const { 
        participant_name, 
        email, 
        phone, 
        age, 
        gender, 
        school_organization, 
        performance_title, 
        performance_description, 
        competition_id,
        registration_fee = 'pending'
    } = req.body;

    // Validate required input
    if (!participant_name || !email || !age || !gender || !performance_title || !competition_id) {
        return res.status(400).json({ error: 'Required fields: participant_name, email, age, gender, performance_title, competition_id' });
    }

    if (isNaN(competition_id) || isNaN(age)) {
        return res.status(400).json({ error: 'Invalid competition ID or age' });
    }

    // Validate gender
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender. Must be one of: male, female, other' });
    }

    // Validate registration fee status
    const validRegistrationFees = ['paid', 'pending', 'waived'];
    if (!validRegistrationFees.includes(registration_fee)) {
        return res.status(400).json({ error: 'Invalid registration fee status. Must be one of: paid, pending, waived' });
    }

    // Check if competition exists
    const checkCompetitionSql = 'SELECT competition_id FROM competitions WHERE competition_id = ?';
    db.query(checkCompetitionSql, [competition_id], (err, result) => {
        if (err) {
            console.error('Error checking competition:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }

        // Add participant
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
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Participant with this email already exists' });
                }
                return res.status(500).json({ error: 'Error adding participant' });
            }
            res.json({ 
                success: true, 
                message: 'Participant added successfully!',
                participant_id: result.insertId 
            });
        });
    });
});

// Route to get all participants (Read) - Updated query
app.get('/participants', (req, res) => {
    const sql = `
        SELECT p.participant_id, 
               p.participant_name as name,
               p.participant_name, 
               p.email, 
               p.phone, 
               p.age,
               p.gender, 
               p.school_organization, 
               p.performance_title, 
               p.performance_description, 
               p.registration_fee, 
               p.registration_date,
               c.competition_name, 
               c.competition_id, 
               c.competition_date, 
               c.category
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        ORDER BY c.competition_date DESC, p.participant_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching participants:', err);
            return res.status(500).json({ error: 'Error fetching participants' });
        }
        console.log('Participants data being sent:', result); // Debug log
        res.json(result);
    });
});
app.get('/participant/:participantId', (req, res) => {
    const { participantId } = req.params;
    
    if (isNaN(participantId)) {
        return res.status(400).json({ error: 'Invalid participant ID' });
    }
    
    const sql = `
        SELECT p.participant_id, 
               p.participant_name, 
               p.email, 
               p.phone, 
               p.age,
               p.gender, 
               p.school_organization, 
               p.performance_title, 
               p.performance_description, 
               p.registration_fee, 
               p.registration_date,
               c.competition_name, 
               c.competition_id, 
               c.competition_date, 
               c.category
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        WHERE p.participant_id = ?
    `;
    
    db.query(sql, [participantId], (err, result) => {
        if (err) {
            console.error('Error fetching participant details:', err);
            return res.status(500).json({ error: 'Error fetching participant details' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        
        console.log('Participant details being sent:', result[0]); // Debug log
        res.json(result[0]);
    });
});
app.put('/update-participant/:id', (req, res) => {
    const { id } = req.params;
    const { 
        participant_name, 
        email, 
        phone, 
        age, 
        gender, 
        school_organization, 
        performance_title, 
        performance_description, 
        competition_id,
        registration_fee 
    } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid participant ID' });
    }

    if (!participant_name || !email || !age || !gender || !performance_title || !competition_id) {
        return res.status(400).json({ error: 'Required fields: participant_name, email, age, gender, performance_title, competition_id' });
    }

    if (isNaN(competition_id) || isNaN(age)) {
        return res.status(400).json({ error: 'Invalid competition ID or age' });
    }

    // Validate gender
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender. Must be one of: male, female, other' });
    }

    // Validate registration fee status
    const validRegistrationFees = ['paid', 'pending', 'waived'];
    if (registration_fee && !validRegistrationFees.includes(registration_fee)) {
        return res.status(400).json({ error: 'Invalid registration fee status. Must be one of: paid, pending, waived' });
    }

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
            console.error('Error updating participant:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Participant with this email already exists' });
            }
            return res.status(500).json({ error: 'Error updating participant' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        
        res.json({ success: true, message: 'Participant updated successfully!' });
    });
});

// Route to delete a participant (Delete)
app.delete('/delete-participant/:id', (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid participant ID' });
    }

    // First delete any scores associated with this participant
    const deleteScoresSql = 'DELETE FROM scores WHERE participant_id = ?';
    db.query(deleteScoresSql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting participant scores:', err);
            return res.status(500).json({ error: 'Error deleting participant scores' });
        }

        // Then delete the participant
        const deleteParticipantSql = 'DELETE FROM participants WHERE participant_id = ?';
        db.query(deleteParticipantSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting participant:', err);
                return res.status(500).json({ error: 'Error deleting participant' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Participant not found' });
            }
            
            res.json({ success: true, message: 'Participant deleted successfully!' });
        });
    });
});

// Updated route to add a judge - Fixed to match your schema
// Updated route to add a judge - Fixed to properly link user and judge
app.post('/add-judge', (req, res) => {
    const { 
        judge_name, 
        email, 
        phone, 
        expertise, 
        experience_years = 0, 
        credentials, 
        competition_id 
    } = req.body;

    // Validate input
    if (!judge_name || !email || !expertise || !competition_id) {
        return res.status(400).json({ error: 'Required fields: judge_name, email, expertise, competition_id' });
    }

    if (isNaN(competition_id)) {
        return res.status(400).json({ error: 'Invalid competition ID' });
    }

    // Validate expertise
    const validExpertise = ['music', 'dance', 'art', 'singing'];
    if (!validExpertise.includes(expertise)) {
        return res.status(400).json({ error: 'Invalid expertise. Must be one of: music, dance, art, singing' });
    }

    // Check if competition exists
    const checkCompetitionSql = 'SELECT competition_id FROM competitions WHERE competition_id = ?';
    db.query(checkCompetitionSql, [competition_id], (err, result) => {
        if (err) {
            console.error('Error checking competition:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }

        // Generate username and password for judge
        const username = judge_name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
        const password = generatePassword(8);

        // First, create user account
        const createUserSql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        db.query(createUserSql, [username, password, 'judge'], (err, userResult) => {
            if (err) {
                console.error('Error creating user account:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Error creating judge account' });
            }

            const userId = userResult.insertId;

            // Then, add judge with reference to user - FIXED: Added user_id to link properly
            const addJudgeSql = `INSERT INTO judges 
                               (judge_name, email, phone, expertise, experience_years, credentials, competition_id, user_id) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            db.query(addJudgeSql, [
                judge_name, email, phone, expertise, experience_years, credentials, competition_id, userId
            ], (err, judgeResult) => {
                if (err) {
                    // If judge creation fails, remove the user account
                    db.query('DELETE FROM users WHERE user_id = ?', [userId]);
                    console.error('Error adding judge:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Judge with this email already exists' });
                    }
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
});

// Route to get all judges with consistent field names
app.get('/judges', (req, res) => {
    const sql = `
        SELECT j.judge_id, 
               j.judge_name as name,
               j.judge_name, 
               j.email, 
               j.phone, 
               j.expertise, 
               j.experience_years, 
               j.credentials, 
               j.user_id,
               c.competition_name, 
               c.category, 
               c.competition_id, 
               c.competition_date,
               u.username
        FROM judges j
        JOIN competitions c ON j.competition_id = c.competition_id
        LEFT JOIN users u ON j.user_id = u.user_id
        ORDER BY c.competition_date DESC, j.judge_name
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching judges:', err);
            return res.status(500).json({ error: 'Error fetching judges' });
        }
        console.log('Judges data being sent:', result); // Debug log
        res.json(result);
    });
});
app.get('/judge/:id', (req, res) => {
    const { id } = req.params;
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid judge ID' });
    }
    
    const sql = `
        SELECT j.judge_id, j.judge_name, j.email, j.phone, j.expertise, 
               j.experience_years, j.credentials, j.user_id,
               c.competition_name, c.category, c.competition_id, c.competition_date,
               u.username
        FROM judges j
        JOIN competitions c ON j.competition_id = c.competition_id
        LEFT JOIN users u ON j.user_id = u.user_id
        WHERE j.judge_id = ?
    `;
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching judge:', err);
            return res.status(500).json({ error: 'Error fetching judge' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Judge not found' });
        }
        
        res.json(result[0]);
    });
});

// Route to get a single participant by ID
app.get('/participant/:id', (req, res) => {
    const { id } = req.params;
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid participant ID' });
    }
    
    const sql = `
        SELECT p.participant_id, p.participant_name, p.email, p.phone, p.age,
               p.gender, p.school_organization, p.performance_title, 
               p.performance_description, p.registration_fee, p.registration_date,
               c.competition_name, c.competition_id, c.competition_date, c.category
        FROM participants p
        JOIN competitions c ON p.competition_id = c.competition_id
        WHERE p.participant_id = ?
    `;
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching participant:', err);
            return res.status(500).json({ error: 'Error fetching participant' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        
        res.json(result[0]);
    });
});

app.get('/judge/:judgeId', (req, res) => {
    const { judgeId } = req.params;
    
    if (isNaN(judgeId)) {
        return res.status(400).json({ error: 'Invalid judge ID' });
    }
    
    const sql = `
        SELECT j.judge_id, 
               j.judge_name, 
               j.email, 
               j.phone, 
               j.expertise, 
               j.experience_years, 
               j.credentials, 
               j.user_id,
               c.competition_name, 
               c.category, 
               c.competition_id, 
               c.competition_date,
               u.username
        FROM judges j
        JOIN competitions c ON j.competition_id = c.competition_id
        LEFT JOIN users u ON j.user_id = u.user_id
        WHERE j.judge_id = ?
    `;
    
    db.query(sql, [judgeId], (err, result) => {
        if (err) {
            console.error('Error fetching judge details:', err);
            return res.status(500).json({ error: 'Error fetching judge details' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Judge not found' });
        }
        
        console.log('Judge details being sent:', result[0]); // Debug log
        res.json(result[0]);
    });
});
app.put('/update-judge/:id', (req, res) => {
    const { id } = req.params;
    const { 
        judge_name, 
        email, 
        phone, 
        expertise, 
        experience_years, 
        credentials, 
        competition_id 
    } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid judge ID' });
    }

    if (!judge_name || !email || !expertise || !competition_id) {
        return res.status(400).json({ error: 'Required fields: judge_name, email, expertise, competition_id' });
    }

    // Validate expertise
    const validExpertise = ['music', 'dance', 'art', 'singing'];
    if (!validExpertise.includes(expertise)) {
        return res.status(400).json({ error: 'Invalid expertise. Must be one of: music, dance, art, singing' });
    }

    if (isNaN(competition_id) || isNaN(experience_years)) {
        return res.status(400).json({ error: 'Invalid competition ID or experience years' });
    }

    const sql = `UPDATE judges 
                 SET judge_name = ?, email = ?, phone = ?, expertise = ?, 
                     experience_years = ?, credentials = ?, competition_id = ? 
                 WHERE judge_id = ?`;
    
    db.query(sql, [judge_name, email, phone, expertise, experience_years, credentials, competition_id, id], (err, result) => {
        if (err) {
            console.error('Error updating judge:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Judge with this email already exists' });
            }
            return res.status(500).json({ error: 'Error updating judge' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Judge not found' });
        }
        
        res.json({ success: true, message: 'Judge updated successfully!' });
    });
});

// Route to delete a judge (Delete)
app.delete('/delete-judge/:id', (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid judge ID' });
    }

    // First, get the user_id associated with this judge
    const getUserIdSql = 'SELECT user_id FROM judges WHERE judge_id = ?';
    db.query(getUserIdSql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching judge user ID:', err);
            return res.status(500).json({ error: 'Error fetching judge information' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Judge not found' });
        }

        const userId = result[0].user_id;

        // Delete judge first
        const deleteJudgeSql = 'DELETE FROM judges WHERE judge_id = ?';
        db.query(deleteJudgeSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting judge:', err);
                return res.status(500).json({ error: 'Error deleting judge' });
            }

            // Then delete the associated user account if it exists
            if (userId) {
                const deleteUserSql = 'DELETE FROM users WHERE user_id = ?';
                db.query(deleteUserSql, [userId], (err, result) => {
                    if (err) {
                        console.error('Error deleting judge user account:', err);
                        // Don't return error here, judge is already deleted
                    }
                });
            }

            res.json({ success: true, message: 'Judge deleted successfully!' });
        });
    });
});
// Route to submit scores - Updated to match your schema
app.post('/submit-score', (req, res) => {
    const { 
        judge_id, 
        participant_id, 
        competition_id, 
        technical_score, 
        artistic_score, 
        overall_score, 
        comments 
    } = req.body;

    // Validate input
    if (!judge_id || !participant_id || !competition_id) {
        return res.status(400).json({ error: 'judge_id, participant_id, and competition_id are required' });
    }

    if (isNaN(judge_id) || isNaN(participant_id) || isNaN(competition_id)) {
        return res.status(400).json({ error: 'Invalid input values' });
    }

    // Validate scores if provided
    const scores = [technical_score, artistic_score, overall_score].filter(s => s !== undefined);
    for (let score of scores) {
        if (isNaN(score) || score < 0 || score > 100) {
            return res.status(400).json({ error: 'All scores must be between 0 and 100' });
        }
    }

    // Check if judge is assigned to this competition
    const checkJudgeSql = 'SELECT * FROM judges WHERE judge_id = ? AND competition_id = ?';
    db.query(checkJudgeSql, [judge_id, competition_id], (err, result) => {
        if (err) {
            console.error('Error checking judge assignment:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(403).json({ error: 'Judge not assigned to this competition' });
        }

        // Insert or update score
        const upsertScoreSql = `
            INSERT INTO scores (judge_id, participant_id, competition_id, technical_score, artistic_score, overall_score, comments)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            technical_score = VALUES(technical_score), 
            artistic_score = VALUES(artistic_score), 
            overall_score = VALUES(overall_score), 
            comments = VALUES(comments)
        `;
        
        db.query(upsertScoreSql, [
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
});

// Route to get scores for a competition - Updated query
app.get('/scores/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    if (isNaN(competitionId)) {
        return res.status(400).json({ error: 'Invalid competition ID' });
    }
    
    const sql = `
        SELECT s.*, p.participant_name, p.performance_title,
               j.judge_name, j.expertise
        FROM scores s
        JOIN participants p ON s.participant_id = p.participant_id
        JOIN judges j ON s.judge_id = j.judge_id
        WHERE s.competition_id = ?
        ORDER BY p.participant_name, j.judge_name
    `;
    
    db.query(sql, [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching scores:', err);
            return res.status(500).json({ error: 'Error fetching scores' });
        }
        res.json(result);
    });
});

// Route to get competition statistics
app.get('/competition-stats/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    
    if (isNaN(competitionId)) {
        return res.status(400).json({ error: 'Invalid competition ID' });
    }
    
    db.query('CALL GetCompetitionStats(?)', [competitionId], (err, result) => {
        if (err) {
            console.error('Error fetching competition stats:', err);
            return res.status(500).json({ error: 'Error fetching competition statistics' });
        }
        res.json(result[0]);
    });
});

// Route to handle 404 errors (Page Not Found)
app.use((req, res) => {
    res.status(404).json({ error: 'Page not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.end(() => {
        console.log('Database connection closed.');
        process.exit(0);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});