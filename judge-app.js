// Judge Dashboard JavaScript

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

// Check if user is authenticated and has judge role
function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user || user.role !== 'judge') {
        window.location.href = 'login.html';
        return;
    }
    
    // Update header to show judge info
    updateHeader(user);
}

// Update header with user info and logout button
function updateHeader(user) {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = `Welcome, ${user.username}`;
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Get current judge ID from user session
function getCurrentJudgeId() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    return user ? user.user_id : null;
}

// Show Dashboard
function showDashboard() {
    document.getElementById("content").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2>Welcome to the Judge Dashboard</h2>
            <p>Score participants and manage your judging assignments.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px;">
                <div class="dashboard-card">
                    <h3> My Competitions</h3>
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

// Show My Competitions
function showMyCompetitions() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    // First, get judge details to find judge_id
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
                    competitionsHtml += `
                        <div class="dashboard-card" style="text-align: left;">
                            <h3>${competition.competition_name}</h3>
                            <p><strong>Category:</strong> ${competition.category}</p>
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
            document.getElementById("content").innerHTML = `
                <h2>My Competitions</h2>
                <p class="alert alert-error">Error loading competitions. Please try again.</p>
            `;
        });
    })
    .catch(error => {
        console.error('Error fetching judge details:', error);
    });
}

// View Competition Participants
function viewCompetitionParticipants(competitionId) {
    fetch(`http://localhost:3002/participants/${competitionId}`)
    .then(response => response.json())
    .then(participants => {
        let participantsHtml = `
            <h2>Competition Participants</h2>
            <div style="margin-bottom: 20px;">
                <button onclick="showMyCompetitions()" class="secondary">Back to My Competitions</button>
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
                        <td>${participant.performance_title}</td>
                        <td>${participant.school_organization || 'Not specified'}</td>
                        <td>
                            <button onclick="scoreParticipant(${participant.participant_id}, ${competitionId}, '${participant.participant_name}')">
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
        document.getElementById("content").innerHTML = `
            <h2>Competition Participants</h2>
            <p class="alert alert-error">Error loading participants. Please try again.</p>
        `;
    });
}

// Start Scoring
function startScoring(competitionId) {
    viewCompetitionParticipants(competitionId);
}

// Score Participant
function scoreParticipant(participantId, competitionId, participantName) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    // Get judge ID first
    fetch('http://localhost:3002/judges')
    .then(response => response.json())
    .then(judges => {
        const currentJudge = judges.find(j => j.user_id === user.user_id);
        if (!currentJudge) {
            alert('Judge profile not found');
            return;
        }

        // Check if score already exists
        fetch(`http://localhost:3002/scores/${competitionId}`)
        .then(response => response.json())
        .then(scores => {
            const existingScore = scores.find(s => 
                s.judge_id === currentJudge.judge_id && s.participant_id === participantId
            );

            let scoreForm = `
                <h2>Score Participant: ${participantName}</h2>
                <div style="margin-bottom: 20px;">
                    <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Back to Participants</button>
                </div>
                
                <form id="scoreForm" class="dashboard-card" style="max-width: 600px; margin: 0 auto; text-align: left;">
                    <h3 style="color: #800020; margin-bottom: 20px;">Performance Scoring</h3>
                    
                    <label for="technical_score">Technical Score (0-100):</label>
                    <input type="number" id="technical_score" name="technical_score" min="0" max="100" step="0.1" 
                           value="${existingScore ? existingScore.technical_score : ''}" required>
                    <small style="color: #666;">Rate technical skill, accuracy, and execution</small>
                    
                    <label for="artistic_score">Artistic Score (0-100):</label>
                    <input type="number" id="artistic_score" name="artistic_score" min="0" max="100" step="0.1" 
                           value="${existingScore ? existingScore.artistic_score : ''}" required>
                    <small style="color: #666;">Rate creativity, expression, and artistic merit</small>
                    
                    <label for="overall_score">Overall Score (0-100):</label>
                    <input type="number" id="overall_score" name="overall_score" min="0" max="100" step="0.1" 
                           value="${existingScore ? existingScore.overall_score : ''}" required>
                    <small style="color: #666;">Overall impression and performance quality</small>
                    
                    <label for="comments">Comments and Feedback:</label>
                    <textarea id="comments" name="comments" rows="4" placeholder="Provide constructive feedback...">${existingScore ? existingScore.comments || '' : ''}</textarea>
                    
                    <input type="submit" value="${existingScore ? 'Update Score' : 'Submit Score'}">
                    <button type="button" onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Cancel</button>
                </form>
            `;

            document.getElementById("content").innerHTML = scoreForm;

            document.getElementById("scoreForm").onsubmit = function(event) {
                event.preventDefault();

                const scoreData = {
                    judge_id: currentJudge.judge_id,
                    participant_id: participantId,
                    competition_id: competitionId,
                    technical_score: parseFloat(document.getElementById("technical_score").value),
                    artistic_score: parseFloat(document.getElementById("artistic_score").value),
                    overall_score: parseFloat(document.getElementById("overall_score").value),
                    comments: document.getElementById("comments").value
                };

                // Validate scores
                if (scoreData.technical_score < 0 || scoreData.technical_score > 100 ||
                    scoreData.artistic_score < 0 || scoreData.artistic_score > 100 ||
                    scoreData.overall_score < 0 || scoreData.overall_score > 100) {
                    alert('All scores must be between 0 and 100');
                    return;
                }

                fetch('http://localhost:3002/submit-score', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(scoreData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Score submitted successfully!');
                        viewCompetitionParticipants(competitionId);
                    } else {
                        alert('Error: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error submitting score');
                });
            };
        })
        .catch(error => {
            console.error('Error fetching existing scores:', error);
        });
    })
    .catch(error => {
        console.error('Error fetching judge details:', error);
    });
}

