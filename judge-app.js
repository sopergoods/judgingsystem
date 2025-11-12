// JUDGE DASHBOARD - CLEAN DEBUGGED VERSION
// Maroon & White Theme | All Multi-Day Bugs Fixed

const API_URL = 'https://mseufci-judgingsystem.up.railway.app';

let lockTimer = null;
let lockCountdown = 1;
let currentScoreData = null;
let draftSaveTimeout = null;

// AUTHENTICATION & INITIALIZATION
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

// DASHBOARD
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

// MY COMPETITIONS
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
            const progressPercent = competition.total_required > 0 
                ? Math.round((competition.scored_count / competition.total_required) * 100)
                : 0;
            
            html += `
                <div class="dashboard-card" style="text-align: left;">
                    <h3>${competition.competition_name}</h3>
                    <p><strong>Event Type:</strong> ${competition.type_name}</p>
                    <p><strong>Date:</strong> ${competition.competition_date}</p>
                    <p><strong>Progress:</strong> ${competition.scored_count} / ${competition.total_required} completed (${progressPercent}%)</p>
                    
                    <div style="background: #f0f0f0; border-radius: 10px; height: 20px; margin: 10px 0; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); height: 100%; width: ${progressPercent}%; transition: width 0.3s ease;"></div>
                    </div>
                    
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

// VIEW PARTICIPANTS
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
                <thead>
                    <tr>
                        <th>Contestant Number</th>
                        <th>Participant Name</th>
                        <th>Age</th>
                        <th>Performance Title</th>
                        <th>School/Organization</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        participants.forEach(participant => {
            html += `
                <tr>
                    <td style="text-align: center; font-weight: bold;">${participant.contestant_number || 'N/A'}</td>
                    <td>${participant.participant_name}</td>
                    <td style="text-align: center;">${participant.age}</td>
                    <td>${participant.performance_title || 'N/A'}</td>
                    <td>${participant.school_organization || 'Not specified'}</td>
                    <td style="text-align: center;">
                        <button onclick="scoreParticipant(${participant.participant_id}, ${competitionId}, '${escapeString(participant.participant_name)}')">
                            Score Performance
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
    }

    document.getElementById("content").innerHTML = html;
}

function startScoring(competitionId) {
    viewCompetitionParticipants(competitionId);
}

function escapeString(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// MAIN SCORING FUNCTION
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

// CHECK IF SCORE IS LOCKED
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

// SHOW LOCKED SCORE MESSAGE
function showLockedScoreMessage(judgeId, participantId, competitionId, segmentId, participantName, lockInfo) {
    const minutesLocked = Math.floor(lockInfo.seconds_since_lock / 60);
    
    document.getElementById("content").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 60px; color: #800020; margin-bottom: 20px;">LOCKED</div>
            <h2>Score Already Submitted</h2>
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

// PAGEANT SEGMENT SELECTION
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
        
        html += '</div></div>';
    });
    
    html += '</div>';
    document.getElementById("segmentsList").innerHTML = html;
}

// SEGMENT SCORING
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
                ${criterion.description ? `<p>${criterion.description}</p>` : ''}
                
                <div style="display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: center;">
                    <div>
                        <label for="score_${criterion.criteria_id}">Score (0-100):</label>
                        <input type="number" 
                               id="score_${criterion.criteria_id}" 
                               data-criteria-id="${criterion.criteria_id}"
                               data-percentage="${criterion.percentage}"
                               min="0" 
                               max="100" 
                               step="0.1" 
                               required
                               oninput="calculateSegmentTotalScore()"
                               class="score-input">
                    </div>
                    <div id="weighted_${criterion.criteria_id}" style="color: #800020; font-weight: 600;">
                        Weighted: 0.00 points
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
                <button type="submit" style="background: #800020; color: white; border: none; padding: 18px 45px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 18px;">
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
        
        const weightedDisplay = document.getElementById(`weighted_${input.getAttribute('data-criteria-id')}`);
        if (weightedDisplay) {
            weightedDisplay.textContent = `Weighted: ${weightedScore.toFixed(2)} points`;
        }
    });

    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = totalWeightedScore.toFixed(2);
    }
}

