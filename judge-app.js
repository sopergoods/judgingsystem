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
                    <h3>🏆 My Competitions</h3>
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
                    fetch(`http://localhost:3002/scores/${comp.competition_id}`)
                    .then(r => r.json())
                    .then(scores => ({
                        competition: comp,
                        scores: scores.filter(s => s.judge_id === currentJudge.judge_id)
                    }))
                )
            )
            .then(competitionScores => {
                competitionScores.forEach(({ competition, scores }) => {
                    historyHtml += `
                        <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                            <h3>${competition.competition_name}</h3>
                            <p><strong>Category:</strong> ${competition.category} | <strong>Date:</strong> ${competition.competition_date}</p>
                            
                            ${scores.length === 0 ? 
                                '<p style="color: #666;">No scores submitted yet for this competition.</p>' :
                                `<table style="width: 100%; margin-top: 15px;">
                                    <tr>
                                        <th>Participant</th>
                                        <th>Technical</th>
                                        <th>Artistic</th>
                                        <th>Overall</th>
                                        <th>Comments</th>
                                    </tr>
                                    ${scores.map(score => `
                                        <tr>
                                            <td>${score.participant_name}</td>
                                            <td><span class="score-display">${score.technical_score}</span></td>
                                            <td><span class="score-display">${score.artistic_score}</span></td>
                                            <td><span class="score-display">${score.overall_score}</span></td>
                                            <td>${score.comments || 'No comments'}</td>
                                        </tr>
                                    `).join('')}
                                </table>`
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
}