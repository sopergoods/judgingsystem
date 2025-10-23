// ==========================================
// JUDGE DASHBOARD - REFACTORED CLEAN CODE
// Maroon & White Theme | Bug-Free | Same Functionality
// ==========================================

const API_URL = 'https://mseufci-judgingsystem.up.railway.app';

let lockTimer = null;
let lockCountdown = 10;
let currentScoreData = null;
let draftSaveTimeout = null;

// ==========================================
// 1. AUTHENTICATION & INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user || user.role !== 'judge') {
        window.location.href = 'login.html';
        return;
    }
    updateHeader(user);
}

function updateHeader(user) {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = `Welcome, ${user.username}`;
    }
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ==========================================
// 2. DASHBOARD
// ==========================================
function showDashboard() {
    document.getElementById("content").innerHTML = `
        <div class="dashboard-welcome">
            <h2>Welcome to the Judge Dashboard</h2>
            <p>Score participants and manage your judging assignments.</p>
            
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>My Competitions</h3>
                    <p>View competitions assigned to you</p>
                    <button onclick="showMyCompetitions()" class="card-button">View Assignments</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>Score Participants</h3>
                    <p>Rate and score participant performances</p>
                    <button onclick="showMyCompetitions()" class="card-button">Start Scoring</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>Scoring History</h3>
                    <p>Review your previous scores and comments</p>
                    <button onclick="showScoringHistory()" class="card-button">View History</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>Unlock Requests</h3>
                    <p>View status of your unlock requests</p>
                    <button onclick="viewMyUnlockRequests()" class="card-button">View Requests</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>My Profile</h3>
                    <p>View your judge profile and credentials</p>
                    <button onclick="showProfile()" class="card-button">View Profile</button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 3. MY COMPETITIONS
// ==========================================
function showMyCompetitions() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch(`${API_URL}/judges`)
        .then(response => response.json())
        .then(judges => {
            const currentJudge = judges.find(j => j.user_id === user.user_id);
            if (!currentJudge) {
                document.getElementById("content").innerHTML = `
                    <h2>My Competitions</h2>
                    <p class="alert alert-error">Judge profile not found. Please contact administrator.</p>
                `;
                return;
            }

            fetch(`${API_URL}/judge-competitions/${currentJudge.judge_id}`)
                .then(response => response.json())
                .then(competitions => {
                    displayCompetitions(competitions);
                })
                .catch(error => {
                    console.error('Error fetching competitions:', error);
                    showNotification('Error loading competitions', 'error');
                });
        })
        .catch(error => {
            console.error('Error fetching judge:', error);
            showNotification('Error loading judge profile', 'error');
        });
}

function displayCompetitions(competitions) {
    let html = `
        <h2>My Competitions</h2>
        <div style="margin-bottom: 20px;">
            <p>You are assigned to judge the following competitions:</p>
        </div>
    `;

    if (competitions.length === 0) {
        html += '<p class="alert alert-warning">No competitions assigned to you yet.</p>';
    } else {
        html += '<div style="display: grid; gap: 20px;">';
        
        competitions.forEach(competition => {
            html += `
                <div class="dashboard-card" style="text-align: left;">
                    <h3>${competition.competition_name}</h3>
                    <p><strong>Event Type:</strong> ${competition.type_name}</p>
                    <p><strong>Date:</strong> ${competition.competition_date}</p>
                    <p><strong>Participants:</strong> ${competition.participant_count}</p>
                    <div style="margin-top: 15px;">
                        <button onclick="viewCompetitionParticipants(${competition.competition_id})" class="card-button">
                            View Participants
                        </button>
                        <button onclick="startScoring(${competition.competition_id})" class="card-button">
                            Start Scoring
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }

    document.getElementById("content").innerHTML = html;
}

// ==========================================
// 4. VIEW PARTICIPANTS
// ==========================================
function viewCompetitionParticipants(competitionId) {
    fetch(`${API_URL}/participants/${competitionId}`)
        .then(response => response.json())
        .then(participants => {
            displayParticipants(participants, competitionId);
        })
        .catch(error => {
            console.error('Error fetching participants:', error);
            showNotification('Error loading participants', 'error');
        });
}