// Show Scoring History

function showScoringHistory() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    // Get judge ID first
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

        // Get all competitions for this judge
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

            // Get scores for each competition
            Promise.all(
                competitions.map(comp => 
                    Promise.all([
                        // Get overall scores
                        fetch(`http://localhost:3002/overall-scores/${comp.competition_id}`).then(r => r.json()),
                        // Get detailed scores
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
                competitionScores.forEach(({ competition, overallScores, detailedScores }) => {
                    historyHtml += `
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

                document.getElementById("content").innerHTML = historyHtml;
            })
            .catch(error => {
                console.error('Error fetching scoring history:', error);
                document.getElementById("content").innerHTML = `
                    <h2>Scoring History</h2>
                    <p class="alert alert-error">Error loading scoring history.</p>
                `;
            });
        })
        .catch(error => {
            console.error('Error fetching competitions:', error);
        });
    })
    .catch(error => {
        console.error('Error fetching judge details:', error);
    });
}

// Show Profile
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
        document.getElementById("content").innerHTML = `
            <h2>My Profile</h2>
            <p class="alert alert-error">Error loading profile information.</p>
        `;
    });
}// Fixed Score Participant Function - add this to replace the existing one in judge-app.js
function scoreParticipant(participantId, competitionId, participantName) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    // Get judge ID first
    fetch('http://localhost:3002/judges')
    .then(response => response.json())
    .then(judges => {
        const currentJudge = judges.find(j => j.user_id === user.user_id);
        if (!currentJudge) {
            alert('Judge profile not found');
            return;
        }

        // Get competition criteria first
        fetch(`http://localhost:3002/competition-criteria/${competitionId}`)
        .then(response => response.json())
        .then(criteria => {
            if (criteria.length === 0) {
                // Fall back to simple scoring if no criteria are set
                showSimpleScoreForm(currentJudge.judge_id, participantId, competitionId, participantName);
                return;
            }

            // Show detailed criteria-based scoring form
            showDetailedScoreForm(currentJudge.judge_id, participantId, competitionId, participantName, criteria);
        })
        .catch(error => {
            console.error('Error fetching criteria:', error);
            // Fall back to simple scoring
            showSimpleScoreForm(currentJudge.judge_id, participantId, competitionId, participantName);
        });
    })
    .catch(error => {
        console.error('Error fetching judge details:', error);
    });
}

// Simple Score Form (fallback for competitions without criteria)
function showSimpleScoreForm(judgeId, participantId, competitionId, participantName) {
    // Check if score already exists
    fetch(`http://localhost:3002/overall-scores/${competitionId}`)
    .then(response => response.json())
    .then(scores => {
        const existingScore = scores.find(s => 
            s.judge_id === judgeId && s.participant_id === participantId
        );

        let scoreForm = `
            <h2>Score Participant: ${participantName}</h2>
            <div style="margin-bottom: 20px;">
                <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Back to Participants</button>
            </div>
            
            <form id="scoreForm" class="dashboard-card" style="max-width: 600px; margin: 0 auto; text-align: left;">
                <h3 style="color: #800020; margin-bottom: 20px;">Performance Scoring</h3>
                
                <label for="technical_score">Technical Score (0-100):</label>
                <input type="number" id="technical_score" name="technical_score" min="0" max="100" step="0.1" 
                       value="${existingScore ? existingScore.technical_score || '' : ''}" required>
                <small style="color: #666;">Rate technical skill, accuracy, and execution</small>
                
                <label for="artistic_score">Artistic Score (0-100):</label>
                <input type="number" id="artistic_score" name="artistic_score" min="0" max="100" step="0.1" 
                       value="${existingScore ? existingScore.artistic_score || '' : ''}" required>
                <small style="color: #666;">Rate creativity, expression, and artistic merit</small>
                
                <label for="overall_score">Overall Score (0-100):</label>
                <input type="number" id="overall_score" name="overall_score" min="0" max="100" step="0.1" 
                       value="${existingScore ? existingScore.total_score || '' : ''}" required>
                <small style="color: #666;">Overall impression and performance quality</small>
                
                <label for="comments">Comments and Feedback:</label>
                <textarea id="comments" name="comments" rows="4" placeholder="Provide constructive feedback...">${existingScore ? existingScore.general_comments || '' : ''}</textarea>
                
                <input type="submit" value="${existingScore ? 'Update Score' : 'Submit Score'}">
                <button type="button" onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Cancel</button>
            </form>
        `;

        document.getElementById("content").innerHTML = scoreForm;
       
                    startAutoSave(judgeId, participantId, competitionId);
                    loadDraft(judgeId, participantId, competitionId);

        document.getElementById("scoreForm").onsubmit = function(event) {
            event.preventDefault();

            const overallScore = parseFloat(document.getElementById("overall_score").value);
            
            if (overallScore < 0 || overallScore > 100) {
                alert('Overall score must be between 0 and 100');
                return;
            }

            const scoreData = {
                judge_id: judgeId,
                participant_id: participantId,
                competition_id: competitionId,
                total_score: overallScore,
                general_comments: document.getElementById("comments").value
            };

            fetch('http://localhost:3002/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scoreData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Score submitted successfully!');
                    viewCompetitionParticipants(competitionId);
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error submitting score');
            });
        };
    })
    .catch(error => {
        console.error('Error fetching existing scores:', error);
    });
}

// Detailed Score Form (for competitions with criteria)
function showDetailedScoreForm(judgeId, participantId, competitionId, participantName, criteria) {
    let scoreForm = `
        <h2>Score Participant: ${participantName}</h2>
        <div style="margin-bottom: 20px;">
            <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Back to Participants</button>
        </div>
        
        <form id="detailedScoreForm" class="dashboard-card" style="max-width: 800px; margin: 0 auto; text-align: left;">
            <h3 style="color: #800020; margin-bottom: 20px;">Detailed Criteria Scoring</h3>
            
            <div id="criteriaScores">
    `;

    criteria.forEach((criterion, index) => {
        scoreForm += `
            <div class="criterion-item" style="margin-bottom: 20px;">
                <h4>${criterion.criteria_name} (${criterion.percentage}%)</h4>
                <p style="color: #666; font-size: 14px;">${criterion.description}</p>
                
                <label for="score_${criterion.criteria_id}">Score (0-${criterion.max_score}):</label>
                <input type="number" id="score_${criterion.criteria_id}" 
                       data-criteria-id="${criterion.criteria_id}"
                       data-percentage="${criterion.percentage}"
                       min="0" max="${criterion.max_score}" step="0.1" required>
                
                <label for="comments_${criterion.criteria_id}">Comments:</label>
                <textarea id="comments_${criterion.criteria_id}" rows="2" 
                         placeholder="Optional comments for this criterion..."></textarea>
            </div>
        `;
    });

    scoreForm += `
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Total Weighted Score: <span id="totalScore">0.00</span>/100</strong>
            </div>
            
            <label for="general_comments">General Comments:</label>
            <textarea id="general_comments" rows="3" placeholder="Overall feedback and comments..."></textarea>
            
            <input type="submit" value="Submit Detailed Scores">
            <button type="button" onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Cancel</button>
        </form>
    `;

    document.getElementById("content").innerHTML = scoreForm;

    // Add event listeners to calculate total score
    criteria.forEach(criterion => {
        const scoreInput = document.getElementById(`score_${criterion.criteria_id}`);
        scoreInput.addEventListener('input', calculateTotalScore);
    });

    document.getElementById("detailedScoreForm").onsubmit = function(event) {
        event.preventDefault();

        const scores = [];
        let totalWeightedScore = 0;

        criteria.forEach(criterion => {
            const score = parseFloat(document.getElementById(`score_${criterion.criteria_id}`).value);
            const comments = document.getElementById(`comments_${criterion.criteria_id}`).value;
            const percentage = parseFloat(criterion.percentage);
            
            if (score < 0 || score > criterion.max_score) {
                alert(`Score for ${criterion.criteria_name} must be between 0 and ${criterion.max_score}`);
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

        if (scores.length !== criteria.length) {
            return; // Error occurred above
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Detailed scores submitted successfully!');
                viewCompetitionParticipants(competitionId);
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting detailed scores');
        });
    };
}

function calculateTotalScore() {
    const criteriaInputs = document.querySelectorAll('[data-criteria-id]');
    let totalWeightedScore = 0;

    criteriaInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const percentage = parseFloat(input.getAttribute('data-percentage')) || 0;
        const maxScore = parseFloat(input.getAttribute('max')) || 100;
        
        const normalizedScore = (score / maxScore) * percentage;
        totalWeightedScore += normalizedScore;
    });

    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = totalWeightedScore.toFixed(2);
    }
}
// Auto-save functionality - add this after your existing functions
let autoSaveInterval;
let isDraftSaved = false;