// REGULAR COMPETITION SCORING
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
                ${criterion.description ? `<p>${criterion.description}</p>` : ''}
                
                <div style="display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: center;">
                    <div>
                        <label for="score_${criterion.criteria_id}">Score (0-100):</label>
                        <input type="number" 
                               id="score_${criterion.criteria_id}" 
                               data-criteria-id="${criterion.criteria_id}"
                               data-percentage="${criterion.percentage}"
                               min="0" 
                               max="100" 
                               step="0.1" 
                               required
                               oninput="calculateTotalScore()"
                               class="score-input">
                    </div>
                    <div id="weighted_${criterion.criteria_id}" style="color: #800020; font-weight: 600;">
                        Weighted: 0.00 points
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
                <p>out of 100 points</p>
            </div>
            
            <label for="general_comments">General Comments:</label>
            <textarea id="general_comments" 
                      rows="4" 
                      placeholder="Overall feedback..."
                      style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; margin-top: 5px; font-size: 14px;"></textarea>
            
            <div style="margin-top: 30px; text-align: center;">
                <button type="submit" style="background: #800020; color: white; border: none; padding: 18px 45px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 18px;">
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
  body: JSON.stringify(payload)
})
  .then(r => r.json())
  .then(data => {
    if (!data.success) throw new Error(data.error || 'Save failed');
    showNotification('Scores updated successfully!', 'success');

    // Immediately refresh "My Scoring History"
    if (Array.isArray(window._judgeCompetitions) && typeof loadDetailedScoringHistory === 'function') {
      loadDetailedScoringHistory(window._judgeCompetitions, window._currentJudgeId);
    }

    // (Optional) refresh "My Rankings" if your UI shows it
    if (typeof loadMyRankings === 'function') loadMyRankings();
  })
  .catch(err => {
    console.error(err);
    showNotification('Error saving scores', 'error');
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
        
        const weightedDisplay = document.getElementById(`weighted_${input.getAttribute('data-criteria-id')}`);
        if (weightedDisplay) {
            weightedDisplay.textContent = `Weighted: ${weightedScore.toFixed(2)} points`;
        }
    });

    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = totalWeightedScore.toFixed(2);
    }
}

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
                     class="participant-photo-img"
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

// DRAFT SYSTEM
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
        try {
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
        } catch (error) {
            console.error('Error loading draft:', error);
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
    
    indicator.textContent = message;
    indicator.style.display = 'block';
}

