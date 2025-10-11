// ==========================================
// COMPLETE JUDGE DASHBOARD - FULL VERSION
// Replace entire judge-app.js with this
// ==========================================

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
        <div style="text-align: center; padding: 40px;">
            <h2>Welcome to the Judge Dashboard</h2>
            <p>Score participants and manage your judging assignments.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px;">
                <div class="dashboard-card">
                    <h3>📋 My Competitions</h3>
                    <p>View competitions assigned to you</p>
                    <button onclick="showMyCompetitions()" class="card-button">View Assignments</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>⭐ Score Participants</h3>
                    <p>Rate and score participant performances</p>
                    <button onclick="showMyCompetitions()" class="card-button">Start Scoring</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>📝 Scoring History</h3>
                    <p>Review your previous scores and comments</p>
                    <button onclick="showScoringHistory()" class="card-button">View History</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>👤 My Profile</h3>
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

    fetch('http://localhost:3002/judges')
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

        fetch(`http://localhost:3002/judge-competitions/${currentJudge.judge_id}`)
        .then(response => response.json())
        .then(competitions => {
            let competitionsHtml = `
                <h2>My Competitions</h2>
                <div style="margin-bottom: 20px;">
                    <p>You are assigned to judge the following competitions:</p>
                </div>
            `;

            if (competitions.length === 0) {
                competitionsHtml += '<p class="alert alert-warning">No competitions assigned to you yet.</p>';
            } else {
                competitionsHtml += '<div style="display: grid; gap: 20px;">';
                
                competitions.forEach(competition => {
                    const eventIcon = competition.is_pageant ? '👑' : '🎪';
                    competitionsHtml += `
                        <div class="dashboard-card" style="text-align: left;">
                            <h3>${competition.competition_name} ${eventIcon}</h3>
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
                
                competitionsHtml += '</div>';
            }

            document.getElementById("content").innerHTML = competitionsHtml;
        })
        .catch(error => {
            console.error('Error fetching judge competitions:', error);
            showNotification('Error loading competitions', 'error');
        });
    });
}

// ==========================================
// 4. VIEW PARTICIPANTS
// ==========================================
function viewCompetitionParticipants(competitionId) {
    fetch(`http://localhost:3002/participants/${competitionId}`)
    .then(response => response.json())
    .then(participants => {
        let participantsHtml = `
            <h2>Competition Participants</h2>
            <div style="margin-bottom: 20px;">
                <button onclick="showMyCompetitions()" class="secondary">← Back to My Competitions</button>
            </div>
        `;

        if (participants.length === 0) {
            participantsHtml += '<p class="alert alert-warning">No participants registered for this competition yet.</p>';
        } else {
            participantsHtml += `
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
                participantsHtml += `
                    <tr>
                        <td>${participant.participant_name}</td>
                        <td>${participant.age}</td>
                        <td>${participant.performance_title || 'N/A'}</td>
                        <td>${participant.school_organization || 'Not specified'}</td>
                        <td>
                            <button onclick="scoreParticipant(${participant.participant_id}, ${competitionId}, '${participant.participant_name.replace(/'/g, "\\'")}')">
                                Score Performance
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            participantsHtml += '</table>';
        }

        document.getElementById("content").innerHTML = participantsHtml;
    })
    .catch(error => {
        console.error('Error fetching participants:', error);
        showNotification('Error loading participants', 'error');
    });
}

function startScoring(competitionId) {
    viewCompetitionParticipants(competitionId);
}

// ==========================================
// 5. MAIN SCORING FUNCTION
// ==========================================
function scoreParticipant(participantId, competitionId, participantName) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch('http://localhost:3002/judges')
    .then(response => response.json())
    .then(judges => {
        const currentJudge = judges.find(j => j.user_id === user.user_id);
        if (!currentJudge) {
            showNotification('Judge profile not found', 'error');
            return;
        }

        // Check if this is a pageant competition
        fetch(`http://localhost:3002/competition/${competitionId}`)
        .then(response => response.json())
        .then(competition => {
            console.log('Competition:', competition); // Debug
            console.log('Is Pageant:', competition.is_pageant); // Debug
            
            if (competition.is_pageant) {
                // Show segment selection for pageants
                showSegmentSelection(currentJudge.judge_id, participantId, competitionId, participantName);
            } else {
                // Show regular scoring for non-pageants
                showRegularScoring(currentJudge.judge_id, participantId, competitionId, participantName);
            }
        })
        .catch(error => {
            console.error('Error fetching competition:', error);
            showNotification('Error loading competition details', 'error');
        });
    });
}

// ==========================================
// 6. PAGEANT SEGMENT SELECTION
// ==========================================
function showSegmentSelection(judgeId, participantId, competitionId, participantName) {
    console.log('Showing segment selection...'); // Debug
    
    document.getElementById("content").innerHTML = `
        <h2>👑 Pageant Scoring - Select Segment</h2>
        <h3 style="color: #800020;">Participant: ${participantName}</h3>
        
        <div style="margin-bottom: 20px;">
            <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">← Back to Participants</button>
        </div>
        
        <div class="alert alert-info">
            <strong>📋 Multi-Segment Pageant Scoring:</strong>
            <p>This pageant has multiple segments (days). Select which segment you want to score for this participant.</p>
        </div>
        
        <div id="segmentsList">
            <div class="loading">Loading pageant segments...</div>
        </div>
    `;

    fetch(`http://localhost:3002/pageant-segments/${competitionId}`)
    .then(response => response.json())
    .then(segments => {
        console.log('Segments loaded:', segments); // Debug
        
        if (segments.length === 0) {
            document.getElementById("segmentsList").innerHTML = `
                <div class="alert alert-warning">
                    <h3>⚠️ No Segments Configured</h3>
                    <p>This pageant doesn't have segments set up yet. Contact the administrator to create segments.</p>
                </div>
            `;
            return;
        }

        // Group segments by day
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
                <div class="dashboard-card" style="text-align: left; border-left: 5px solid #ff69b4;">
                    <h3>📅 Day ${dayNumber} - ${new Date(firstSegment.segment_date).toLocaleDateString()}</h3>
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
                            <button onclick="showSegmentScoring(${judgeId}, ${participantId}, ${competitionId}, ${segment.segment_id}, '${participantName.replace(/'/g, "\\'")}', '${segment.segment_name.replace(/'/g, "\\'")}');" 
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
    })
    .catch(error => {
        console.error('Error loading segments:', error);
        document.getElementById("segmentsList").innerHTML = `
            <div class="alert alert-error">
                <h3>❌ Error Loading Segments</h3>
                <p>Error: ${error.message}</p>
                <p>Please contact the administrator.</p>
            </div>
        `;
    });
}

