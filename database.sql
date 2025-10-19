-- ================================================
-- COMPLETE AUTOMATED JUDGING SYSTEM DATABASE
-- ================================================

-- ================================================
-- CORE TABLES
-- ================================================

-- 1. USERS TABLE
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'judge') NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. EVENT TYPES TABLE
CREATE TABLE event_types (
    event_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_pageant BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. COMPETITIONS TABLE
CREATE TABLE competitions (
    competition_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_name VARCHAR(100) NOT NULL,
    event_type_id INT NOT NULL,
    competition_date DATE NOT NULL,
    event_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_type_id) REFERENCES event_types(event_type_id) ON DELETE CASCADE
);

-- 4. JUDGES TABLE
CREATE TABLE judges (
    judge_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    expertise VARCHAR(100) NOT NULL,
    experience_years INT DEFAULT 0,
    credentials TEXT,
    competition_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 5. PARTICIPANTS TABLE
CREATE TABLE participants (
    participant_id INT AUTO_INCREMENT PRIMARY KEY,
    participant_name VARCHAR(100) NOT NULL,
    contestant_number VARCHAR(50) NULL,
    photo_url TEXT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    age INT NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    school_organization VARCHAR(100),
    performance_title VARCHAR(200),
    performance_description TEXT,
    competition_id INT NOT NULL,
    status ENUM('paid', 'pending', 'waived', 'done', 'ongoing') DEFAULT 'pending',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    height VARCHAR(20),
    measurements VARCHAR(50),
    talents TEXT,
    special_awards TEXT,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    INDEX idx_contestant_number (contestant_number)
);

-- 6. COMPETITION CRITERIA TABLE
CREATE TABLE competition_criteria (
    criteria_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    criteria_name VARCHAR(100) NOT NULL,
    description TEXT,
    percentage DECIMAL(5,2) NOT NULL,
    max_score INT DEFAULT 100,
    order_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE
);

-- 7. PAGEANT SEGMENTS TABLE
CREATE TABLE pageant_segments (
    segment_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    segment_name VARCHAR(100) NOT NULL,
    segment_date DATE NOT NULL,
    segment_time TIME,
    description TEXT,
    order_number INT DEFAULT 1,
    day_number INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE
);

-- 8. SEGMENT CRITERIA TABLE
CREATE TABLE segment_criteria (
    segment_criteria_id INT AUTO_INCREMENT PRIMARY KEY,
    segment_id INT NOT NULL,
    criteria_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES competition_criteria(criteria_id) ON DELETE CASCADE
);

-- ================================================
-- SCORING TABLES
-- ================================================

-- 9. DETAILED SCORES TABLE
CREATE TABLE detailed_scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    competition_id INT NOT NULL,
    criteria_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    weighted_score DECIMAL(5,2),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES competition_criteria(criteria_id) ON DELETE CASCADE,
    INDEX idx_locked (is_locked, locked_at)
);

-- 10. PAGEANT SEGMENT SCORES TABLE
CREATE TABLE pageant_segment_scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    segment_id INT NOT NULL,
    criteria_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    weighted_score DECIMAL(5,2),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES competition_criteria(criteria_id) ON DELETE CASCADE,
    INDEX idx_locked (is_locked, locked_at)
);

-- 11. OVERALL SCORES TABLE
CREATE TABLE overall_scores (
    overall_score_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    competition_id INT NOT NULL,
    segment_id INT,
    total_score DECIMAL(5,2) NOT NULL,
    general_comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    UNIQUE KEY unique_judge_participant_competition (judge_id, participant_id, competition_id, segment_id),
    INDEX idx_locked (is_locked, locked_at),
    INDEX idx_judge_participant_segment (judge_id, participant_id, segment_id)
);

-- 12. DRAFT SCORES TABLE
CREATE TABLE draft_scores (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    segment_id INT NOT NULL,
    draft_data JSON NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_draft (judge_id, participant_id, segment_id),
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE
);

-- ================================================
-- AUDIT & UNLOCK SYSTEM TABLES
-- ================================================

