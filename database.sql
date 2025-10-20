-- ================================================
-- COMPLETE AUTOMATED JUDGING SYSTEM DATABASE - FIXED
-- ================================================

SET FOREIGN_KEY_CHECKS = 0;

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
    segment_id INT NULL,
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

-- 12. DRAFT SCORES TABLE (FIXED - segment_id can be NULL)
CREATE TABLE draft_scores (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    segment_id INT NULL,
    draft_data JSON NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_draft (judge_id, participant_id, segment_id),
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES pageant_segments(segment_id) ON DELETE CASCADE
);

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

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================
-- SAMPLE DATA
-- ================================================

INSERT INTO users (username, password, role, full_name) VALUES
('admin', 'admin123', 'admin', 'System Administrator');

INSERT INTO event_types (type_name, description, is_pageant) VALUES
('Beauty Pageant', 'Beauty pageant with multiple segments', TRUE),
('Music Competition', 'Musical performances and talent shows', FALSE);

SELECT 'Database created successfully!' as Status;