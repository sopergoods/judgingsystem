-- =====================================================
-- MSEU FCI JUDGING SYSTEM - COMPLETE DATABASE SCHEMA WITH SAMPLE DATA
-- =====================================================
-- Includes: Regular Competition + Multi-Day Pageant (NO SCORES - READY FOR TESTING)
-- Sample Data: 5 Judges, 5 Participants per competition
-- =====================================================

-- Disable foreign key checks temporarily to allow dropping tables
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables in any order (foreign keys disabled)
DROP TABLE IF EXISTS score_edit_history;
DROP TABLE IF EXISTS unlock_requests;
DROP TABLE IF EXISTS draft_scores;
DROP TABLE IF EXISTS segment_criteria;
DROP TABLE IF EXISTS pageant_segment_scores;
DROP TABLE IF EXISTS pageant_segments;
DROP TABLE IF EXISTS detailed_scores;
DROP TABLE IF EXISTS overall_scores;
DROP TABLE IF EXISTS judges;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS competition_criteria;
DROP TABLE IF EXISTS competitions;
DROP TABLE IF EXISTS criteria_templates;
DROP TABLE IF EXISTS event_types;
DROP TABLE IF EXISTS users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 1. USERS TABLE (Authentication)
-- =====================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'judge') NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. EVENT TYPES TABLE
-- =====================================================
CREATE TABLE event_types (
    event_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_pageant BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_is_pageant (is_pageant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. COMPETITIONS TABLE
-- =====================================================
CREATE TABLE competitions (
    competition_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_name VARCHAR(255) NOT NULL,
    event_type_id INT NOT NULL,
    competition_date DATE NOT NULL,
    event_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_type_id) REFERENCES event_types(event_type_id) ON DELETE CASCADE,
    INDEX idx_competition_date (competition_date),
    INDEX idx_event_type (event_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. COMPETITION CRITERIA TABLE
-- =====================================================
CREATE TABLE competition_criteria (
    criteria_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    criteria_name VARCHAR(255) NOT NULL,
    description TEXT,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    max_score INT NOT NULL DEFAULT 100,
    order_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    INDEX idx_competition (competition_id),
    INDEX idx_order (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE participants (
    participant_id INT AUTO_INCREMENT PRIMARY KEY,
    participant_name VARCHAR(255) NOT NULL,
    contestant_number VARCHAR(50),
    photo_url TEXT,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    age INT NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    school_organization VARCHAR(255),
    performance_title VARCHAR(255),
    performance_description TEXT,
    competition_id INT NOT NULL,
    status ENUM('active', 'disqualified', 'done', 'pending', 'ongoing') DEFAULT 'active',
    height VARCHAR(50),
    measurements VARCHAR(255),
    talents TEXT,
    special_awards TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    INDEX idx_competition (competition_id),
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. JUDGES TABLE
-- =====================================================
CREATE TABLE judges (
    judge_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    expertise TEXT NOT NULL,
    experience_years INT DEFAULT 0,
    credentials TEXT,
    competition_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_competition (competition_id),
    INDEX idx_user (user_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. PAGEANT SEGMENTS TABLE (Multi-Day Events)
-- =====================================================
CREATE TABLE pageant_segments (
    segment_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    segment_name VARCHAR(255) NOT NULL,
    segment_date DATE NOT NULL,
    segment_time TIME DEFAULT '18:00:00',
    description TEXT,
    order_number INT NOT NULL DEFAULT 1,
    day_number INT NOT NULL DEFAULT 1,
    segment_weight DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    INDEX idx_competition (competition_id),
    INDEX idx_date (segment_date),
    INDEX idx_day_order (day_number, order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. SEGMENT CRITERIA TABLE (Criteria Assignment)
-- =====================================================
CREATE TABLE segment_criteria (
    segment_criteria_id INT AUTO_INCREMENT PRIMARY KEY,
    segment_id INT NOT NULL,
    criteria_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES competition_criteria(criteria_id) ON DELETE CASCADE,
    UNIQUE KEY unique_segment_criteria (segment_id, criteria_id),
    INDEX idx_segment (segment_id),
    INDEX idx_criteria (criteria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. OVERALL SCORES TABLE (Final Scores)
-- =====================================================
CREATE TABLE overall_scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    competition_id INT NOT NULL,
    total_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_rank INT,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    UNIQUE KEY unique_score (judge_id, participant_id, competition_id),
    INDEX idx_judge (judge_id),
    INDEX idx_participant (participant_id),
    INDEX idx_competition (competition_id),
    INDEX idx_locked (is_locked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. DETAILED SCORES TABLE (Per-Criteria Scores)
-- =====================================================
CREATE TABLE detailed_scores (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    competition_id INT NOT NULL,
    segment_id INT,
    criteria_id INT NOT NULL,
    score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    weighted_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES competition_criteria(criteria_id) ON DELETE CASCADE,
    INDEX idx_judge_participant (judge_id, participant_id),
    INDEX idx_competition (competition_id),
    INDEX idx_segment (segment_id),
    INDEX idx_criteria (criteria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. PAGEANT SEGMENT SCORES TABLE
-- =====================================================
CREATE TABLE pageant_segment_scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    segment_id INT NOT NULL,
    criteria_id INT NOT NULL,
    score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    weighted_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES competition_criteria(criteria_id) ON DELETE CASCADE,
    UNIQUE KEY unique_score (judge_id, participant_id, segment_id, criteria_id),
    INDEX idx_judge (judge_id),
    INDEX idx_participant (participant_id),
    INDEX idx_segment (segment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. DRAFT SCORES TABLE (Auto-Save Feature)
-- =====================================================
CREATE TABLE draft_scores (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    segment_id INT,
    draft_data JSON NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    UNIQUE KEY unique_draft (judge_id, participant_id, segment_id),
    INDEX idx_judge (judge_id),
    INDEX idx_participant (participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. UNLOCK REQUESTS TABLE
-- =====================================================
CREATE TABLE unlock_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    competition_id INT NOT NULL,
    segment_id INT,
    score_type ENUM('overall', 'segment') DEFAULT 'overall',
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by_user_id INT,
    admin_notes TEXT,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_judge (judge_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. SCORE EDIT HISTORY TABLE (Audit Trail)
-- =====================================================
CREATE TABLE score_edit_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    competition_id INT NOT NULL,
    segment_id INT,
    score_type ENUM('overall', 'segment') DEFAULT 'overall',
    edit_type ENUM('admin_unlock', 'judge_edit', 'system_lock') NOT NULL,
    edited_by_user_id INT,
    edit_reason TEXT,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_judge_participant (judge_id, participant_id),
    INDEX idx_edited_at (edited_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA INSERTS
-- =====================================================

-- Insert admin, staff, and judge users
INSERT INTO users (username, password, role, full_name) VALUES
('admin', 'admin123', 'admin', 'System Administrator'),
('staff1', 'staff123', 'staff', 'Staff User'),
('judge1', 'judge123', 'judge', 'Maria Santos'),
('judge2', 'judge123', 'judge', 'Roberto Cruz'),
('judge3', 'judge123', 'judge', 'Carmen Reyes'),
('judge4', 'judge123', 'judge', 'Jose Garcia'),
('judge5', 'judge123', 'judge', 'Ana Mendoza');

-- Insert event types
INSERT INTO event_types (type_name, description, is_pageant) VALUES
('Talent Competition', 'Individual or group talent showcase', FALSE),
('Beauty Pageant', 'Traditional beauty pageant with multiple segments', TRUE),
('Cultural Dance', 'Cultural and traditional dance performance', FALSE),
('Singing Competition', 'Vocal performance competition', FALSE),
('Mr. & Ms. Event', 'Multi-segment pageant competition', TRUE);

-- =====================================================
-- COMPETITION 1: REGULAR TALENT COMPETITION
-- =====================================================

INSERT INTO competitions (competition_name, event_type_id, competition_date, event_description) VALUES
('MSEU Talent Showcase 2025', 1, '2025-11-15', 'Annual talent competition featuring the best performers from different universities');

-- Insert competition criteria for Competition 1
INSERT INTO competition_criteria (competition_id, criteria_name, description, percentage, max_score, order_number) VALUES
(1, 'Technical Skills', 'Mastery of technique and execution', 30.00, 100, 1),
(1, 'Creativity & Originality', 'Innovation and unique artistic expression', 25.00, 100, 2),
(1, 'Stage Presence', 'Confidence, charisma, and audience engagement', 25.00, 100, 3),
(1, 'Overall Impact', 'Emotional connection and lasting impression', 20.00, 100, 4);

-- Insert 5 participants for Competition 1
INSERT INTO participants (participant_name, contestant_number, email, phone, age, gender, school_organization, performance_title, performance_description, competition_id, status) VALUES
('Juan Dela Cruz', '001', 'juan.delacruz@email.com', '09171234567', 21, 'male', 'University of Manila', 'Fire Dance Fusion', 'Contemporary dance with traditional Filipino elements', 1, 'active'),
('Maria Clara Santos', '002', 'maria.santos@email.com', '09181234568', 20, 'female', 'Ateneo de Manila', 'Voice of the Islands', 'Vocal performance featuring OPM classics', 1, 'active'),
('Carlos Mendoza', '003', 'carlos.mendoza@email.com', '09191234569', 22, 'male', 'De La Salle University', 'Urban Rhythm', 'Hip-hop dance with beatbox performance', 1, 'active'),
('Isabella Reyes', '004', 'isabella.reyes@email.com', '09201234570', 19, 'female', 'University of Santo Tomas', 'Piano Dreams', 'Classical piano with modern arrangement', 1, 'active'),
('Miguel Torres', '005', 'miguel.torres@email.com', '09211234571', 23, 'male', 'Far Eastern University', 'Magic & Illusion', 'Contemporary magic performance with storytelling', 1, 'active');

-- Insert 5 judges for Competition 1
INSERT INTO judges (judge_name, email, phone, expertise, experience_years, credentials, competition_id, user_id) VALUES
('Maria Santos', 'maria.judge@email.com', '09171111111', 'Dance Choreography, Performance Arts', 15, 'Professional Dancer, Dance Teacher at National Academy', 1, 3),
('Roberto Cruz', 'roberto.judge@email.com', '09172222222', 'Vocal Performance, Music Theory', 12, 'Voice Coach, Former Opera Singer', 1, 4),
('Carmen Reyes', 'carmen.judge@email.com', '09173333333', 'Theater Arts, Stage Direction', 18, 'Theater Director, Drama Professor', 1, 5),
('Jose Garcia', 'jose.judge@email.com', '09174444444', 'Music Composition, Instrumental Performance', 10, 'Concert Pianist, Music Conductor', 1, 6),
('Ana Mendoza', 'ana.judge@email.com', '09175555555', 'Contemporary Arts, Cultural Performance', 14, 'Cultural Arts Director, Festival Organizer', 1, 7);

-- =====================================================
-- COMPETITION 2: MULTI-DAY PAGEANT (MR. & MS. MSEU 2025)
-- =====================================================

INSERT INTO competitions (competition_name, event_type_id, competition_date, event_description) VALUES
('Mr. & Ms. MSEU 2025', 5, '2025-12-10', 'Three-day pageant competition showcasing beauty, talent, intelligence, and personality');

-- Insert competition criteria for Competition 2 (Pageant)
INSERT INTO competition_criteria (competition_id, criteria_name, description, percentage, max_score, order_number) VALUES
(2, 'Physical Appearance', 'Overall physical presentation and grooming', 30.00, 100, 1),
(2, 'Poise & Carriage', 'Grace, posture, and movement', 25.00, 100, 2),
(2, 'Confidence', 'Self-assurance and composure', 25.00, 100, 3),
(2, 'Stage Presence', 'Charisma and audience connection', 20.00, 100, 4),
(2, 'Talent Performance', 'Skill and creativity in talent presentation', 30.00, 100, 5),
(2, 'Originality', 'Uniqueness and innovation', 25.00, 100, 6),
(2, 'Entertainment Value', 'Audience engagement and enjoyment', 25.00, 100, 7),
(2, 'Execution', 'Technical skill and polish', 20.00, 100, 8),
(2, 'Evening Gown Presentation', 'Elegance and sophistication in formal wear', 35.00, 100, 9),
(2, 'Overall Beauty', 'Complete aesthetic presentation', 35.00, 100, 10),
(2, 'Personality', 'Charm and likability', 30.00, 100, 11),
(2, 'Intelligence', 'Articulation and depth of response', 25.00, 100, 12),
(2, 'Relevance', 'Appropriateness and insight of answer', 25.00, 100, 13),
(2, 'Delivery', 'Clarity and confidence in communication', 20.00, 100, 14);

-- Insert 3 pageant segments (3-day event)
INSERT INTO pageant_segments (competition_id, segment_name, segment_date, segment_time, description, order_number, day_number, segment_weight) VALUES
(2, 'Swimsuit & Introduction', '2025-12-10', '18:00:00', 'Opening segment featuring swimsuit presentation and contestant introductions', 1, 1, 25.00),
(2, 'Talent Showcase', '2025-12-11', '19:00:00', 'Individual talent performances showcasing unique skills and creativity', 1, 2, 30.00),
(2, 'Evening Gown & Q&A', '2025-12-12', '20:00:00', 'Final segment with evening gown presentation and question-answer portion', 1, 3, 45.00);

-- Assign criteria to segments
-- Segment 1: Swimsuit & Introduction (Criteria 1-4)
INSERT INTO segment_criteria (segment_id, criteria_id, is_active) VALUES
(1, 1, TRUE),  -- Physical Appearance
(1, 2, TRUE),  -- Poise & Carriage
(1, 3, TRUE),  -- Confidence
(1, 4, TRUE);  -- Stage Presence

-- Segment 2: Talent Showcase (Criteria 5-8)
INSERT INTO segment_criteria (segment_id, criteria_id, is_active) VALUES
(2, 5, TRUE),  -- Talent Performance
(2, 6, TRUE),  -- Originality
(2, 7, TRUE),  -- Entertainment Value
(2, 8, TRUE);  -- Execution

-- Segment 3: Evening Gown & Q&A (Criteria 9-14)
INSERT INTO segment_criteria (segment_id, criteria_id, is_active) VALUES
(3, 9, TRUE),   -- Evening Gown Presentation
(3, 10, TRUE),  -- Overall Beauty
(3, 11, TRUE),  -- Personality
(3, 12, TRUE),  -- Intelligence
(3, 13, TRUE),  -- Relevance
(3, 14, TRUE);  -- Delivery

-- Insert 5 participants for Competition 2 (Pageant)
INSERT INTO participants (participant_name, contestant_number, email, phone, age, gender, school_organization, competition_id, status, height, measurements, talents) VALUES
('Sofia Rodriguez', 'P-01', 'sofia.rodriguez@email.com', '09221234567', 22, 'female', 'University of Manila', 2, 'active', '5\'7"', '34-24-36', 'Classical Ballet, Piano'),
('Gabriel Hernandez', 'P-02', 'gabriel.hernandez@email.com', '09231234568', 24, 'male', 'Ateneo de Manila', 2, 'active', '6\'0"', 'Athletic Build', 'Contemporary Dance, Singing'),
('Valentina Cruz', 'P-03', 'valentina.cruz@email.com', '09241234569', 21, 'female', 'De La Salle University', 2, 'active', '5\'6"', '33-25-35', 'Vocal Performance, Guitar'),
('Rafael Santillan', 'P-04', 'rafael.santillan@email.com', '09251234570', 23, 'male', 'University of Santo Tomas', 2, 'active', '5\'11"', 'Athletic Build', 'Hip-hop Dance, Beatbox'),
('Angelica Fernandez', 'P-05', 'angelica.fernandez@email.com', '09261234571', 20, 'female', 'Far Eastern University', 2, 'active', '5\'8"', '35-24-36', 'Modern Dance, Poetry');

-- Insert 5 judges for Competition 2 (can be same judges with different IDs)
INSERT INTO judges (judge_name, email, phone, expertise, experience_years, credentials, competition_id, user_id) VALUES
('Maria Santos', 'maria.pageant@email.com', '09171111111', 'Pageant Coaching, Dance', 15, 'Former Miss Philippines Judge, Pageant Director', 2, 3),
('Roberto Cruz', 'roberto.pageant@email.com', '09172222222', 'Talent Development, Performance', 12, 'Talent Coach, Entertainment Director', 2, 4),
('Carmen Reyes', 'carmen.pageant@email.com', '09173333333', 'Fashion, Beauty Standards', 18, 'Fashion Designer, Beauty Consultant', 2, 5),
('Jose Garcia', 'jose.pageant@email.com', '09174444444', 'Communication, Public Speaking', 10, 'Communication Professor, TV Host', 2, 6),
('Ana Mendoza', 'ana.pageant@email.com', '09175555555', 'Cultural Arts, Performance', 14, 'Cultural Ambassador, Pageant Coordinator', 2, 7);

-- =====================================================
-- USEFUL VIEWS FOR REPORTING
-- =====================================================

-- Drop views if they exist
DROP VIEW IF EXISTS vw_competition_overview;
DROP VIEW IF EXISTS vw_judge_progress;
DROP VIEW IF EXISTS vw_participant_scores;
DROP VIEW IF EXISTS vw_pageant_segment_overview;

-- View: Competition Overview
CREATE VIEW vw_competition_overview AS
SELECT 
    c.competition_id,
    c.competition_name,
    c.competition_date,
    et.type_name,
    et.is_pageant,
    COUNT(DISTINCT p.participant_id) as participant_count,
    COUNT(DISTINCT j.judge_id) as judge_count,
    COUNT(DISTINCT ps.segment_id) as segment_count,
    COUNT(DISTINCT os.score_id) as score_count
FROM competitions c
LEFT JOIN event_types et ON c.event_type_id = et.event_type_id
LEFT JOIN participants p ON c.competition_id = p.competition_id
LEFT JOIN judges j ON c.competition_id = j.competition_id
LEFT JOIN pageant_segments ps ON c.competition_id = ps.competition_id
LEFT JOIN overall_scores os ON c.competition_id = os.competition_id
GROUP BY c.competition_id, c.competition_name, c.competition_date, et.type_name, et.is_pageant;

-- View: Judge Scoring Progress
CREATE VIEW vw_judge_progress AS
SELECT 
    j.judge_id,
    j.judge_name,
    c.competition_id,
    c.competition_name,
    COUNT(DISTINCT p.participant_id) as total_participants,
    COUNT(DISTINCT os.participant_id) as scored_participants,
    CASE 
        WHEN COUNT(DISTINCT p.participant_id) > 0 
        THEN ROUND((COUNT(DISTINCT os.participant_id) / COUNT(DISTINCT p.participant_id) * 100), 2)
        ELSE 0
    END as completion_percentage
FROM judges j
JOIN competitions c ON j.competition_id = c.competition_id
LEFT JOIN participants p ON c.competition_id = p.competition_id
LEFT JOIN overall_scores os ON j.judge_id = os.judge_id AND p.participant_id = os.participant_id
GROUP BY j.judge_id, j.judge_name, c.competition_id, c.competition_name;

-- View: Participant Average Scores
CREATE VIEW vw_participant_scores AS
SELECT 
    p.participant_id,
    p.participant_name,
    p.contestant_number,
    p.competition_id,
    c.competition_name,
    AVG(os.total_score) as average_score,
    COUNT(os.score_id) as judge_count
FROM participants p
LEFT JOIN overall_scores os ON p.participant_id = os.participant_id
LEFT JOIN competitions c ON p.competition_id = c.competition_id
GROUP BY p.participant_id, p.participant_name, p.contestant_number, p.competition_id, c.competition_name;

-- View: Pageant Segment Overview
CREATE VIEW vw_pageant_segment_overview AS
SELECT 
    ps.segment_id,
    ps.segment_name,
    ps.segment_date,
    ps.day_number,
    ps.order_number,
    ps.segment_weight,
    c.competition_id,
    c.competition_name,
    COUNT(DISTINCT sc.criteria_id) as criteria_count,
    COUNT(DISTINCT pss.score_id) as score_count
FROM pageant_segments ps
JOIN competitions c ON ps.competition_id = c.competition_id
LEFT JOIN segment_criteria sc ON ps.segment_id = sc.segment_id
LEFT JOIN pageant_segment_scores pss ON ps.segment_id = pss.segment_id
GROUP BY ps.segment_id, ps.segment_name, ps.segment_date, ps.day_number, 
         ps.order_number, ps.segment_weight, c.competition_id, c.competition_name;

-- =====================================================
-- DATABASE SETUP COMPLETE - READY FOR TESTING
-- =====================================================
-- Database: judging_system
-- Tables: 14
-- 
-- COMPETITION 1 (Regular): MSEU Talent Showcase 2025
--   - 5 Participants
--   - 5 Judges
--   - 4 Criteria
--   - NO SCORES (ready for manual scoring)
--
-- COMPETITION 2 (Multi-Day Pageant): Mr. & Ms. MSEU 2025
--   - 5 Participants
--   - 5 Judges
--   - 3 Segments (3 days)
--   - 14 Criteria (distributed across segments)
--     * Segment 1: Swimsuit & Introduction (4 criteria)
--     * Segment 2: Talent Showcase (4 criteria)
--     * Segment 3: Evening Gown & Q&A (6 criteria)
--   - NO SCORES (ready for manual scoring per segment)
--
-- Login Credentials:
--   Admin: username: admin, password: admin123
--   Staff: username: staff1, password: staff123
--   Judges: username: judge1-5, password: judge123
-- =====================================================

-- =====================================================
-- MINIMAL DATABASE UPDATES - ESSENTIAL ONLY
-- Run this if you just want the new features without sample data
-- =====================================================

-- =====================================================
-- 1. ADD YEAR_LEVEL TO PARTICIPANTS
-- =====================================================
-- If this gives "Duplicate column" error, that's OK - skip to next step
ALTER TABLE participants 
ADD COLUMN year_level ENUM('1st Year', '2nd Year', '3rd Year', '4th Year') 
DEFAULT '1st Year' AFTER gender;

-- =====================================================
-- 2. MAKE FIELDS OPTIONAL
-- =====================================================
ALTER TABLE participants MODIFY COLUMN email VARCHAR(255) NULL;
ALTER TABLE participants MODIFY COLUMN phone VARCHAR(50) NULL;
ALTER TABLE participants MODIFY COLUMN school_organization VARCHAR(255) NULL;
ALTER TABLE participants MODIFY COLUMN performance_title VARCHAR(255) NULL;
ALTER TABLE participants MODIFY COLUMN performance_description TEXT NULL;

ALTER TABLE judges MODIFY COLUMN email VARCHAR(255) NULL;
ALTER TABLE judges MODIFY COLUMN phone VARCHAR(50) NULL;
ALTER TABLE judges MODIFY COLUMN expertise TEXT NULL;
ALTER TABLE judges MODIFY COLUMN experience_years INT NULL DEFAULT 0;

-- =====================================================
-- 3. CREATE EVENT_HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    competition_name VARCHAR(255) NOT NULL,
    event_type_id INT NOT NULL,
    event_type_name VARCHAR(100) NOT NULL,
    competition_date DATE NOT NULL,
    completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    winner_participant_id INT,
    winner_name VARCHAR(255),
    total_participants INT DEFAULT 0,
    total_judges INT DEFAULT 0,
    event_status ENUM('completed', 'cancelled') DEFAULT 'completed',
    notes TEXT,
    archived_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_competition_date (competition_date),
    INDEX idx_completion_date (completion_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. CREATE SPECIAL_AWARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS special_awards (
    award_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    segment_id INT NOT NULL,
    award_name VARCHAR(255) NOT NULL,
    participant_id INT NOT NULL,
    awarded_by_judge_id INT,
    award_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (awarded_by_judge_id) REFERENCES judges(judge_id) ON DELETE SET NULL,
    INDEX idx_competition (competition_id),
    INDEX idx_segment (segment_id),
    INDEX idx_participant (participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. ADD STATUS TO COMPETITIONS
-- =====================================================
-- If this gives "Duplicate column" error, that's OK - skip to next step
ALTER TABLE competitions 
ADD COLUMN status ENUM('upcoming', 'ongoing', 'done') 
DEFAULT 'ongoing';

-- =====================================================
-- 6. CREATE VIEWS
-- =====================================================
DROP VIEW IF EXISTS vw_judge_tabulation;
CREATE VIEW vw_judge_tabulation AS
SELECT 
    c.competition_id,
    c.competition_name,
    j.judge_id,
    j.judge_name,
    p.participant_id,
    p.participant_name,
    p.contestant_number,
    os.total_score,
    os.is_locked,
    os.updated_at as score_date
FROM competitions c
JOIN judges j ON c.competition_id = j.competition_id
JOIN participants p ON c.competition_id = p.competition_id
LEFT JOIN overall_scores os ON j.judge_id = os.judge_id 
    AND p.participant_id = os.participant_id 
    AND os.segment_id IS NULL
ORDER BY c.competition_id, p.contestant_number, j.judge_name;

DROP VIEW IF EXISTS vw_special_awards_summary;
CREATE VIEW vw_special_awards_summary AS
SELECT 
    sa.competition_id,
    c.competition_name,
    ps.segment_name,
    ps.day_number,
    sa.award_name,
    p.participant_name,
    p.contestant_number,
    j.judge_name as awarded_by,
    sa.award_date
FROM special_awards sa
JOIN competitions c ON sa.competition_id = c.competition_id
JOIN pageant_segments ps ON sa.segment_id = ps.segment_id
JOIN participants p ON sa.participant_id = p.participant_id
LEFT JOIN judges j ON sa.awarded_by_judge_id = j.judge_id
ORDER BY sa.competition_id, ps.day_number, ps.order_number;

DROP VIEW IF EXISTS vw_event_history_overview;
CREATE VIEW vw_event_history_overview AS
SELECT 
    eh.*,
    et.type_name,
    et.is_pageant,
    COUNT(DISTINCT sa.award_id) as total_awards
FROM event_history eh
LEFT JOIN event_types et ON eh.event_type_id = et.event_type_id
LEFT JOIN special_awards sa ON eh.competition_id = sa.competition_id
GROUP BY eh.history_id
ORDER BY eh.completion_date DESC;

-- =====================================================
-- DONE! 
-- =====================================================
-- You can now:
-- 1. Add special awards through the admin UI
-- 2. Mark competitions as DONE
-- 3. Register participants with year level
-- 4. Register judges without email/phone
-- =====================================================

SELECT 'Database successfully updated!' as Status;
SELECT 'New tables: event_history, special_awards' as Tables_Added;
SELECT 'New columns: participants.year_level, competitions.status' as Columns_Added;