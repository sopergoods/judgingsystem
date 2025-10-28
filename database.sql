-- =====================================================
-- MSEU FCI JUDGING SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Generated from application code analysis
-- Supports: Regular Competitions & Multi-Day Pageants
-- Features: Scoring, Locking, Unlock Requests, Drafts
-- =====================================================

-- Drop existing tables in correct order (foreign key dependencies)
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
DROP TABLE IF EXISTS event_types;
DROP TABLE IF EXISTS users;

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
    status ENUM('Active', 'Disqualified', 'Done', 'pending', 'ongoing', 'done') DEFAULT 'Active',
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
    segment_id INT,
    total_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    general_comments TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE,
    UNIQUE KEY unique_judge_participant_segment (judge_id, participant_id, competition_id, segment_id),
    INDEX idx_judge (judge_id),
    INDEX idx_participant (participant_id),
    INDEX idx_competition (competition_id),
    INDEX idx_segment (segment_id),
    INDEX idx_locked (is_locked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. DETAILED SCORES TABLE (Per Criterion)
-- =====================================================
CREATE TABLE detailed_scores (
    detailed_score_id INT AUTO_INCREMENT PRIMARY KEY,
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
-- DEFAULT DATA INSERTS
-- =====================================================

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, role, full_name) VALUES
('admin', 'admin123', 'admin', 'System Administrator'),
('staff1', 'staff123', 'staff', 'Staff User');

-- Insert default event types
INSERT INTO event_types (type_name, description, is_pageant) VALUES
('Talent Competition', 'Individual or group talent showcase', FALSE),
('Beauty Pageant', 'Traditional beauty pageant with multiple segments', TRUE),
('Cultural Dance', 'Cultural and traditional dance performance', FALSE),
('Singing Competition', 'Vocal performance competition', FALSE),
('Mr. & Ms. Event', 'Multi-segment pageant competition', TRUE);

-- =====================================================
-- USEFUL VIEWS FOR REPORTING
-- =====================================================

-- View: Competition Overview
CREATE OR REPLACE VIEW vw_competition_overview AS
SELECT 
    c.competition_id,
    c.competition_name,
    c.competition_date,
    et.type_name,
    et.is_pageant,
    COUNT(DISTINCT p.participant_id) as participant_count,
    COUNT(DISTINCT j.judge_id) as judge_count,
    COUNT(DISTINCT os.score_id) as score_count
FROM competitions c
LEFT JOIN event_types et ON c.event_type_id = et.event_type_id
LEFT JOIN participants p ON c.competition_id = p.competition_id
LEFT JOIN judges j ON c.competition_id = j.competition_id
LEFT JOIN overall_scores os ON c.competition_id = os.competition_id
GROUP BY c.competition_id, c.competition_name, c.competition_date, et.type_name, et.is_pageant;

-- View: Judge Scoring Progress
CREATE OR REPLACE VIEW vw_judge_progress AS
SELECT 
    j.judge_id,
    j.judge_name,
    c.competition_id,
    c.competition_name,
    COUNT(DISTINCT p.participant_id) as total_participants,
    COUNT(DISTINCT os.participant_id) as scored_participants,
    ROUND((COUNT(DISTINCT os.participant_id) / COUNT(DISTINCT p.participant_id) * 100), 2) as completion_percentage
FROM judges j
JOIN competitions c ON j.competition_id = c.competition_id
LEFT JOIN participants p ON c.competition_id = p.competition_id
LEFT JOIN overall_scores os ON j.judge_id = os.judge_id AND p.participant_id = os.participant_id
GROUP BY j.judge_id, j.judge_name, c.competition_id, c.competition_name;

-- =====================================================
-- DATABASE SETUP COMPLETE
-- =====================================================
-- Database: judging_system
-- Tables: 14
-- Features: Full support for regular competitions & pageants
-- Includes: Scoring, locking, unlock requests, drafts, audit trail
-- =====================================================