function displayParticipants(participants, competitionId) {
    let html = `
        <h2>Competition Participants</h2>
        <div style="margin-bottom: 20px;">
            <button onclick="showMyCompetitions()" class="secondary">Back to My Competitions</button>
        </div>
    `;

    if (participants.length === 0) {
        html += '<p class="alert alert-warning">No participants registered for this competition yet.</p>';
    } else {
        html += `
            <table>
                <tr>
                    <th>Participant Name</th>
                    <th>Age</th>
                    <th>Performance Title</th>
                    <th>School/Organization</th>
                    <th>Actions</th>
                </tr>
        `;
        
        participants.forEach(participant => {
            html += `
                <tr>
                    <td>${participant.participant_name}</td>
                    <td>${participant.age}</td>
                    <td>${participant.performance_title || 'N/A'}</td>
                    <td>${participant.school_organization || 'Not specified'}</td>
                    <td>
                        <button onclick="scoreParticipant(${participant.participant_id}, ${competitionId}, '${escapeString(participant.participant_name)}')">
                            Score Performance
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</table>';
    }

    document.getElementById("content").innerHTML = html;
}

function startScoring(competitionId) {
    viewCompetitionParticipants(competitionId);
}

function escapeString(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ==========================================
// 5. MAIN SCORING FUNCTION
// ==========================================
function scoreParticipant(participantId, competitionId, participantName) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch(`${API_URL}/judges`)
        .then(response => response.json())
        .then(judges => {
            const currentJudge = judges.find(j => j.user_id === user.user_id);
            if (!currentJudge) {
                showNotification('Judge profile not found', 'error');
                return;
            }

            checkIfScoreLocked(currentJudge.judge_id, participantId, competitionId, null, (isLocked, lockInfo) => {
                if (isLocked) {
                    showLockedScoreMessage(currentJudge.judge_id, participantId, competitionId, null, participantName, lockInfo);
                    return;
                }
                
                fetch(`${API_URL}/participant/${participantId}`)
                    .then(response => response.json())
                    .then(participant => {
                        fetch(`${API_URL}/competition/${competitionId}`)
                            .then(response => response.json())
                            .then(competition => {
                                if (competition.is_pageant) {
                                    showSegmentSelection(currentJudge.judge_id, participantId, competitionId, participantName);
                                } else {
                                    showRegularScoringForm(currentJudge.judge_id, participantId, competitionId, participantName, participant);
                                }
                            })
                            .catch(error => {
                                console.error('Error fetching competition:', error);
                                showNotification('Error loading competition details', 'error');
                            });
                    })
                    .catch(error => {
                        console.error('Error fetching participant:', error);
                        showNotification('Error loading participant details', 'error');
                    });
            });
        })
        .catch(error => {
            console.error('Error fetching judge:', error);
            showNotification('Error loading judge profile', 'error');
        });
}

// ==========================================
// 6. CHECK IF SCORE IS LOCKED
// ==========================================
function checkIfScoreLocked(judgeId, participantId, competitionId, segmentId, callback) {
    let url = `${API_URL}/check-score-lock/${judgeId}/${participantId}/${competitionId}`;
    
    if (segmentId) {
        url += `/${segmentId}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.is_locked && data.seconds_since_lock > 10) {
                callback(true, data);
            } else {
                callback(false, data);
            }
        })
        .catch(error => {
            console.error('Error checking lock:', error);
            callback(false, null);
        });
}