-- 13. SCORE EDIT HISTORY TABLE
CREATE TABLE score_edit_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    score_id INT NOT NULL,
    score_type ENUM('overall', 'segment', 'detailed') NOT NULL,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    competition_id INT NOT NULL,
    segment_id INT NULL,
    old_total_score DECIMAL(5,2),
    new_total_score DECIMAL(5,2),
    edit_reason VARCHAR(255),
    edited_by_user_id INT,
    edit_type ENUM('judge_edit', 'admin_unlock', 'auto_lock') DEFAULT 'judge_edit',
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_judge_participant (judge_id, participant_id),
    INDEX idx_score_type (score_type, score_id),
    INDEX idx_edited_at (edited_at)
);

-- 14. UNLOCK REQUESTS TABLE
CREATE TABLE unlock_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    segment_id INT NULL,
    competition_id INT NOT NULL,
    score_type ENUM('overall', 'segment') DEFAULT 'overall',
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by_user_id INT NULL,
    reviewed_at TIMESTAMP NULL,
    admin_notes TEXT,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_judge (judge_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at)
);

-- 15. CRITERIA TEMPLATES TABLE
CREATE TABLE criteria_templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    event_type_id INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_type_id) REFERENCES event_types(event_type_id) ON DELETE CASCADE
);

-- ================================================
-- TRIGGERS
-- ================================================

DELIMITER $$

CREATE TRIGGER log_overall_score_edit
AFTER UPDATE ON overall_scores
FOR EACH ROW
BEGIN
    IF OLD.total_score != NEW.total_score THEN
        INSERT INTO score_edit_history (
            score_id, 
            score_type, 
            judge_id, 
            participant_id, 
            competition_id,
            segment_id,
            old_total_score, 
            new_total_score,
            edit_type
        ) VALUES (
            NEW.overall_score_id,
            'overall',
            NEW.judge_id,
            NEW.participant_id,
            NEW.competition_id,
            NEW.segment_id,
            OLD.total_score,
            NEW.total_score,
            'judge_edit'
        );
    END IF;
END$$

DELIMITER ;

-- ================================================
-- USEFUL VIEWS
-- ================================================

-- Unlock Requests View
CREATE OR REPLACE VIEW unlock_requests_view AS
SELECT 
    ur.request_id,
    ur.status,
    ur.requested_at,
    ur.reviewed_at,
    j.judge_name,
    p.participant_name,
    c.competition_name,
    ps.segment_name,
    ur.reason,
    ur.admin_notes,
    u.username as reviewed_by,
    TIMESTAMPDIFF(HOUR, ur.requested_at, NOW()) as hours_pending
FROM unlock_requests ur
JOIN judges j ON ur.judge_id = j.judge_id
JOIN participants p ON ur.participant_id = p.participant_id
JOIN competitions c ON ur.competition_id = c.competition_id
LEFT JOIN pageant_segments ps ON ur.segment_id = ps.segment_id
LEFT JOIN users u ON ur.reviewed_by_user_id = u.user_id
ORDER BY ur.requested_at DESC;

-- Competition Overview View
CREATE OR REPLACE VIEW competition_overview AS
SELECT 
    c.competition_id,
    c.competition_name,
    c.competition_date,
    et.type_name as event_type,
    et.is_pageant,
    COUNT(DISTINCT p.participant_id) as total_participants,
    COUNT(DISTINCT j.judge_id) as total_judges,
    COUNT(DISTINCT cc.criteria_id) as total_criteria
FROM competitions c
LEFT JOIN event_types et ON c.event_type_id = et.event_type_id
LEFT JOIN participants p ON c.competition_id = p.competition_id
LEFT JOIN judges j ON c.competition_id = j.competition_id
LEFT JOIN competition_criteria cc ON c.competition_id = cc.competition_id
GROUP BY c.competition_id;

-- Participant Scores Summary View
CREATE OR REPLACE VIEW participant_scores_summary AS
SELECT 
    p.participant_id,
    p.participant_name,
    p.contestant_number,
    c.competition_name,
    AVG(os.total_score) as average_score,
    COUNT(DISTINCT os.judge_id) as judges_scored,
    MAX(os.submitted_at) as last_scored_at