function hideDraftStatus() {
    const indicator = document.getElementById('draft-status-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// LOCK COUNTDOWN SYSTEM
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

// UNLOCK REQUEST SYSTEM
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
            
            html += `
                <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4>${request.participant_name}</h4>
                        <span style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                            ${request.status.toUpperCase()}
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
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
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

// SCORING HISTORY - COMPLETELY FIXED FOR MULTI-DAY
function showScoringHistory() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    document.getElementById("content").innerHTML = `
        <h2>My Scoring History</h2>
        <div class="loading">Loading your scoring history...</div>
    `;

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
                    loadDetailedScoringHistory(competitions, currentJudge.judge_id);
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Error loading history', 'error');
                });
        });
}
// === REPLACE the whole function with this ===
function loadDetailedScoringHistory(competitions, judgeId) {

      window._judgeCompetitions = competitions;
    window._currentJudgeId = judgeId
    if (competitions.length === 0) {
        document.getElementById("content").innerHTML = `
            <h2>My Scoring History</h2>
            <p class="alert alert-warning">No competitions assigned yet.</p>
        `;
        return;
    }

    Promise.all(
        competitions.map(comp => {
            // Branch per competition type
            if (comp.is_pageant) {
                // ---- PAGEANT (multi-day) ----
                return Promise.all([
                    fetch(`${API_URL}/competition-segment-scores/${comp.competition_id}`).then(r => r.json()),
                    fetch(`${API_URL}/pageant-segments/${comp.competition_id}`).then(r => r.json()).catch(() => []),
                    fetch(`${API_URL}/participants/${comp.competition_id}`).then(r => r.json())
                ]).then(([rows, segments, participants]) => {
                    // Only this judge's rows
                    const mine = rows.filter(r => r.judge_id === judgeId);

                    // participant meta
                    const pmap = {};
                    participants.forEach(p => {
                        pmap[p.participant_id] = {
                            participant_name: p.participant_name,
                            performance_title: p.performance_title
                        };
                    });

                    // Aggregate per (participant, segment)
                    const byPS = {};
                    mine.forEach(r => {
                        const key = `${r.participant_id}-${r.segment_id}`;
                        if (!byPS[key]) {
                            byPS[key] = {
                                participant_id: r.participant_id,
                                segment_id: r.segment_id,
                                total_score: 0,
                                submitted_at: r.updated_at || r.created_at,
                                participant_name: pmap[r.participant_id]?.participant_name || r.participant_name || '',
                                performance_title: pmap[r.participant_id]?.performance_title || ''
                            };
                        }
                        byPS[key].total_score += parseFloat(r.weighted_score || 0);
                    });

                    const overallScores = Object.values(byPS);
                    return { competition: comp, overallScores, segments, participants };
                });
            } else {
                // ---- REGULAR (single-day) ----
                return Promise.all([
                    fetch(`${API_URL}/overall-scores/${comp.competition_id}`).then(r => r.json()),
                    fetch(`${API_URL}/participants/${comp.competition_id}`).then(r => r.json())
                ]).then(([rows, participants]) => {
                    // Keep only this judge's rows
                    const mine = rows.filter(r => r.judge_id === judgeId);

                    // participant meta
                    const pmap = {};
                    participants.forEach(p => {
                        pmap[p.participant_id] = {
                            participant_name: p.participant_name,
                            performance_title: p.performance_title
                        };
                    });

                    // Shape to what displayEnhancedScoringHistory expects
                    const overallScores = mine.map(r => ({
                        participant_id: r.participant_id,
                        // no segment_id needed for regular
                        total_score: parseFloat(r.total_score || 0),
                        submitted_at: r.updated_at || r.created_at,
                        participant_name: pmap[r.participant_id]?.participant_name || r.participant_name || '',
                        performance_title: pmap[r.participant_id]?.performance_title || ''
                    }));

                    return { competition: comp, overallScores, segments: [], participants };
                });
            }
        })
    )
    .then(competitionData => {
        // Your existing renderer (already updated to do weighted totals for pageants)
        displayEnhancedScoringHistory(competitionData, judgeId);
    })
    .catch(error => {
        console.error('Error fetching scoring history:', error);
        showNotification('Error loading scoring history', 'error');
    });
}



// === REPLACE the whole function with this ===
function displayEnhancedScoringHistory(competitionData, judgeId) {
    let html = `
        <h2>My Scoring History</h2>
        <div style="margin-bottom: 20px;">
            <p>Review all your submitted scores, segments, and rankings.</p>
        </div>
    `;

    competitionData.forEach(({ competition, overallScores, segments, participants }) => {
        const isPageant = competition.is_pageant;

        let participantScores = {};
        let uniqueScoredParticipants = new Set();

        if (isPageant) {
            // Build weight map (segment_id -> weight in [0..1])
            const weightBySegment = {};
            segments.forEach(s => {
                weightBySegment[s.segment_id] = (parseFloat(s.segment_weight || 0) || 0) / 100.0;
            });

            // Aggregate THIS judge's totals by (participant, segment),
            // and compute the *weighted* contribution per segment.
            overallScores.forEach(score => {
                uniqueScoredParticipants.add(score.participant_id);

                if (!participantScores[score.participant_id]) {
                    participantScores[score.participant_id] = {
                        participant_name: score.participant_name,
                        performance_title: score.performance_title,
                        weighted_total: 0,
                        segments_completed: 0
                    };
                }

                const raw = parseFloat(score.total_score) || 0;
                const w = weightBySegment[score.segment_id] || 0;
                participantScores[score.participant_id].weighted_total += raw * w;
                participantScores[score.participant_id].segments_completed++;
            });

            // Use the weighted grand total as the "average_score" field your table expects
            Object.values(participantScores).forEach(p => {
                p.average_score = p.weighted_total;  // 0–100 scale
            });
        } else {
            // Regular (single-day) logic stays the same
            overallScores.forEach(score => {
                uniqueScoredParticipants.add(score.participant_id);
                if (!participantScores[score.participant_id]) {
                    participantScores[score.participant_id] = {
                        participant_name: score.participant_name,
                        performance_title: score.performance_title,
                        average_score: parseFloat(score.total_score)
                    };
                }
            });
        }

        // Rank by average_score (which is weighted_total for pageants)
        const rankedParticipants = Object.entries(participantScores)
            .map(([id, data]) => ({
                participant_id: id,
                ...data
            }))
            .sort((a, b) => b.average_score - a.average_score);

        rankedParticipants.forEach((participant, index) => {
            participant.rank = index + 1;
        });

        const totalParticipantsInCompetition = participants.length;
        const participantsScoredCount = uniqueScoredParticipants.size;

        html += `
            <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0;">${competition.competition_name}</h3>
                        <p style="margin: 5px 0 0 0; color: #666;">
                            <strong>Event Type:</strong> ${competition.type_name} | 
                            <strong>Date:</strong> ${competition.competition_date}
                            ${isPageant ? ' | <strong>Type:</strong> Multi-Segment Pageant' : ''}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; color: #666;">Scored</div>
                        <div style="font-size: 24px; font-weight: bold; color: #800020;">
                            ${participantsScoredCount}/${totalParticipantsInCompetition}
                        </div>
                        <div style="font-size: 12px; color: #666;">participants</div>
                    </div>
                </div>
        `;

        if (rankedParticipants.length === 0) {
            html += '<p style="color: #666;">No scores submitted yet for this competition.</p>';
        } else {
            if (isPageant && segments.length > 0) {
                // (Optional) segment tiles remain unchanged; they still reflect your per-segment totals.
                html += `
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #800020;">
                        <h4 style="margin: 0 0 10px 0; color: #800020;">Pageant Segments</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                `;

                segments.forEach(segment => {
                    const segmentScores = overallScores.filter(s => s.segment_id === segment.segment_id);
                    const youScored = segmentScores.length > 0;
                    html += `
                        <div style="background: white; border: 1px solid #eee; border-left: 3px solid #800020; border-radius: 8px; padding: 12px;">
                            <div style="font-weight: 600; color: #800020;">${segment.segment_name}</div>
                            <div style="font-size: 12px; color: #666;">Weight: ${parseFloat(segment.segment_weight || 0)}%</div>
                            ${youScored ? '<div style="font-size: 12px; color: #28a745; margin-top: 4px;">Submitted</div>'
                                        : '<div style="font-size: 12px; color: #dc3545; margin-top: 4px;">Not yet scored</div>'}
                        </div>
                    `;
                });

                html += '</div></div>';
            }

            html += `
                <table style="width: 100%; margin-top: 15px;">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Participant</th>
                            ${isPageant ? '<th>Segments</th>' : ''}
                            <th>${isPageant ? 'Weighted Total' : 'Score'}</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            rankedParticipants.forEach(participant => {
                const rankColor = participant.rank === 1 ? '#ffd700'
                                  : participant.rank === 2 ? '#c0c0c0'
                                  : participant.rank === 3 ? '#cd7f32'
                                  : '#666';

                html += `
                    <tr>
                        <td style="text-align: center; font-weight: bold; font-size: 18px; color: ${rankColor};">
                            ${participant.rank}
                        </td>
                        <td><strong>${participant.participant_name}</strong></td>
                        ${isPageant ? `<td style="text-align: center;">${participant.segments_completed}/${segments.length}</td>` : ''}
                        <td style="text-align: center;">
                            <span class="score-display" style="font-size: 18px;">${(participant.average_score || 0).toFixed(2)}</span>
                        </td>
                        <td style="text-align: center;">
                            <button onclick="showParticipantScoreDetails(${participant.participant_id}, ${competition.competition_id}, ${judgeId}, ${isPageant})" 
                                    style="padding: 5px 15px; font-size: 13px;">
                                View Details
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table>';

            // Footer stats use the same computed "average_score" (weighted for pageants)
            const totalScored = rankedParticipants.length;
            if (totalScored > 0) {
                const avgOfAverages = rankedParticipants.reduce((sum, p) => sum + (p.average_score || 0), 0) / totalScored;
                const highestScore = rankedParticipants[0].average_score || 0;
                const lowestScore = rankedParticipants[rankedParticipants.length - 1].average_score || 0;

                html += `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <div>
                            <div style="font-size: 12px; color: #666; font-weight: 600;">PARTICIPANTS SCORED</div>
                            <div style="font-size: 24px; font-weight: bold; color: #800020;">${totalScored}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #666; font-weight: 600;">YOUR AVERAGE</div>
                            <div style="font-size: 24px; font-weight: bold; color: #800020;">${avgOfAverages.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #666; font-weight: 600;">HIGHEST SCORE</div>
                            <div style="font-size: 24px; font-weight: bold; color: #800020;">${highestScore.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #666; font-weight: 600;">LOWEST SCORE</div>
                            <div style="font-size: 24px; font-weight: bold; color: #666;">${lowestScore.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }
        }

        html += '</div>';
    });

    document.getElementById("content").innerHTML = html;
}


// --- REPLACE showParticipantScoreDetails() in judge-app.js with this ---
function showParticipantScoreDetails(participantId, competitionId, judgeId, isPageant) {
    document.getElementById("content").innerHTML = `
        <h2>Score Details</h2>
        <div class="loading">Loading detailed scores...</div>
    `;

    Promise.all([
        fetch(`${API_URL}/participant/${participantId}`).then(r => r.json()),
        fetch(`${API_URL}/competition/${competitionId}`).then(r => r.json()),
        // 🔁 pageant uses granular rows; regular keeps overall-scores
        (isPageant
            ? fetch(`${API_URL}/competition-segment-scores/${competitionId}`).then(r => r.json())
            : fetch(`${API_URL}/overall-scores/${competitionId}`).then(r => r.json())),
        fetch(`${API_URL}/detailed-scores/${competitionId}`).then(r => r.json()).catch(() => []),
        isPageant ? fetch(`${API_URL}/pageant-segments/${competitionId}`).then(r => r.json()) : Promise.resolve([])
    ])
    .then(([participant, competition, scoresOrRows, detailedScores, segments]) => {
        let myScores;

        if (isPageant) {
            // Build one total per segment for THIS judge & participant
            const mine = scoresOrRows.filter(r => r.judge_id === judgeId && r.participant_id == participantId);
            const bySeg = {};
            mine.forEach(r => {
                if (!bySeg[r.segment_id]) {
                    bySeg[r.segment_id] = {
                        segment_id: r.segment_id,
                        total_score: 0,
                        submitted_at: r.updated_at || r.created_at,
                        general_comments: r.general_comments // keep if you show it
                    };
                }
                bySeg[r.segment_id].total_score += parseFloat(r.weighted_score || 0);
            });
            myScores = Object.values(bySeg);
        } else {
            // Regular competitions already return one row per judge/participant
            myScores = scoresOrRows.filter(s => s.judge_id === judgeId && s.participant_id == participantId);
        }

        const myDetailedScores = detailedScores.filter(s => s.judge_id === judgeId && s.participant_id == participantId);

        // ---- keep your existing HTML rendering below ----
        let html = `
            <h2>Score Details - ${participant.participant_name}</h2>
            <div style="margin-bottom: 20px;">
                <button onclick="showScoringHistory()" class="secondary">Back to History</button>
            </div>

            ${generateParticipantPhotoHTML(participant)}

            <div class="dashboard-card" style="max-width: 900px; margin: 20px auto;">
                <h3 style="color: #800020;">Competition: ${competition.competition_name}</h3>
        `;

        if (myScores.length === 0) {
            html += '<p>No scores found for this participant.</p>';
        } else {
            myScores.forEach(score => {
                const segment = segments.find(s => s.segment_id === score.segment_id);
                
                html += `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #800020;">
                        ${segment ? `<h4 style="color: #800020; margin-bottom: 10px;">Segment: ${segment.segment_name} (Day ${segment.day_number})</h4>` 
                                  : `<h4 style="color: #800020; margin-bottom: 10px;">Overall Score</h4>`}
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
                            <div>
                                <div style="font-size: 14px; color: #666;">Your Score</div>
                                <div style="font-size: 32px; font-weight: bold; color: #800020;">${parseFloat(score.total_score).toFixed(2)}</div>
                            </div>
                            <div>
                                <div style="font-size: 14px; color: #666;">Submitted</div>
                                <div style="font-size: 16px; font-weight: 500;">${new Date(score.submitted_at || score.updated_at).toLocaleString()}</div>
                            </div>
                        </div>

                        ${score.general_comments ? `
                            <div style="margin-top: 15px;">
                                <strong>Your Comments:</strong>
                                <div style="background: white; padding: 12px; border-radius: 5px; margin-top: 5px;">
                                    ${score.general_comments}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }

        html += '</div>';
        document.getElementById("content").innerHTML = html;
        // ---- end of your existing renderer ----
    })
    .catch(error => {
        console.error('Error loading score details:', error);
        showNotification('Error loading score details', 'error');
        showScoringHistory();
    });
}



// PROFILE
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

// NOTIFICATION SYSTEM
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

console.log('Judge Dashboard - Clean Fixed Version Loaded Successfully');