// ==========================================
// 7. SHOW LOCKED SCORE MESSAGE
// ==========================================
function showLockedScoreMessage(judgeId, participantId, competitionId, segmentId, participantName, lockInfo) {
    const minutesLocked = Math.floor(lockInfo.seconds_since_lock / 60);
    
    document.getElementById("content").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 80px; margin-bottom: 20px;">🔒</div>
            <h2>Score Already Submitted & Locked</h2>
            <h3 style="color: #800020;">${participantName}</h3>
            
            <div style="max-width: 600px; margin: 30px auto; padding: 20px; background: #fff3cd; border-radius: 8px; border: 2px solid #800020;">
                <p style="font-size: 16px; margin-bottom: 15px;">
                    You submitted a score for this participant <strong>${minutesLocked} minutes ago</strong>
                </p>
                <p style="font-size: 14px; color: #666;">
                    Scores are automatically locked 10 seconds after submission to ensure fairness and prevent score manipulation.
                </p>
            </div>
            
            <div style="margin-top: 30px;">
                <h4>Need to Edit Your Score?</h4>
                <p style="color: #666; margin: 15px 0;">
                    You can request the administrator to unlock this score for editing.
                </p>
                <button onclick="requestUnlock(${judgeId}, ${participantId}, ${competitionId}, ${segmentId}, '${escapeString(participantName)}', '${segmentId ? 'segment' : 'overall'}')" 
                        class="card-button" 
                        style="font-size: 16px; padding: 15px 30px;">
                    Request Unlock from Admin
                </button>
            </div>
            
            <div style="margin-top: 30px;">
                <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">
                    Back to Participants
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// 8. PAGEANT SEGMENT SELECTION
// ==========================================
function showSegmentSelection(judgeId, participantId, competitionId, participantName) {
    document.getElementById("content").innerHTML = `
        <h2>Pageant Scoring - Select Segment</h2>
        <h3 style="color: #800020;">Participant: ${participantName}</h3>
        
        <div style="margin-bottom: 20px;">
            <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Back to Participants</button>
        </div>
        
        <div class="alert alert-info">
            <strong>Multi-Segment Pageant Scoring:</strong>
            <p>This pageant has multiple segments. Select which segment you want to score for this participant.</p>
        </div>
        
        <div id="segmentsList">
            <div class="loading">Loading pageant segments...</div>
        </div>
    `;

    fetch(`${API_URL}/pageant-segments/${competitionId}`)
        .then(response => response.json())
        .then(segments => {
            displaySegments(segments, judgeId, participantId, competitionId, participantName);
        })
        .catch(error => {
            console.error('Error loading segments:', error);
            document.getElementById("segmentsList").innerHTML = `
                <div class="alert alert-error">
                    <h3>Error Loading Segments</h3>
                    <p>Error: ${error.message}</p>
                    <p>Please contact the administrator.</p>
                </div>
            `;
        });
}

function displaySegments(segments, judgeId, participantId, competitionId, participantName) {
    if (segments.length === 0) {
        document.getElementById("segmentsList").innerHTML = `
            <div class="alert alert-warning">
                <h3>No Segments Configured</h3>
                <p>This pageant doesn't have segments set up yet. Contact the administrator to create segments.</p>
            </div>
        `;
        return;
    }

    const segmentsByDay = {};
    segments.forEach(segment => {
        const day = segment.day_number || 1;
        if (!segmentsByDay[day]) {
            segmentsByDay[day] = [];
        }
        segmentsByDay[day].push(segment);
    });

    let html = '<div style="display: grid; gap: 20px;">';
    
    Object.keys(segmentsByDay).sort((a, b) => a - b).forEach(dayNumber => {
        const daySegments = segmentsByDay[dayNumber];
        const firstSegment = daySegments[0];
        
        html += `
            <div class="dashboard-card" style="text-align: left; border-left: 5px solid #800020;">
                <h3>Day ${dayNumber} - ${new Date(firstSegment.segment_date).toLocaleDateString()}</h3>
                <p><strong>Time:</strong> ${firstSegment.segment_time || 'TBD'}</p>
                ${firstSegment.description ? `<p><strong>Description:</strong> ${firstSegment.description}</p>` : ''}
                
                <div style="margin-top: 20px;">
        `;
        
        daySegments.forEach(segment => {
            html += `
                <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid #800020;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <strong style="font-size: 16px; color: #800020;">${segment.segment_name}</strong>
                            ${segment.description ? `<br><small style="color: #666;">${segment.description}</small>` : ''}
                        </div>
                        <button onclick="showSegmentScoring(${judgeId}, ${participantId}, ${competitionId}, ${segment.segment_id}, '${escapeString(participantName)}', '${escapeString(segment.segment_name)}');" 
                                class="card-button" 
                                style="white-space: nowrap; margin-left: 15px;">
                            Score This Segment
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById("segmentsList").innerHTML = html;
}

// File continues in Part 2...
// ==========================================
// 9. SEGMENT SCORING
// ==========================================
function showSegmentScoring(judgeId, participantId, competitionId, segmentId, participantName, segmentName) {
    checkIfScoreLocked(judgeId, participantId, competitionId, segmentId, (isLocked, lockInfo) => {
        if (isLocked) {
            showLockedScoreMessage(judgeId, participantId, competitionId, segmentId, `${participantName} - ${segmentName}`, lockInfo);
            return;
        }
        
        Promise.all([
            fetch(`${API_URL}/participant/${participantId}`).then(r => r.json()),
            fetch(`${API_URL}/segment-criteria/${segmentId}`).then(r => r.json())
        ])
        .then(([participant, criteria]) => {
            if (criteria.length === 0) {
                showNotification('No criteria configured for this segment', 'error');
                return;
            }
            displaySegmentScoringForm(judgeId, participantId, competitionId, segmentId, participantName, segmentName, criteria, participant);
        })
        .catch(error => {
            console.error('Error loading criteria:', error);
            showNotification('Error loading scoring criteria', 'error');
        });
    });
}

function displaySegmentScoringForm(judgeId, participantId, competitionId, segmentId, participantName, segmentName, criteria, participant) {
    let html = `
        <h2>Score Segment: ${segmentName}</h2>
        <h3 style="color: #800020;">Participant: ${participantName}</h3>
        
        <div style="margin-bottom: 20px;">
            <button onclick="showSegmentSelection(${judgeId}, ${participantId}, ${competitionId}, '${escapeString(participantName)}')" class="secondary">Back to Segment Selection</button>
        </div>
        
        ${generateParticipantPhotoHTML(participant)}
        
        <form id="segmentScoreForm" class="dashboard-card" style="max-width: 900px; margin: 0 auto; text-align: left;">
            <div class="alert alert-info">
                <strong>Scoring Instructions:</strong>
                <p>Rate each criterion from 0 to 100. Your scores will be weighted automatically based on percentages.</p>
            </div>
            
            <div id="criteriaScores">
    `;

    criteria.forEach((criterion, index) => {
        html += `
            <div class="criterion-item">
                <h4>${index + 1}. ${criterion.criteria_name} (${criterion.percentage}%)</h4>
                <p>${criterion.description || 'Score this criterion based on the performance'}</p>
                
                <div style="display: grid; grid-template-columns: 200px; gap: 20px; align-items: center;">
                    <div>
                        <label for="score_${criterion.criteria_id}">Score (0-100):</label>
                        <input type="number" 
                               id="score_${criterion.criteria_id}" 
                               data-criteria-id="${criterion.criteria_id}"
                               data-percentage="${criterion.percentage}"
                               data-max-score="100"
                               min="0" 
                               max="100" 
                               step="0.1" 
                               required
                               oninput="calculateSegmentTotalScore()"
                               style="width: 100%; padding: 12px; font-size: 18px; text-align: center; font-weight: bold; border: 2px solid #ddd; border-radius: 8px;">
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>
            
            <div id="totalScoreDisplay">
                <h3>Total Weighted Score</h3>
                <div id="totalScore">0.00</div>
                <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">out of 100 points</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #800020;">
                <strong>How Scoring Works:</strong>
                <ul style="margin-top: 10px; color: #666;">
                    <li>Each criterion is scored from 0-100 points</li>
                    <li>Scores are weighted by percentage (shown above each criterion)</li>
                    <li><strong>Formula:</strong> Final Score = Sum of (Score × Percentage / 100)</li>
                    <li>Total percentages add up to 100%</li>
                </ul>
            </div>
            
            <label for="general_comments" style="display: block; margin-top: 20px; font-weight: 600; color: #800020; font-size: 16px;">General Comments:</label>
            <textarea id="general_comments" 
                      rows="4" 
                      placeholder="Overall feedback for this performance..."
                      style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; margin-top: 5px; font-size: 14px;"></textarea>
            
            <div style="margin-top: 30px; text-align: center;">
                <button type="submit" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 18px 45px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    Submit Score
                </button>
                <button type="button" onclick="showSegmentSelection(${judgeId}, ${participantId}, ${competitionId}, '${escapeString(participantName)}')" class="secondary" style="margin-left: 15px; padding: 18px 35px; font-size: 16px;">
                    Cancel
                </button>
            </div>
        </form>
    `;

    document.getElementById("content").innerHTML = html;

    document.getElementById("segmentScoreForm").onsubmit = function(event) {
        event.preventDefault();
        submitSegmentScores(judgeId, participantId, competitionId, segmentId, criteria, participantName, segmentName);
    };
    
    setTimeout(() => {
        loadDraft(judgeId, participantId, segmentId);
        addAutoSaveListeners('segmentScoreForm', judgeId, participantId, segmentId);
    }, 500);
}

function submitSegmentScores(judgeId, participantId, competitionId, segmentId, criteria, participantName, segmentName) {
    const scores = [];
    let totalWeightedScore = 0;
    let hasError = false;

    criteria.forEach(criterion => {
        if (hasError) return;
        
        const scoreInput = document.getElementById(`score_${criterion.criteria_id}`);
        const score = parseFloat(scoreInput.value);
        const percentage = parseFloat(criterion.percentage);
        
        if (isNaN(score) || score < 0 || score > 100) {
            showNotification(`Score for ${criterion.criteria_name} must be between 0 and 100`, 'error');
            hasError = true;
            return;
        }

        const weightedScore = (score * percentage) / 100;
        totalWeightedScore += weightedScore;

        scores.push({
            criteria_id: criterion.criteria_id,
            score: score,
            weighted_score: weightedScore,
            comments: null
        });
    });

    if (hasError || scores.length !== criteria.length) {
        return;
    }

    const submissionData = {
        judge_id: judgeId,
        participant_id: participantId,
        segment_id: segmentId,
        scores: scores,
        general_comments: document.getElementById("general_comments").value || null,
        total_score: totalWeightedScore
    };

    fetch(`${API_URL}/submit-segment-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Segment "${segmentName}" scored successfully! Total: ${totalWeightedScore.toFixed(2)}/100`, 'success');
            
            if (data.should_start_countdown) {
                startLockCountdown(judgeId, participantId, competitionId, segmentId, 'segment');
            }
            
            clearDraft(judgeId, participantId, segmentId);
            
            setTimeout(() => {
                showSegmentSelection(judgeId, participantId, competitionId, participantName);
            }, 2000);
        } else {
            showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error submitting segment scores:', error);
        showNotification('Error submitting segment scores: ' + error.message, 'error');
    });
}

function calculateSegmentTotalScore() {
    const criteriaInputs = document.querySelectorAll('[data-criteria-id]');
    let totalWeightedScore = 0;

    criteriaInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const percentage = parseFloat(input.getAttribute('data-percentage')) || 0;
        const weightedScore = (score * percentage) / 100;
        totalWeightedScore += weightedScore;
    });

    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = totalWeightedScore.toFixed(2);
    }
}

// ==========================================
// 10. REGULAR COMPETITION SCORING
// ==========================================
function showRegularScoringForm(judgeId, participantId, competitionId, participantName, participant) {
    fetch(`${API_URL}/competition-criteria/${competitionId}`)
        .then(response => response.json())
        .then(criteria => {
            if (criteria.length === 0) {
                showNotification('No criteria configured for this competition', 'error');
                return;
            }

            displayRegularScoringForm(judgeId, participantId, competitionId, participantName, criteria, participant);
        })
        .catch(error => {
            console.error('Error loading criteria:', error);
            showNotification('Error loading criteria', 'error');
        });
}

function displayRegularScoringForm(judgeId, participantId, competitionId, participantName, criteria, participant) {
    let html = `
        <h2>Score Participant: ${participantName}</h2>
        <div style="margin-bottom: 20px;">
            <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Back to Participants</button>
        </div>
        
        ${generateParticipantPhotoHTML(participant)}
        
        <form id="detailedScoreForm" class="dashboard-card" style="max-width: 900px; margin: 0 auto; text-align: left;">
            <h3 style="color: #800020; margin-bottom: 20px;">Score Each Criterion</h3>
            
            <div id="criteriaScores">
    `;

    criteria.forEach((criterion, index) => {
        html += `
            <div class="criterion-item">
                <h4>${index + 1}. ${criterion.criteria_name} (${criterion.percentage}%)</h4>
                <p>${criterion.description || 'Score this criterion'}</p>
                
                <label for="score_${criterion.criteria_id}">Score (0-100):</label>
                <input type="number" 
                       id="score_${criterion.criteria_id}" 
                       data-criteria-id="${criterion.criteria_id}"
                       data-percentage="${criterion.percentage}"
                       data-max-score="100"
                       min="0" 
                       max="100" 
                       step="0.1" 
                       required
                       oninput="calculateTotalScore()"
                       style="width: 200px; padding: 12px; font-size: 18px; text-align: center; font-weight: bold; border: 2px solid #ddd; border-radius: 8px;">
            </div>
        `;
    });

    html += `
            </div>
            
            <div id="totalScoreDisplay">
                <h3>Total Weighted Score</h3>
                <div id="totalScore">0.00</div>
                <p>out of 100 points</p>
            </div>
            
            <label for="general_comments">General Comments:</label>
            <textarea id="general_comments" 
                      rows="4" 
                      placeholder="Overall feedback..."
                      style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; margin-top: 5px; font-size: 14px;"></textarea>
            
            <div style="margin-top: 30px; text-align: center;">
                <button type="submit" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 18px 45px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    Submit Score
                </button>
                <button type="button" onclick="viewCompetitionParticipants(${competitionId})" class="secondary" style="margin-left: 15px; padding: 18px 35px; font-size: 16px;">
                    Cancel
                </button>
            </div>
        </form>
    `;

    document.getElementById("content").innerHTML = html;

    document.getElementById("detailedScoreForm").onsubmit = function(event) {
        event.preventDefault();
        submitRegularScores(judgeId, participantId, competitionId, criteria);
    };

    setTimeout(() => {
        loadRegularDraft(judgeId, participantId, competitionId);
        addAutoSaveListeners('detailedScoreForm', judgeId, participantId, competitionId);
    }, 500);
}

function submitRegularScores(judgeId, participantId, competitionId, criteria) {
    const scores = [];
    let hasError = false;

    criteria.forEach(criterion => {
        if (hasError) return;
        
        const score = parseFloat(document.getElementById(`score_${criterion.criteria_id}`).value);
        const percentage = parseFloat(criterion.percentage);
        
        if (isNaN(score) || score < 0 || score > 100) {
            showNotification(`Score for ${criterion.criteria_name} must be between 0 and 100`, 'error');
            hasError = true;
            return;
        }

        scores.push({
            criteria_id: criterion.criteria_id,
            score: score,
            percentage: percentage,
            comments: null
        });
    });

    if (hasError || scores.length !== criteria.length) {
        return;
    }

    const submissionData = {
        judge_id: judgeId,
        participant_id: participantId,
        competition_id: competitionId,
        scores: scores,
        general_comments: document.getElementById("general_comments").value
    };

    fetch(`${API_URL}/submit-detailed-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Scores submitted successfully!', 'success');
            
            if (data.should_start_countdown) {
                startLockCountdown(judgeId, participantId, competitionId, null, 'overall');
            }
            
            clearRegularDraft(judgeId, participantId, competitionId);
            
            setTimeout(() => {
                viewCompetitionParticipants(competitionId);
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error submitting scores', 'error');
    });
}

function calculateTotalScore() {
    const criteriaInputs = document.querySelectorAll('[data-criteria-id]');
    let totalWeightedScore = 0;

    criteriaInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const percentage = parseFloat(input.getAttribute('data-percentage')) || 0;
        const weightedScore = (score * percentage) / 100;
        totalWeightedScore += weightedScore;
    });

    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = totalWeightedScore.toFixed(2);
    }
}

// Helper function to generate participant photo HTML
function generateParticipantPhotoHTML(participant) {
    if (!participant.photo_url) {
        return `
            <div style="text-align: center; margin: 20px 0; padding: 30px; background: #fff3cd; border-radius: 12px; border: 2px solid #800020;">
                <p style="font-size: 18px; color: #856404;">
                    ${participant.contestant_number ? `Contestant #${participant.contestant_number} - ` : ''}${participant.participant_name}
                </p>
                <small style="color: #666;">No photo available</small>
            </div>
        `;
    }

    return `
        <div class="participant-photo-container">
            <div class="participant-photo">
                ${participant.contestant_number ? `
                    <div class="contestant-number-badge">
                        #${participant.contestant_number}
                    </div>
                ` : ''}
                <img src="${participant.photo_url}" 
                     alt="${participant.participant_name}" 
                     class="participant-photo img"
                     onerror="this.src='https://via.placeholder.com/350x450/800020/ffffff?text=Photo+Not+Available'; this.style.opacity='0.6';">
            </div>
            <div class="participant-info-card">
                <p style="font-weight: 600; color: #800020; font-size: 20px; margin: 0;">
                    ${participant.contestant_number ? `Contestant #${participant.contestant_number}` : 'Contestant'} 
                </p>
                <p style="font-size: 18px; color: #666; margin: 5px 0 0 0;">${participant.participant_name}</p>
            </div>
        </div>
    `;
}

// File continues in Part 3...
// ==========================================
// 11. DRAFT SYSTEM
// ==========================================
function autoSaveDraft(judgeId, participantId, segmentId) {
    clearTimeout(draftSaveTimeout);
    showDraftStatus('Saving draft...', 'saving');
    
    draftSaveTimeout = setTimeout(() => {
        saveDraftToServer(judgeId, participantId, segmentId);
    }, 2000);
}

function saveDraftToServer(judgeId, participantId, segmentId) {
    const criteriaInputs = document.querySelectorAll('[data-criteria-id]');
    const draftScores = [];
    
    criteriaInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const criteriaId = input.getAttribute('data-criteria-id');
        const percentage = parseFloat(input.getAttribute('data-percentage')) || 0;
        
        draftScores.push({
            criteria_id: criteriaId,
            score: score,
            weighted_score: (score * percentage) / 100
        });
    });
    
    const generalComments = document.getElementById('general_comments')?.value || '';
    const totalScore = calculateCurrentTotal();
    
    const draftData = {
        scores: draftScores,
        general_comments: generalComments,
        total_score: totalScore,
        saved_at: new Date().toISOString()
    };
    
    const draftKey = `draft_${judgeId}_${participantId}_${segmentId || 'regular'}`;
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    
    showDraftStatus('Draft saved', 'success');
    setTimeout(() => hideDraftStatus(), 3000);
}

function loadDraft(judgeId, participantId, segmentId) {
    const draftKey = `draft_${judgeId}_${participantId}_${segmentId || 'regular'}`;
    const localDraft = localStorage.getItem(draftKey);
    
    if (localDraft) {
        const draft = JSON.parse(localDraft);
        
        if (draft && draft.scores) {
            draft.scores.forEach(score => {
                const input = document.getElementById(`score_${score.criteria_id}`);
                if (input) {
                    input.value = score.score;
                }
            });
            
            const generalComments = document.getElementById('general_comments');
            if (generalComments && draft.general_comments) {
                generalComments.value = draft.general_comments;
            }
            
            if (segmentId) {
                calculateSegmentTotalScore();
            } else {
                calculateTotalScore();
            }
            
            showNotification('Draft loaded', 'info');
        }
    }
}

function loadRegularDraft(judgeId, participantId, competitionId) {
    loadDraft(judgeId, participantId, 'regular');
}

function clearDraft(judgeId, participantId, segmentId) {
    const draftKey = `draft_${judgeId}_${participantId}_${segmentId || 'regular'}`;
    localStorage.removeItem(draftKey);
}

function clearRegularDraft(judgeId, participantId, competitionId) {
    clearDraft(judgeId, participantId, 'regular');
}

function calculateCurrentTotal() {
    const criteriaInputs = document.querySelectorAll('[data-criteria-id]');
    let total = 0;
    
    criteriaInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const percentage = parseFloat(input.getAttribute('data-percentage')) || 0;
        total += (score * percentage) / 100;
    });
    
    return total;
}

function addAutoSaveListeners(formId, judgeId, participantId, segmentIdOrComp) {
    const allInputs = document.querySelectorAll(`#${formId} input, #${formId} textarea`);
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            autoSaveDraft(judgeId, participantId, segmentIdOrComp);
        });
    });
}