function startAutoSave(judgeId, participantId, competitionId) {
    // Clear any existing auto-save
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }

    // Auto-save every 30 seconds
    autoSaveInterval = setInterval(() => {
        saveDraft(judgeId, participantId, competitionId);
    }, 30000);
}

function saveDraft(judgeId, participantId, competitionId) {
    const formData = {};
    
    // Get all score inputs
    const scoreInputs = document.querySelectorAll('input[type="number"], textarea');
    scoreInputs.forEach(input => {
        if (input.value) {
            formData[input.id] = input.value;
        }
    });

    // Only save if there's actual data
    if (Object.keys(formData).length > 0) {
        const draftKey = `draft_${judgeId}_${participantId}_${competitionId}`;
        localStorage.setItem(draftKey, JSON.stringify({
            data: formData,
            timestamp: new Date().toISOString()
        }));
        
        // Show save indicator
        showSaveIndicator();
    }
}

function loadDraft(judgeId, participantId, competitionId) {
    const draftKey = `draft_${judgeId}_${participantId}_${competitionId}`;
    const draft = localStorage.getItem(draftKey);
    
    if (draft) {
        const draftData = JSON.parse(draft);
        const timeDiff = new Date() - new Date(draftData.timestamp);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Only load draft if it's less than 24 hours old
        if (hoursDiff < 24) {
            if (confirm(`Found unsaved work from ${new Date(draftData.timestamp).toLocaleString()}. Would you like to restore it?`)) {
                Object.entries(draftData.data).forEach(([fieldId, value]) => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.value = value;
                    }
                });
                
                // Recalculate total if it's detailed scoring
                if (typeof calculateTotalScore === 'function') {
                    calculateTotalScore();
                }
            }
        }
    }
}

function clearDraft(judgeId, participantId, competitionId) {
    const draftKey = `draft_${judgeId}_${participantId}_${competitionId}`;
    localStorage.removeItem(draftKey);
    
    // Clear auto-save interval
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
}

function showSaveIndicator() {
    // Create or update save indicator
    let indicator = document.getElementById('save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'save-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = 'Draft saved';
    indicator.style.opacity = '1';
    
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

