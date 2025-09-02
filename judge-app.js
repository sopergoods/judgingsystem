// Enhanced Judge Dashboard JavaScript with Multi-Criteria Scoring

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
    sessionStorage.removeUser('user');
    window.location.href = 'login.html';
}

// Get current judge ID from user session
function getCurrentJudgeId() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    return user ? user.user_id : null;
}

// Enhanced Dashboard
function showDashboard() {
    document.getElementById("content").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2>🏆 Welcome to the Enhanced Judge Dashboard</h2>
            <p>Score participants using the new multi-criteria system with weighted percentages.</p>
            
            <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border: 2px solid #800020;">
                <h3 style="color: #800020; margin-bottom: 15px;">✨ Enhanced Scoring Features</h3>
                <ul style="color: #666; line-height: 1.8; text-align: left; max-width: 600px; margin: 0 auto;">
                    <li><strong>Multi-Criteria Scoring:</strong> Score participants on multiple specific criteria</li>
                    <li><strong>Weighted Percentages:</strong> Each criterion has a specific percentage weight</li>
                    <li><strong>Detailed Feedback:</strong> Provide comments for each scoring criterion</li>
                    <li><strong>Automatic Calculation:</strong> Final scores calculated automatically</li>
                    <li><strong>Pageant Support:</strong> Special interface for beauty pageant judging</li>
                </ul>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px;">
                <div class="dashboard-card">
                    <h3>🏆 My Competitions</h3>
                    <p>View competitions assigned to you</p>
                    <button onclick="showMyCompetitions()" class="card-button">View Assignments</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>⭐ Multi-Criteria Scoring</h3>
                    <p>Score participants using detailed criteria</p>
                    <button onclick="showMyCompetitions()" class="card-button">Start Scoring</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>📝 Scoring History</h3>
                    <p>Review your previous detailed scores</p>
                    <button onclick="showScoringHistory()" class="card-button">View History</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>👤 My Profile</h3>
                    <p>View your judge profile and expertise</p>
                    <button onclick="showProfile()" class="card-button">View Profile</button>
                </div>
            </div>
        </div>
    `;
}

// Show My Competitions (Enhanced)
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
                <h2>🏆 My Competition Assignments</h2>
                <div style="margin-bottom: 20px;">
                    <p>You are assigned to judge the following competitions with enhanced scoring:</p>
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
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
                                <div>
                                    <p><strong>Event Type:</strong> ${competition.type_name} ${eventIcon}</p>
                                    <p><strong>Date:</strong> ${competition.competition_date}</p>
                                    <p><strong>Participants:</strong> ${competition.participant_count}</p>
                                </div>
                                <div>
                                    <p><strong>Scoring Type:</strong> ${competition.is_pageant ? 'Beauty Pageant Criteria' : 'Performance Criteria'}</p>
                                    <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Ready to Score</span></p>
                                </div>
                            </div>
                            <div style="margin-top: 20px;">
                                <button onclick="viewScoringCriteria(${competition.competition_id}, '${competition.competition_name}')" style="margin: 2px; padding: 8px 16px; background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">📋 View Scoring Criteria</button>
                                <button onclick="viewCompetitionParticipants(${competition.competition_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">👥 View Participants</button>
                                <button onclick="startDetailedScoring(${competition.competition_id})" style="margin: 2px; padding: 8px 16px; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">⭐ Start Scoring</button>
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

// View Scoring Criteria for Competition
function viewScoringCriteria(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>📋 Scoring Criteria</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>📊 How Scoring Works:</strong>
            <ul style="margin-top: 10px; color: #856404;">
                <li>Each criterion has a specific percentage weight</li>
                <li>Score each criterion from 0 to 100 points</li>
                <li>Final score is calculated using weighted averages</li>
                <li>All percentages add up to 100% for fair scoring</li>
            </ul>
        </div>
        
        <div id="criteriaDisplay">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading scoring criteria...</p>
            </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
            <button onclick="showMyCompetitions()" class="secondary">← Back to My Competitions</button>
            <button onclick="startDetailedScoring(${competitionId})" class="card-button">⭐ Start Scoring Participants</button>
        </div>
    `;

    // Load criteria for this competition
    fetch(`http://localhost:3002/competition-criteria/${competitionId}`)
    .then(response => response.json())
    .then(criteria => {
        if (criteria.length === 0) {
            document.getElementById("criteriaDisplay").innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h3>No Scoring Criteria Set</h3>
                    <p>The competition administrator hasn't set up scoring criteria yet. Please contact them to set up the judging criteria before scoring can begin.</p>
                </div>
            `;
            return;
        }

        let criteriaHtml = `
            <div style="display: grid; gap: 15px;">
        `;
        
        criteria.forEach((criterion, index) => {
            criteriaHtml += `
                <div class="dashboard-card" style="text-align: left; border-left: 5px solid #800020;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                        <h4 style="color: #800020; margin: 0;">#{criterion.order_number} ${criterion.criteria_name}</h4>
                        <div style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold;">
                            ${criterion.percentage}%
                        </div>
                    </div>
                    <p style="color: #666; margin-bottom: 10px;">
                        <strong>What to evaluate:</strong> ${criterion.description || 'Score this aspect of the performance'}
                    </p>
                    <div style="display: flex; align-items: center; gap: 15px; background: #f8f9fa; padding: 10px; border-radius: 8px;">
                        <span style="color: #800020; font-weight: bold;">Scoring Range:</span>
                        <span>0 - ${criterion.max_score} points</span>
                        <span style="color: #666;">|</span>
                        <span style="color: #800020; font-weight: bold;">Weight: ${criterion.percentage}%</span>
                    </div>
                </div>
            `;
        });
        
        criteriaHtml += `</div>`;
        document.getElementById("criteriaDisplay").innerHTML = criteriaHtml;
    })
    .catch(error => {
        console.error('Error loading criteria:', error);
        document.getElementById("criteriaDisplay").innerHTML = '<p class="alert alert-error">Error loading scoring criteria.</p>';
    });
}

// Enhanced View Competition Participants with Scoring Status
function viewCompetitionParticipants(competitionId) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    // Get current judge info
    fetch('http://localhost:3002/judges')
    .then(response => response.json())
    .then(judges => {
        const currentJudge = judges.find(j => j.user_id === user.user_id);
        if (!currentJudge) return;

        // Get participants and their scoring status
        Promise.all([
            fetch(`http://localhost:3002/participants/${competitionId}`).then(r => r.json()),
            fetch(`http://localhost:3002/overall-scores/${competitionId}`).then(r => r.json())
        ])
        .then(([participants, allScores]) => {
            // Filter scores for current judge
            const judgeScores = allScores.filter(score => score.judge_id === currentJudge.judge_id);
            
            let participantsHtml = `
                <h2>👥 Competition Participants</h2>
                <div style="margin-bottom: 20px;">
                    <button onclick="showMyCompetitions()" class="secondary">← Back to My Competitions</button>
                    <button onclick="startDetailedScoring(${competitionId})" class="card-button" style="margin-left: 10px;">⭐ Start Scoring</button>
                </div>
                
                <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <strong>📊 Scoring Progress:</strong>
                    <div style="margin-top: 10px;">
                        <span style="color: #28a745; font-weight: bold;">●</span> Completed: ${judgeScores.length} participants<br>
                        <span style="color: #ffc107; font-weight: bold;">●</span> Remaining: ${participants.length - judgeScores.length} participants
                    </div>
                </div>
            `;

            if (participants.length === 0) {
                participantsHtml += '<p class="alert alert-warning">No participants registered for this competition yet.</p>';
            } else {
                participantsHtml += `
                    <div style="display: grid; gap: 15px;">
                `;
                
                participants.forEach(participant => {
                    const hasScored = judgeScores.some(score => score.participant_id === participant.participant_id);
                    const scoreData = judgeScores.find(score => score.participant_id === participant.participant_id);
                    const statusColor = hasScored ? '#28a745' : '#ffc107';
                    const statusIcon = hasScored ? '✅' : '⏳';
                    const statusText = hasScored ? 'Scored' : 'Pending';
                    
                    participantsHtml += `
                        <div class="dashboard-card" style="text-align: left;">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                                <h3>${participant.participant_name} ${participant.is_pageant ? '👑' : ''}</h3>
                                <div style="background: ${statusColor}; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                                    ${statusIcon} ${statusText}
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <p><strong>Age:</strong> ${participant.age}</p>
                                    <p><strong>Performance:</strong> ${participant.performance_title || 'N/A'}</p>
                                </div>
                                <div>
                                    <p><strong>School/Org:</strong> ${participant.school_organization || 'N/A'}</p>
                                    ${participant.is_pageant && participant.height ? `<p><strong>Height:</strong> ${participant.height}</p>` : ''}
                                </div>
                                <div>
                                    ${hasScored ? `<p><strong>Score:</strong> <span style="color: #800020; font-weight: bold; font-size: 18px;">${scoreData.total_score.toFixed(2)}</span></p>` : ''}
                                    ${hasScored ? `<p><strong>Scored:</strong> ${new Date(scoreData.submitted_at).toLocaleDateString()}</p>` : ''}
                                </div>
                            </div>
                            
                            ${participant.performance_description ? `
                                <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                                    <strong>Performance Description:</strong><br>
                                    ${participant.performance_description}
                                </div>
                            ` : ''}
                            
                            ${participant.is_pageant && (participant.talents || participant.special_awards) ? `
                                <div style="background: #fff0f5; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                                    ${participant.talents ? `<p><strong>Talents:</strong> ${participant.talents}</p>` : ''}
                                    ${participant.special_awards ? `<p><strong>Awards:</strong> ${participant.special_awards}</p>` : ''}
                                </div>
                            ` : ''}
                            
                            <div style="margin-top: 15px;">
                                <button onclick="scoreParticipantDetailed(${participant.participant_id}, ${competitionId}, '${participant.participant_name.replace(/'/g, "\\'")}')" 
                                        style="background: ${hasScored ? '#17a2b8' : 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'}; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    ${hasScored ? '📝 Update Score' : '⭐ Score Participant'}
                                </button>
                                ${hasScored ? `
                                    <button onclick="viewParticipantScoreBreakdown(${participant.participant_id}, ${competitionId})" 
                                            style="margin-left: 10px; background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                                        📊 View Details
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
                
                participantsHtml += '</div>';
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
    });
}

// Start Detailed Scoring
function startDetailedScoring(competitionId) {
    viewCompetitionParticipants(competitionId);
}

// Enhanced Score Participant with Multi-Criteria
function scoreParticipantDetailed(participantId, competitionId, participantName) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    // Get judge ID and competition criteria
    fetch('http://localhost:3002/judges')
    .then(response => response.json())
    .then(judges => {
        const currentJudge = judges.find(j => j.user_id === user.user_id);
        if (!currentJudge) {
            alert('Judge profile not found');
            return;
        }

        // Load criteria and existing scores
        Promise.all([
            fetch(`http://localhost:3002/competition-criteria/${competitionId}`).then(r => r.json()),
            fetch(`http://localhost:3002/participant-scores/${participantId}/${competitionId}`).then(r => r.json()).catch(() => [])
        ])
        .then(([criteria, existingScores]) => {
            if (criteria.length === 0) {
                alert('No scoring criteria set for this competition. Please contact the administrator.');
                return;
            }

            // Filter existing scores for current judge
            const judgeScores = existingScores.filter(score => score.judge_id === currentJudge.judge_id);

            let scoreForm = `
                <h2>⭐ Multi-Criteria Scoring</h2>
                <h3 style="color: #800020;">Participant: ${participantName}</h3>
                
                <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <strong>📊 Scoring Instructions:</strong>
                    <ul style="margin-top: 10px; color: #856404;">
                        <li>Score each criterion from 0 to 100 points based on the participant's performance</li>
                        <li>Each criterion has a specific percentage weight in the final score</li>
                        <li>Provide helpful comments for each criterion to support your scoring</li>
                        <li>Final score will be calculated automatically using weighted averages</li>
                    </ul>
                </div>
                
                <form id="detailedScoreForm" class="dashboard-card" style="max-width: 800px; margin: 0 auto; text-align: left;">
                    <h3 style="color: #800020; margin-bottom: 20px;">📋 Detailed Performance Scoring</h3>
                    
                    <input type="hidden" id="judge_id" value="${currentJudge.judge_id}">
                    <input type="hidden" id="participant_id" value="${participantId}">
                    <input type="hidden" id="competition_id" value="${competitionId}">
                    
                    <div id="criteriaScoring">
            `;

            criteria.forEach((criterion, index) => {
                const existingScore = judgeScores.find(score => score.criteria_id === criterion.criteria_id);
                
                scoreForm += `
                    <div class="criterion-scoring" style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                            <h4 style="color: #800020; margin: 0;">#{criterion.order_number} ${criterion.criteria_name}</h4>
                            <div style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                                ${criterion.percentage}%
                            </div>
                        </div>
                        
                        <p style="color: #666; margin-bottom: 15px; font-style: italic;">
                            ${criterion.description || 'Evaluate this aspect of the performance'}
                        </p>
                        
                        <div style="display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: start;">
                            <div style="text-align: center;">
                                <label style="display: block; color: #800020; font-weight: bold; margin-bottom: 8px;">Score (0-${criterion.max_score})</label>
                                <input type="number" 
                                       class="criteria-score" 
                                       data-criteria-id="${criterion.criteria_id}"
                                       data-percentage="${criterion.percentage}"
                                       value="${existingScore ? existingScore.score : ''}" 
                                       min="0" 
                                       max="${criterion.max_score}" 
                                       step="0.1"
                                       style="width: 100px; padding: 12px; text-align: center; font-size: 18px; font-weight: bold; border: 2px solid #800020; border-radius: 8px;"
                                       onchange="updateTotalScore()"
                                       required>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">Max: ${criterion.max_score}</div>
                            </div>
                            
                            <div>
                                <label style="display: block; color: #800020; font-weight: bold; margin-bottom: 8px;">Comments & Feedback:</label>
                                <textarea class="criteria-comment" 
                                          data-criteria-id="${criterion.criteria_id}"
                                          rows="3" 
                                          style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; resize: vertical;" 
                                          placeholder="Provide specific feedback for this criterion...">${existingScore ? (existingScore.comments || '') : ''}</textarea>
                            </div>
                        </div>
                    </div>
                `;
            });

            scoreForm += `
                    </div>
                    
                    <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                        <h4 style="color: #0d47a1; margin-bottom: 15px;">📊 Final Score Calculation</h4>
                        <div id="scoreBreakdown" style="margin-bottom: 15px;">
                            <div style="font-size: 24px; color: #800020; font-weight: bold;">
                                Total Score: <span id="finalScore">0.00</span> / 100
                            </div>
                        </div>
                        <div id="detailedBreakdown" style="font-size: 14px; color: #666;"></div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #800020; font-weight: bold; margin-bottom: 8px;">General Comments (Optional):</label>
                        <textarea id="general_comments" 
                                  rows="3" 
                                  style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px;" 
                                  placeholder="Overall performance feedback, strengths, areas for improvement...">${judgeScores.length > 0 && judgeScores[0].general_comments ? judgeScores[0].general_comments : ''}</textarea>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <button type="button" onclick="submitDetailedScore()" 
                                style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; border: none; padding: 15px 40px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 18px;">
                            💾 ${judgeScores.length > 0 ? 'Update Detailed Score' : 'Submit Detailed Score'}
                        </button>
                        <button type="button" onclick="viewCompetitionParticipants(${competitionId})" 
                                class="secondary" 
                                style="margin-left: 15px; padding: 15px 30px; font-size: 16px;">
                            Cancel
                        </button>
                    </div>
                </form>
            `;

            document.getElementById("content").innerHTML = scoreForm;
            
            // Calculate initial total if scores exist
            updateTotalScore();
        })
        .catch(error => {
            console.error('Error loading scoring data:', error);
            alert('Error loading scoring information');
        });
    })
    .catch(error => {
        console.error('Error fetching judge details:', error);
    });
}

// Update Total Score Calculation
function updateTotalScore() {
    const scoreInputs = document.querySelectorAll('.criteria-score');
    let totalWeightedScore = 0;
    let totalPercentage = 0;
    let breakdownHtml = '';
    
    scoreInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const percentage = parseFloat(input.getAttribute('data-percentage')) || 0;
        const weightedScore = (score * percentage) / 100;
        
        totalWeightedScore += weightedScore;
        totalPercentage += percentage;
        
        if (score > 0) {
            breakdownHtml += `<span style="margin: 0 10px;">${percentage}% × ${score} = ${weightedScore.toFixed(1)}</span>`;
        }
    });
    
    const finalScoreElement = document.getElementById('finalScore');
    const breakdownElement = document.getElementById('detailedBreakdown');
    
    if (finalScoreElement) {
        finalScoreElement.textContent = totalWeightedScore.toFixed(2);
    }
    
    if (breakdownElement) {
        breakdownElement.innerHTML = breakdownHtml;
    }
}

// Submit Detailed Score
function submitDetailedScore() {
    const judgeId = document.getElementById('judge_id').value;
    const participantId = document.getElementById('participant_id').value;
    const competitionId = document.getElementById('competition_id').value;
    const generalComments = document.getElementById('general_comments').value;
    
    const scoreInputs = document.querySelectorAll('.criteria-score');
    const commentInputs = document.querySelectorAll('.criteria-comment');
    
    // Validate all scores are entered
    let allScoresEntered = true;
    const scores = [];
    
    scoreInputs.forEach(input => {
        const score = parseFloat(input.value);
        const criteriaId = input.getAttribute('data-criteria-id');
        const percentage = parseFloat(input.getAttribute('data-percentage'));
        
        if (isNaN(score) || score < 0) {
            allScoresEntered = false;
            return;
        }
        const commentTextarea = Array.from(commentInputs).find(textarea => 
            textarea.getAttribute('data-criteria-id') === criteriaId
        );
        const comments = commentTextarea ? commentTextarea.value : '';
        
        scores.push({
            criteria_id: criteriaId,
            score: score,
            percentage: percentage,
            comments: comments
        });
    });
    
    if (!allScoresEntered) {
        alert('Please enter scores for all criteria before submitting.');
        return;
    }
    
    if (scores.length === 0) {
        alert('No scoring criteria found. Please refresh and try again.');
        return;
    }
    
    // Submit detailed scores
    fetch('http://localhost:3002/submit-detailed-scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            judge_id: judgeId,
            participant_id: participantId,
            competition_id: competitionId,
            scores: scores,
            general_comments: generalComments
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Detailed score submitted successfully!\n\nFinal Score: ${data.total_score.toFixed(2)}/100\n\nYour detailed scoring and feedback has been saved.`);
            viewCompetitionParticipants(competitionId);
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting detailed score');
    });
}

// View Participant Score Breakdown
function viewParticipantScoreBreakdown(participantId, competitionId) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    // Get judge details and participant scores
    fetch('http://localhost:3002/judges')
    .then(response => response.json())
    .then(judges => {
        const currentJudge = judges.find(j => j.user_id === user.user_id);
        if (!currentJudge) return;

        // Load detailed scores for this participant
        fetch(`http://localhost:3002/participant-scores/${participantId}/${competitionId}`)
        .then(response => response.json())
        .then(allScores => {
            // Filter scores by current judge
            const judgeScores = allScores.filter(score => score.judge_id === currentJudge.judge_id);
            
            if (judgeScores.length === 0) {
                alert('No scores found for this participant.');
                return;
            }

            // Get participant info
            fetch(`http://localhost:3002/participant/${participantId}`)
            .then(response => response.json())
            .then(participant => {
                let breakdownHtml = `
                    <h2>📊 Score Breakdown</h2>
                    <h3 style="color: #800020;">Participant: ${participant.participant_name}</h3>
                    
                    <div class="dashboard-card" style="text-align: left; max-width: 800px; margin: 0 auto;">
                        <h4 style="color: #800020; margin-bottom: 20px;">Your Detailed Scoring</h4>
                        
                        <div style="display: grid; gap: 15px;">
                `;
                
                let totalWeightedScore = 0;
                judgeScores.forEach(score => {
                    totalWeightedScore += parseFloat(score.weighted_score);
                    
                    breakdownHtml += `
                        <div style="background: #f8f9fa; border-left: 5px solid #800020; padding: 15px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h5 style="color: #800020; margin: 0;">${score.criteria_name}</h5>
                                <div style="text-align: right;">
                                    <div style="font-size: 18px; font-weight: bold; color: #800020;">
                                        ${score.score} / ${score.max_score}
                                    </div>
                                    <div style="font-size: 12px; color: #666;">
                                        ${score.percentage}% weight = ${parseFloat(score.weighted_score).toFixed(1)} pts
                                    </div>
                                </div>
                            </div>
                            ${score.comments ? `
                                <div style="background: white; padding: 10px; border-radius: 5px; font-style: italic;">
                                    <strong>Your feedback:</strong> ${score.comments}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
                
                breakdownHtml += `
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 20px; border-radius: 12px; margin-top: 20px; text-align: center;">
                            <h3 style="margin: 0;">Final Weighted Score</h3>
                            <div style="font-size: 36px; font-weight: bold; margin: 10px 0;">
                                ${totalWeightedScore.toFixed(2)} / 100
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">← Back to Participants</button>
                        <button onclick="scoreParticipantDetailed(${participantId}, ${competitionId}, '${participant.participant_name.replace(/'/g, "\\'")}')" class="card-button" style="margin-left: 10px;">📝 Edit Score</button>
                    </div>
                `;
                
                document.getElementById("content").innerHTML = breakdownHtml;
            });
        })
        .catch(error => {
            console.error('Error loading score breakdown:', error);
            alert('Error loading score breakdown');
        });
    });
}

// Enhanced Scoring History
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
                <h2>📝 My Detailed Scoring History</h2>
                <div style="margin-bottom: 20px;">
                    <p>Review all your submitted detailed scores and feedback.</p>
                </div>
            `;

            if (competitions.length === 0) {
                historyHtml += '<p class="alert alert-warning">No competitions assigned yet.</p>';
                document.getElementById("content").innerHTML = historyHtml;
                return;
            }

            // Get detailed scores for each competition
            Promise.all(
                competitions.map(comp => 
                    fetch(`http://localhost:3002/detailed-scores/${comp.competition_id}`)
                    .then(r => r.json())
                    .then(scores => ({
                        competition: comp,
                        scores: scores.filter(s => s.judge_id === currentJudge.judge_id)
                    }))
                )
            )
            .then(competitionScores => {
                competitionScores.forEach(({ competition, scores }) => {
                    const eventIcon = competition.is_pageant ? '👑' : '🎪';
                    historyHtml += `
                        <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                            <h3>${competition.competition_name} ${eventIcon}</h3>
                            <p><strong>Event Type:</strong> ${competition.type_name} | <strong>Date:</strong> ${competition.competition_date}</p>
                            
                            ${scores.length === 0 ? 
                                '<p style="color: #666;">No detailed scores submitted yet for this competition.</p>' :
                                `<div style="margin-top: 15px;">
                                    <h4 style="color: #800020;">Participants Scored: ${[...new Set(scores.map(s => s.participant_id))].length}</h4>
                                    <div style="display: grid; gap: 10px; margin-top: 10px;">
                                        ${[...new Set(scores.map(s => s.participant_id))].map(participantId => {
                                            const participantScores = scores.filter(s => s.participant_id === participantId);
                                            const participant = participantScores[0];
                                            const totalScore = participantScores.reduce((sum, s) => sum + parseFloat(s.weighted_score), 0);
                                            
                                            return `
                                                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #800020;">
                                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                                        <div>
                                                            <strong>${participant.participant_name}</strong>
                                                            <div style="font-size: 12px; color: #666;">${participant.performance_title}</div>
                                                        </div>
                                                        <div style="text-align: right;">
                                                            <div style="font-size: 18px; font-weight: bold; color: #800020;">
                                                                ${totalScore.toFixed(2)}
                                                            </div>
                                                            <div style="font-size: 12px; color: #666;">
                                                                ${participantScores.length} criteria scored
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>`
                            }
                        </div>
                    `;
                });

                document.getElementById("content").innerHTML = historyHtml;
            })
            .catch(error => {
                console.error('Error fetching detailed scoring history:', error);
                document.getElementById("content").innerHTML = `
                    <h2>Scoring History</h2>
                    <p class="alert alert-error">Error loading detailed scoring history.</p>
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

// Show Profile (Enhanced)
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

        const eventIcon = currentJudge.is_pageant ? '👑' : '🎪';
        
        document.getElementById("content").innerHTML = `
            <h2>👤 My Judge Profile</h2>
            <div class="dashboard-card" style="text-align: left; max-width: 700px; margin: 0 auto;">
                <h3>⚖️ ${currentJudge.judge_name}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Contact Information</h4>
                        <p><strong>Email:</strong> ${currentJudge.email}</p>
                        <p><strong>Phone:</strong> ${currentJudge.phone || 'Not provided'}</p>
                        <p><strong>Username:</strong> ${currentJudge.username || 'Not set'}</p>
                        <p><strong>Experience:</strong> ${currentJudge.experience_years} years</p>
                    </div>
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Current Assignment</h4>
                        <p><strong>Competition:</strong> ${currentJudge.competition_name || 'Not assigned'}</p>
                        <p><strong>Event Type:</strong> ${currentJudge.type_name ? `${currentJudge.type_name} ${eventIcon}` : 'N/A'}</p>
                        <p><strong>Scoring System:</strong> Multi-Criteria Detailed Scoring</p>
                    </div>
                </div>
                
                <div style="margin-top: 25px;">
                    <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Areas of Expertise</h4>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        ${currentJudge.expertise || 'No expertise specified'}
                    </div>
                </div>
                
                <div style="margin-top: 25px;">
                    <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Credentials & Qualifications</h4>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        ${currentJudge.credentials || 'No credentials provided'}
                    </div>
                </div>
                
                <div style="margin-top: 30px; text-align: center; padding: 20px; background: #e7f3ff; border-radius: 8px;">
                    <h4 style="color: #0d47a1; margin-bottom: 10px;">📝 Enhanced Scoring Features</h4>
                    <p style="color: #1976d2; line-height: 1.6;">
                        You can now provide detailed scoring across multiple criteria with specific percentage weights. 
                        Each score contributes to a comprehensive evaluation with detailed feedback capabilities.
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="showDashboard()" class="card-button">← Back to Dashboard</button>
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