// ==========================================
// 7. SEGMENT SCORING WITH CRITERIA
// ==========================================
function showSegmentScoring(judgeId, participantId, competitionId, segmentId, participantName, segmentName) {
    console.log('Loading segment-specific criteria...'); // Debug
    
    // CHANGE: Fetch segment-specific criteria instead of all competition criteria
    fetch(`http://localhost:3002/segment-criteria/${segmentId}`)
    .then(response => response.json())
    .then(criteria => {
        console.log('Segment criteria loaded:', criteria); // Debug // Debug
        
        if (criteria.length === 0) {
            showNotification('No criteria configured for this competition', 'error');
            return;
        }

        displaySegmentScoringForm(judgeId, participantId, competitionId, segmentId, participantName, segmentName, criteria);
    })
    .catch(error => {
        console.error('Error loading criteria:', error);
        showNotification('Error loading scoring criteria', 'error');
    });
}

function displaySegmentScoringForm(judgeId, participantId, competitionId, segmentId, participantName, segmentName, criteria) {
    let formHtml = `
        <h2>👑 Score Segment: ${segmentName}</h2>
        <h3 style="color: #800020;">Participant: ${participantName}</h3>
        
        <div style="margin-bottom: 20px;">
            <button onclick="showSegmentSelection(${judgeId}, ${participantId}, ${competitionId}, '${participantName.replace(/'/g, "\\'")}')" class="secondary">← Back to Segment Selection</button>
        </div>
        
        <form id="segmentScoreForm" class="dashboard-card" style="max-width: 900px; margin: 0 auto; text-align: left;">
            <div class="alert alert-info">
                <strong>📊 Scoring Instructions:</strong>
                <p>Rate each criterion from 0 to 100. Your scores will be weighted automatically based on percentages.</p>
            </div>
            
            <div id="criteriaScores">
    `;

    criteria.forEach((criterion, index) => {
        formHtml += `
            <div class="criterion-item" style="margin-bottom: 25px; background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #800020;">
                <h4 style="color: #800020; margin-bottom: 10px;">
                    ${index + 1}. ${criterion.criteria_name} (${criterion.percentage}%)
                </h4>
                <p style="color: #666; margin-bottom: 15px; font-size: 14px;">
                    ${criterion.description || 'Score this criterion based on the performance'}
                </p>
                
                <div style="display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: start;">
                    <div>
                        <label for="score_${criterion.criteria_id}" style="display: block; margin-bottom: 5px; font-weight: 600;">Score (0-100):</label>
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
                    <div>
                        <label for="comments_${criterion.criteria_id}" style="display: block; margin-bottom: 5px; font-weight: 600;">Comments (Optional):</label>
                        <textarea id="comments_${criterion.criteria_id}" 
                                  rows="2" 
                                  placeholder="Your feedback for this criterion..."
                                  style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;"></textarea>
                    </div>
                </div>
            </div>
        `;
    });

    formHtml += `
            </div>
            
            <div id="totalScoreDisplay" style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(128, 0, 32, 0.3);">
                <h3 style="margin: 0 0 10px 0; font-size: 18px;">Total Weighted Score</h3>
                <div style="font-size: 3.5em; font-weight: bold; margin: 15px 0;" id="totalScore">0.00</div>
                <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">out of 100 points</p>
            </div>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #2196F3;">
                <strong>💡 How Scoring Works:</strong>
                <ul style="margin-top: 10px; color: #1976d2;">
                    <li>Each criterion is scored from 0-100 points</li>
                    <li>Scores are weighted by percentage (shown above each criterion)</li>
                    <li><strong>Formula:</strong> Final Score = Σ(Score × Percentage / 100)</li>
                    <li>Total percentages add up to 100%</li>
                </ul>
            </div>
            
            <label for="general_comments" style="display: block; margin-top: 20px; font-weight: 600; color: #800020; font-size: 16px;">General Comments for ${segmentName}:</label>
            <textarea id="general_comments" 
                      rows="4" 
                      placeholder="Overall feedback for this segment performance..."
                      style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; margin-top: 5px; font-size: 14px;"></textarea>
            
            <div style="margin-top: 30px; text-align: center;">
                <button type="submit" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 18px 45px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    ✅ Submit Segment Score
                </button>
                <button type="button" onclick="showSegmentSelection(${judgeId}, ${participantId}, ${competitionId}, '${participantName.replace(/'/g, "\\'")}')" class="secondary" style="margin-left: 15px; padding: 18px 35px; font-size: 16px;">
                    Cancel
                </button>
            </div>
        </form>
    `;

    document.getElementById("content").innerHTML = formHtml;

    // Form submission
    document.getElementById("segmentScoreForm").onsubmit = function(event) {
        event.preventDefault();

        const scores = [];
        let totalWeightedScore = 0;
        let hasError = false;

        criteria.forEach(criterion => {
            if (hasError) return;
            
            const scoreInput = document.getElementById(`score_${criterion.criteria_id}`);
            const score = parseFloat(scoreInput.value);
            const comments = document.getElementById(`comments_${criterion.criteria_id}`).value;
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
                comments: comments || null
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

        console.log('Submitting scores:', submissionData); // Debug

        fetch('http://localhost:3002/submit-segment-scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Server response:', data); // Debug
            
            if (data.success) {
                showNotification(`✅ Segment "${segmentName}" scored successfully! Total: ${totalWeightedScore.toFixed(2)}/100`, 'success');
                setTimeout(() => {
                    showSegmentSelection(judgeId, participantId, competitionId, participantName);
                }, 2000);
            } else {
                showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error submitting segment scores: ' + error.message, 'error');
        });
    };
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
        
        const displayDiv = document.getElementById('totalScoreDisplay');
        if (totalWeightedScore >= 90) {
            displayDiv.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        } else if (totalWeightedScore >= 75) {
            displayDiv.style.background = 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)';
        } else if (totalWeightedScore >= 60) {
            displayDiv.style.background = 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)';
        } else {
            displayDiv.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        }
    }
}