FROM participants p
JOIN competitions c ON p.competition_id = c.competition_id
LEFT JOIN overall_scores os ON p.participant_id = os.participant_id
GROUP BY p.participant_id, c.competition_id;

-- Judge Performance View
CREATE OR REPLACE VIEW judge_performance AS
SELECT 
    j.judge_id,
    j.judge_name,
    c.competition_name,
    COUNT(DISTINCT os.participant_id) as participants_scored,
    COUNT(DISTINCT os.overall_score_id) as total_scores_given,
    AVG(os.total_score) as average_score_given,
    MAX(os.submitted_at) as last_scoring_date
FROM judges j
JOIN competitions c ON j.competition_id = c.competition_id
LEFT JOIN overall_scores os ON j.judge_id = os.judge_id
GROUP BY j.judge_id, c.competition_id;

-- ================================================
-- SAMPLE DATA
-- ================================================

-- 1. USERS - Admin and Staff
INSERT INTO users (username, password, role, full_name) VALUES
('admin', 'admin123', 'admin', 'System Administrator'),
('maria.santos', 'staff123', 'staff', 'Maria Santos'),
('john.reyes', 'staff123', 'staff', 'John Reyes'),
('anna.cruz', 'staff123', 'staff', 'Anna Cruz'),
('carlos.garcia', 'staff123', 'staff', 'Carlos Garcia');

-- 2. EVENT TYPES
INSERT INTO event_types (type_name, description, is_pageant) VALUES
('Music Competition', 'Musical performances and talent shows', FALSE),
('Dance Competition', 'Dance performances and choreography', FALSE),
('Beauty Pageant', 'Beauty pageant with multiple segments', TRUE),
('Talent Show', 'General talent showcase', FALSE),
('Sports Competition', 'Athletic events and competitions', FALSE);

-- 3. SAMPLE COMPETITIONS
INSERT INTO competitions (competition_name, event_type_id, competition_date, event_description) VALUES
('Miss University 2025', 3, '2025-11-15', 'Annual university beauty pageant'),
('Battle of the Bands 2025', 1, '2025-10-20', 'Inter-school music competition'),
('Dance Revolution', 2, '2025-12-05', 'Contemporary dance showcase');

-- 4. SAMPLE JUDGES
INSERT INTO judges (judge_name, email, phone, expertise, experience_years, credentials, competition_id, user_id) VALUES
('Dr. Patricia Lopez', 'patricia.lopez@email.com', '09171234567', 'Pageantry & Communication', 10, 'PhD in Communication Arts, Former Miss Philippines Judge', 1, NULL),
('Prof. Michael Tan', 'michael.tan@email.com', '09181234568', 'Music & Performance', 15, 'Music Professor, Concert Pianist', 2, NULL),
('Ms. Sofia Reyes', 'sofia.reyes@email.com', '09191234569', 'Dance & Choreography', 8, 'Professional Choreographer, Dance Instructor', 3, NULL),
('Mr. Roberto Cruz', 'roberto.cruz@email.com', '09201234570', 'Talent & Entertainment', 12, 'Talent Manager, Event Producer', 1, NULL),
('Ms. Lisa Wong', 'lisa.wong@email.com', '09211234571', 'Beauty & Fashion', 6, 'Fashion Designer, Beauty Consultant', 1, NULL);

-- 5. SAMPLE PARTICIPANTS FOR MISS UNIVERSITY 2025
INSERT INTO participants (participant_name, contestant_number, email, phone, age, gender, school_organization, competition_id, status, height, measurements, talents) VALUES
('Isabella Marie Torres', '001', 'isabella.torres@email.com', '09221234572', 21, 'female', 'University of the Philippines', 1, 'paid', '5\'7"', '34-24-36', 'Classical Piano, Public Speaking'),
('Sophia Grace Mendoza', '002', 'sophia.mendoza@email.com', '09231234573', 20, 'female', 'Ateneo de Manila University', 1, 'paid', '5\'6"', '33-25-35', 'Contemporary Dance, Singing'),
('Gabriella Rose Santos', '003', 'gabriella.santos@email.com', '09241234574', 22, 'female', 'De La Salle University', 1, 'paid', '5\'8"', '35-24-37', 'Violin Performance, Poetry'),
('Francesca Mae Ramos', '004', 'francesca.ramos@email.com', '09251234575', 21, 'female', 'University of Santo Tomas', 1, 'pending', '5\'5"', '32-24-34', 'Ballet, Painting'),
('Victoria Ann Cruz', '005', 'victoria.cruz@email.com', '09261234576', 23, 'female', 'Polytechnic University', 1, 'paid', '5\'7"', '34-25-36', 'Jazz Dance, Guitar');