function showDraftStatus(message, type) {
    let indicator = document.getElementById('draft-status-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'draft-status-indicator';
        document.body.appendChild(indicator);
    }
    
    const colors = {
        saving: '#ffc107',
        success: '#28a745',
        warning: '#ff9800',
        error: '#dc3545'
    };
    
    indicator.textContent = message;
    indicator.style.background = colors[type] || colors.saving;
    indicator.style.color = 'white';
    indicator.style.display = 'block';
}

function hideDraftStatus() {
    const indicator = document.getElementById('draft-status-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// ==========================================
// 12. LOCK COUNTDOWN SYSTEM
// ==========================================
function startLockCountdown(judgeId, participantId, competitionId, segmentId, scoreType) {
    if (lockTimer) {
        clearInterval(lockTimer);
    }
    
    lockCountdown = 10;
    currentScoreData = { judgeId, participantId, competitionId, segmentId, scoreType };
    
    showLockCountdown();
    
    lockTimer = setInterval(() => {
        lockCountdown--;
        updateLockCountdown();
        
        if (lockCountdown <= 0) {
            clearInterval(lockTimer);
            autoLockScore();
        }
    }, 1000);
}

function showLockCountdown() {
    let countdownDiv = document.getElementById('lock-countdown');
    
    if (!countdownDiv) {
        countdownDiv = document.createElement('div');
        countdownDiv.id = 'lock-countdown';
        document.body.appendChild(countdownDiv);
    }
    
    countdownDiv.innerHTML = `
        <div style="font-size: 14px; margin-bottom: 5px;">Edit Window</div>
        <div style="font-size: 28px;" id="countdown-number">${lockCountdown}</div>
        <div style="font-size: 12px; margin-top: 5px;">seconds remaining</div>
    `;
    countdownDiv.style.display = 'block';
}

function updateLockCountdown() {
    const countdownNumber = document.getElementById('countdown-number');
    const countdownDiv = document.getElementById('lock-countdown');
    
    if (countdownNumber && countdownDiv) {
        countdownNumber.textContent = lockCountdown;
        
        if (lockCountdown <= 3) {
            countdownDiv.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            countdownNumber.style.animation = 'pulse 0.5s ease-in-out';
        }
    }
}

function autoLockScore() {
    if (!currentScoreData) {
        return;
    }
    
    const countdownDiv = document.getElementById('lock-countdown');
    if (countdownDiv) {
        countdownDiv.innerHTML = `<div style="font-size: 14px;">Locking Score...</div>`;
    }
    
    fetch(`${API_URL}/auto-lock-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            judge_id: currentScoreData.judgeId,
            participant_id: currentScoreData.participantId,
            competition_id: currentScoreData.competitionId,
            segment_id: currentScoreData.segmentId || null,
            score_type: currentScoreData.scoreType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (countdownDiv) {
                countdownDiv.innerHTML = `
                    <div style="font-size: 14px;">Score Locked</div>
                    <div style="font-size: 12px; margin-top: 5px;">Contact admin to edit</div>
                `;
                
                setTimeout(() => {
                    countdownDiv.style.display = 'none';
                }, 3000);
            }
            
            showNotification('Score locked successfully', 'info');
        }
    })
    .catch(error => {
        console.error('Auto-lock error:', error);
        if (countdownDiv) {
            countdownDiv.innerHTML = `
                <div style="font-size: 14px;">Lock Failed</div>
                <div style="font-size: 12px; margin-top: 5px;">Please refresh page</div>
            `;
        }
    });
    
    currentScoreData = null;
}

// ==========================================
// 13. UNLOCK REQUEST SYSTEM
// ==========================================
function requestUnlock(judgeId, participantId, competitionId, segmentId, participantName, scoreType) {
    const reason = prompt(`Request unlock for ${participantName}?\n\nPlease explain why you need to edit this score:`);
    
    if (!reason || reason.trim() === '') {
        showNotification('Unlock request cancelled - reason required', 'warning');
        return;
    }
    
    fetch(`${API_URL}/request-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            judge_id: judgeId,
            participant_id: participantId,
            competition_id: competitionId,
            segment_id: segmentId,
            score_type: scoreType || 'overall',
            reason: reason.trim()
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Request unlock error:', error);
        showNotification('Error submitting unlock request', 'error');
    });
}

function viewMyUnlockRequests() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch(`${API_URL}/judges`)
        .then(response => response.json())
        .then(judges => {
            const currentJudge = judges.find(j => j.user_id === user.user_id);
            if (!currentJudge) {
                showNotification('Judge profile not found', 'error');
                return;
            }

            fetch(`${API_URL}/unlock-requests/judge/${currentJudge.judge_id}`)
                .then(response => response.json())
                .then(requests => {
                    displayUnlockRequests(requests);
                })
                .catch(error => {
                    console.error('Error loading unlock requests:', error);
                    showNotification('Error loading unlock requests', 'error');
                });
        });
}