// ==========================================
// 8. REGULAR COMPETITION SCORING
// ==========================================
function showRegularScoring(judgeId, participantId, competitionId, participantName) {
    fetch(`http://localhost:3002/competition-criteria/${competitionId}`)
    .then(response => response.json())
    .then(criteria => {
        if (criteria.length === 0) {
            showNotification('No criteria configured for this competition', 'error');
            return;
        }

        showDetailedScoreForm(judgeId, participantId, competitionId, participantName, criteria);
    })
    .catch(error => {
        console.error('Error fetching criteria:', error);
        showNotification('Error loading criteria', 'error');
    });
}

function showDetailedScoreForm(judgeId, participantId, competitionId, participantName, criteria) {
    let scoreForm = `
        <h2>Score Participant: ${participantName}</h2>
        <div style="margin-bottom: 20px;">
            <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">← Back to Participants</button>
        </div>
        
        <form id="detailedScoreForm" class="dashboard-card" style="max-width: 800px; margin: 0 auto; text-align: left;">
            <h3 style="color: #800020; margin-bottom: 20px;">Detailed Criteria Scoring</h3>
            
            <div id="criteriaScores">
    `;

    criteria.forEach((criterion) => {
        scoreForm += `
            <div class="criterion-item" style="margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h4>${criterion.criteria_name} (${criterion.percentage}%)</h4>
                <p style="color: #666; font-size: 14px;">${criterion.description}</p>
                
                <label for="score_${criterion.criteria_id}">Score (0-${criterion.max_score}):</label>
                <input type="number" id="score_${criterion.criteria_id}" 
                       data-criteria-id="${criterion.criteria_id}"
                       data-percentage="${criterion.percentage}"
                       data-max-score="${criterion.max_score}"
                       min="0" max="${criterion.max_score}" step="0.1" required
                       oninput="calculateTotalScore()">
                
                <label for="comments_${criterion.criteria_id}">Comments:</label>
                <textarea id="comments_${criterion.criteria_id}" rows="2" 
                         placeholder="Optional comments for this criterion..."></textarea>
            </div>
        `;
    });

    scoreForm += `
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <strong style="font-size: 18px;">Total Weighted Score: <span id="totalScore" style="color: #800020; font-size: 24px;">0.00</span>/100</strong>
            </div>
            
            <label for="general_comments">General Comments:</label>
            <textarea id="general_comments" rows="3" placeholder="Overall feedback and comments..."></textarea>
            
            <div style="margin-top: 20px; text-align: center;">
                <input type="submit" value="✅ Submit Detailed Scores" style="padding: 15px 40px; font-size: 16px;">
                <button type="button" onclick="viewCompetitionParticipants(${competitionId})" class="secondary" style="margin-left: 10px;">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById("content").innerHTML = scoreForm;

    document.getElementById("detailedScoreForm").onsubmit = function(event) {
        event.preventDefault();

        const scores = [];
        let totalWeightedScore = 0;
        let hasError = false;

        criteria.forEach(criterion => {
            if (hasError) return;
            
            const score = parseFloat(document.getElementById(`score_${criterion.criteria_id}`).value);
            const comments = document.getElementById(`comments_${criterion.criteria_id}`).value;
            const percentage = parseFloat(criterion.percentage);
            
            if (isNaN(score) || score < 0 || score > criterion.max_score) {
                showNotification(`Score for ${criterion.criteria_name} must be between 0 and ${criterion.max_score}`, 'error');
                hasError = true;
                return;
            }

            const weightedScore = (score / criterion.max_score) * percentage;
            totalWeightedScore += weightedScore;

            scores.push({
                criteria_id: criterion.criteria_id,
                score: score,
                percentage: percentage,
                comments: comments
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

        fetch('http://localhost:3002/submit-detailed-scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Detailed scores submitted successfully!', 'success');
                viewCompetitionParticipants(competitionId);
            } else {
                showNotification('Error: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error submitting detailed scores', 'error');
        });
    };
}

function calculateTotalScore() {
    const criteriaInputs = document.querySelectorAll('[data-criteria-id]');
    let totalWeightedScore = 0;

    criteriaInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const percentage = parseFloat(input.getAttribute('data-percentage')) || 0;
        const maxScore = parseFloat(input.getAttribute('data-max-score')) || 100;
        
        const normalizedScore = (score / maxScore) * percentage;
        totalWeightedScore += normalizedScore;
    });

    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = totalWeightedScore.toFixed(2);
    }
}

// ==========================================
// 9. SCORING HISTORY
// ==========================================
function showScoringHistory() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch('http://localhost:3002/judges')
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

        fetch(`http://localhost:3002/judge-competitions/${currentJudge.judge_id}`)
        .then(response => response.json())
        .then(competitions => {
            let historyHtml = `
                <h2>My Scoring History</h2>
                <div style="margin-bottom: 20px;">
                    <p>Review all your submitted scores and feedback.</p>
                </div>
            `;

            if (competitions.length === 0) {
                historyHtml += '<p class="alert alert-warning">No competitions assigned yet.</p>';
                document.getElementById("content").innerHTML = historyHtml;
                return;
            }

            Promise.all(
                competitions.map(comp => 
                    Promise.all([
                        fetch(`http://localhost:3002/overall-scores/${comp.competition_id}`).then(r => r.json()),
                        fetch(`http://localhost:3002/detailed-scores/${comp.competition_id}`).then(r => r.json()).catch(() => [])
                    ])
                    .then(([overallScores, detailedScores]) => ({
                        competition: comp,
                        overallScores: overallScores.filter(s => s.judge_id === currentJudge.judge_id),
                        detailedScores: detailedScores.filter(s => s.judge_id === currentJudge.judge_id)
                    }))
                )
            )
            .then(competitionScores => {
                competitionScores.forEach(({ competition, overallScores }) => {
                    const eventIcon = competition.is_pageant ? '👑' : '🎪';
                    historyHtml += `
                        <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                            <h3>${competition.competition_name} ${eventIcon}</h3>
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

                document.getElementById("content").innerHTML = historyHtml;
            })
            .catch(error => {
                console.error('Error fetching scoring history:', error);
                showNotification('Error loading scoring history', 'error');
            });
        });
    });
}

// ==========================================
// 10. PROFILE
// ==========================================
function showProfile() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch('http://localhost:3002/judges')
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
                        <p><strong>Username:</strong> ${currentJudge.username}</p>
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
// 11. NOTIFICATION SYSTEM
// ==========================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 350px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    notification.style.background = colors[type] || colors.info;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ==========================================
// 12. CONNECTION MONITOR
// ==========================================
let isOnline = navigator.onLine;

window.addEventListener('online', function() {
    isOnline = true;
    showNotification('You are back online!', 'success');
});

window.addEventListener('offline', function() {
    isOnline = false;
    showNotification('You are offline. Changes will be saved when connection is restored.', 'warning');
});

function checkConnectionSpeed() {
    const startTime = new Date().getTime();
    fetch('http://localhost:3002/competitions', { method: 'HEAD' })
    .then(() => {
        const endTime = new Date().getTime();
        const latency = endTime - startTime;
        
        if (latency < 200) {
            updateConnectionIndicator('🟢 Excellent', '#28a745');
        } else if (latency < 500) {
            updateConnectionIndicator('🟡 Good', '#ffc107');
        } else {
            updateConnectionIndicator('🔴 Slow', '#dc3545');
        }
    })
    .catch(() => {
        updateConnectionIndicator('⚫ Offline', '#dc3545');
    });
}

function updateConnectionIndicator(text, color) {
    let indicator = document.getElementById('connection-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connection-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 15px;
            background: white;
            border: 2px solid ${color};
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(indicator);
    }
    indicator.textContent = text;
    indicator.style.borderColor = color;
    indicator.style.color = color;
}

setInterval(checkConnectionSpeed, 10000);
checkConnectionSpeed();

// ==========================================
// END OF JUDGE DASHBOARD
// ==========================================
console.log('✅ Complete Judge Dashboard Loaded Successfully - With Pageant Segments Support');