-- 6. SAMPLE PARTICIPANTS FOR BATTLE OF THE BANDS
INSERT INTO participants (participant_name, contestant_number, email, phone, age, gender, school_organization, performance_title, performance_description, competition_id, status) VALUES
('The Resonance Band', 'B-01', 'resonance@email.com', '09271234577', 22, 'other', 'UP Music Society', 'Breaking Chains', 'Original rock ballad with social commentary', 2, 'paid'),
('Acoustic Dreams', 'B-02', 'acoustic.dreams@email.com', '09281234578', 21, 'other', 'Ateneo Musicians Guild', 'Whispers in the Wind', 'Folk-pop acoustic performance', 2, 'paid'),
('Electric Pulse', 'B-03', 'electric.pulse@email.com', '09291234579', 23, 'other', 'DLSU Band Society', 'Neon Nights', 'Electronic rock fusion', 2, 'waived');

-- 7. COMPETITION CRITERIA FOR MISS UNIVERSITY (Pageant)
INSERT INTO competition_criteria (competition_id, criteria_name, description, percentage, max_score, order_number) VALUES
-- Swimsuit Competition
(1, 'Physical Fitness', 'Overall physical conditioning and health', 30.00, 100, 1),
(1, 'Stage Presence', 'Confidence and poise on stage', 40.00, 100, 2),
(1, 'Overall Impression', 'General appeal and presentation', 30.00, 100, 3),
-- Evening Gown
(1, 'Elegance & Grace', 'Poise and sophistication in evening wear', 35.00, 100, 4),
(1, 'Fashion Sense', 'Style and appropriateness of gown choice', 30.00, 100, 5),
(1, 'Stage Movement', 'Walking and presentation skills', 35.00, 100, 6),
-- Q&A
(1, 'Intelligence', 'Depth and quality of response', 40.00, 100, 7),
(1, 'Communication Skills', 'Articulation and delivery', 35.00, 100, 8),
(1, 'Wit & Charm', 'Personality and likeability', 25.00, 100, 9);

-- 8. PAGEANT SEGMENTS FOR MISS UNIVERSITY
INSERT INTO pageant_segments (competition_id, segment_name, segment_date, segment_time, description, order_number, day_number, is_active) VALUES
(1, 'Swimsuit Competition', '2025-11-15', '14:00:00', 'Candidates showcase physical fitness', 1, 1, TRUE),
(1, 'Evening Gown', '2025-11-15', '16:00:00', 'Formal wear presentation', 2, 1, TRUE),
(1, 'Question & Answer', '2025-11-15', '18:00:00', 'Intelligence and communication round', 3, 1, TRUE);

-- 9. LINK CRITERIA TO SEGMENTS
INSERT INTO segment_criteria (segment_id, criteria_id, is_active) VALUES
-- Swimsuit segment (segment_id = 1)
(1, 1, TRUE), -- Physical Fitness
(1, 2, TRUE), -- Stage Presence
(1, 3, TRUE), -- Overall Impression
-- Evening Gown segment (segment_id = 2)
(2, 4, TRUE), -- Elegance & Grace
(2, 5, TRUE), -- Fashion Sense
(2, 6, TRUE), -- Stage Movement
-- Q&A segment (segment_id = 3)
(3, 7, TRUE), -- Intelligence
(3, 8, TRUE), -- Communication Skills
(3, 9, TRUE); -- Wit & Charm