function displayUnlockRequests(requests) {
    let html = `
        <h2>My Unlock Requests</h2>
        
        <div style="margin-bottom: 20px;">
            <button onclick="showMyCompetitions()" class="secondary">Back to Competitions</button>
        </div>
    `;
    
    if (requests.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>No Unlock Requests</h3>
                <p>You haven't submitted any unlock requests yet.</p>
            </div>
        `;
    } else {
        html += '<div style="display: grid; gap: 15px;">';
        
        requests.forEach(request => {
            const statusColor = request.status === 'approved' ? '#28a745' : 
                              request.status === 'rejected' ? '#dc3545' : '#ffc107';
            const statusIcon = request.status === 'approved' ? '✓' : 
                             request.status === 'rejected' ? '✗' : '⧗';
            
            html += `
                <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4>${request.participant_name}</h4>
                        <span style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                            ${statusIcon} ${request.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <p><strong>Competition:</strong> ${request.competition_name}</p>
                    ${request.segment_name ? `<p><strong>Segment:</strong> ${request.segment_name}</p>` : ''}
                    <p><strong>Requested:</strong> ${new Date(request.requested_at).toLocaleString()}</p>
                    
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <strong>Reason:</strong><br>
                        ${request.reason}
                    </div>
                    
                    ${request.status !== 'pending' ? `
                        <div style="background: ${request.status === 'approved' ? '#d4edda' : '#f8d7da'}; padding: 10px; border-radius: 5px; margin-top: 10px;">
                            <strong>Admin Response:</strong><br>
                            ${request.admin_notes || 'No additional notes'}
                            <br><small>Reviewed: ${new Date(request.reviewed_at).toLocaleString()}</small>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    document.getElementById("content").innerHTML = html;
}

// ==========================================
// 14. SCORING HISTORY
// ==========================================
function showScoringHistory() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch(`${API_URL}/judges`)
        .then(response => response.json())
        .then(judges => {
            const currentJudge = judges.find(j => j.user_id === user.user_id);
            if (!currentJudge) {
                document.getElementById("content").innerHTML = `
                    <h2>Scoring History</h2>
                    <p class="alert alert-error">Judge profile not found.</p>
                `;
                return;
            }

            fetch(`${API_URL}/judge-competitions/${currentJudge.judge_id}`)
                .then(response => response.json())
                .then(competitions => {
                    displayScoringHistory(competitions, currentJudge.judge_id);
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Error loading history', 'error');
                });
        });
}

function displayScoringHistory(competitions, judgeId) {
    let html = `
        <h2>My Scoring History</h2>
        <div style="margin-bottom: 20px;">
            <p>Review all your submitted scores and feedback.</p>
        </div>
    `;

    if (competitions.length === 0) {
        html += '<p class="alert alert-warning">No competitions assigned yet.</p>';
        document.getElementById("content").innerHTML = html;
        return;
    }

    Promise.all(
        competitions.map(comp => 
            fetch(`${API_URL}/overall-scores/${comp.competition_id}`)
                .then(r => r.json())
                .then(overallScores => ({
                    competition: comp,
                    overallScores: overallScores.filter(s => s.judge_id === judgeId)
                }))
        )
    )
    .then(competitionScores => {
        competitionScores.forEach(({ competition, overallScores }) => {
            html += `
                <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                    <h3>${competition.competition_name}</h3>
                    <p><strong>Event Type:</strong> ${competition.type_name} | <strong>Date:</strong> ${competition.competition_date}</p>
                    
                    ${overallScores.length === 0 ? 
                        '<p style="color: #666;">No scores submitted yet for this competition.</p>' :
                        `<div style="margin-top: 15px;">
                            <h4>Scored Participants (${overallScores.length}):</h4>
                            ${overallScores.map(score => `
                                <div style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                    <strong>${score.participant_name}</strong> - Score: <span class="score-display">${score.total_score}</span>
                                    ${score.general_comments ? `<br><small>Comments: ${score.general_comments}</small>` : ''}
                                </div>
                            `).join('')}
                        </div>`
                    }
                </div>
            `;
        });

        document.getElementById("content").innerHTML = html;
    })
    .catch(error => {
        console.error('Error fetching scoring history:', error);
        showNotification('Error loading scoring history', 'error');
    });
}

// ==========================================
// 15. PROFILE
// ==========================================
function showProfile() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch(`${API_URL}/judges`)
        .then(response => response.json())
        .then(judges => {
            const currentJudge = judges.find(j => j.user_id === user.user_id);
            if (!currentJudge) {
                document.getElementById("content").innerHTML = `
                    <h2>My Profile</h2>
                    <p class="alert alert-error">Judge profile not found.</p>
                `;
                return;
            }

            document.getElementById("content").innerHTML = `
                <h2>My Profile</h2>
                <div class="dashboard-card" style="text-align: left; max-width: 600px; margin: 0 auto;">
                    <h3>${currentJudge.judge_name}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                        <div>
                            <p><strong>Email:</strong> ${currentJudge.email}</p>
                            <p><strong>Phone:</strong> ${currentJudge.phone || 'Not provided'}</p>
                            <p><strong>Username:</strong> ${currentJudge.username || user.username}</p>
                        </div>
                        <div>
                            <p><strong>Area of Expertise:</strong> ${currentJudge.expertise}</p>
                            <p><strong>Years of Experience:</strong> ${currentJudge.experience_years}</p>
                            <p><strong>Assigned Competition:</strong> ${currentJudge.competition_name || 'Not assigned'}</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <strong>Credentials & Qualifications:</strong>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            ${currentJudge.credentials || 'No credentials provided'}
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <p style="color: #666; font-size: 14px;">
                            If you need to update your profile information, please contact the administrator.
                        </p>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error fetching judge profile:', error);
            showNotification('Error loading profile information', 'error');
        });
}

// ==========================================
// 16. NOTIFICATION SYSTEM
// ==========================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ==========================================
// INITIALIZATION
// ==========================================
console.log('Judge Dashboard - Refactored Clean Code Loaded Successfully');