-- 10. COMPETITION CRITERIA FOR BATTLE OF THE BANDS
INSERT INTO competition_criteria (competition_id, criteria_name, description, percentage, max_score, order_number) VALUES
(2, 'Musical Technique', 'Technical proficiency and skill', 30.00, 100, 1),
(2, 'Stage Performance', 'Energy and audience engagement', 25.00, 100, 2),
(2, 'Originality', 'Creativity and uniqueness', 25.00, 100, 3),
(2, 'Overall Impact', 'Memorability and impression', 20.00, 100, 4);

-- 11. SAMPLE SCORES (Some completed, some pending)
-- Judge 1 scores for Participant 1 (Isabella) - Swimsuit segment
INSERT INTO pageant_segment_scores (judge_id, participant_id, segment_id, criteria_id, score, weighted_score, comments, is_locked) VALUES
(1, 1, 1, 1, 90.00, 27.00, 'Excellent physical conditioning', TRUE),
(1, 1, 1, 2, 88.00, 35.20, 'Confident stage presence', TRUE),
(1, 1, 1, 3, 85.00, 25.50, 'Great overall impression', TRUE);

-- Judge 2 scores for Participant 1 (Isabella) - Swimsuit segment
INSERT INTO pageant_segment_scores (judge_id, participant_id, segment_id, criteria_id, score, weighted_score, comments, is_locked) VALUES
(4, 1, 1, 1, 92.00, 27.60, 'Outstanding fitness level', FALSE),
(4, 1, 1, 2, 90.00, 36.00, 'Very strong stage presence', FALSE),
(4, 1, 1, 3, 88.00, 26.40, 'Impressive overall', FALSE);

-- Overall score for Isabella from Judge 1
INSERT INTO overall_scores (judge_id, participant_id, competition_id, segment_id, total_score, general_comments, is_locked) VALUES
(1, 1, 1, 1, 87.70, 'Strong contender, excellent performance in swimsuit round', TRUE),
(4, 1, 1, 1, 90.00, 'Top tier performance, very impressive', FALSE);

-- 12. SAMPLE UNLOCK REQUESTS
INSERT INTO unlock_requests (judge_id, participant_id, segment_id, competition_id, score_type, reason, status) VALUES
(1, 1, 1, 1, 'segment', 'Need to adjust score due to calculation error noticed after submission', 'pending'),
(4, 2, 2, 1, 'segment', 'Accidentally entered wrong score for evening gown segment', 'approved');

-- 13. SAMPLE CRITERIA TEMPLATES
INSERT INTO criteria_templates (template_name, event_type_id, description) VALUES
('Standard Pageant Criteria', 3, 'Default criteria for beauty pageants'),
('Music Competition Standard', 1, 'Standard evaluation for music competitions'),
('Dance Competition Rubric', 2, 'Standard dance evaluation criteria');

-- ================================================
-- USEFUL QUERIES FOR YOUR APPLICATION
-- ================================================

-- Get all participants with their scores for a competition
-- SELECT 
--     p.participant_id,
--     p.participant_name,
--     p.contestant_number,
--     AVG(os.total_score) as average_score,
--     COUNT(DISTINCT os.judge_id) as judge_count
-- FROM participants p
-- LEFT JOIN overall_scores os ON p.participant_id = os.participant_id
-- WHERE p.competition_id = ?
-- GROUP BY p.participant_id
-- ORDER BY average_score DESC;

-- Get judge's scoring progress
-- SELECT 
--     j.judge_name,
--     COUNT(DISTINCT os.participant_id) as scored_count,
--     (SELECT COUNT(*) FROM participants WHERE competition_id = ?) as total_participants
-- FROM judges j
-- LEFT JOIN overall_scores os ON j.judge_id = os.judge_id
-- WHERE j.competition_id = ?
-- GROUP BY j.judge_id;

-- Check if score is locked
-- SELECT is_locked, locked_at, TIMESTAMPDIFF(MINUTE, locked_at, NOW()) as minutes_locked
-- FROM overall_scores
-- WHERE judge_id = ? AND participant_id = ? AND segment_id = ?;

-- Get pending unlock requests
-- SELECT * FROM unlock_requests_view WHERE status = 'pending';

-- ================================================
-- END OF SCHEMA
-- ================================================