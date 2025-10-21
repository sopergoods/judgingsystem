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
let lockTimer = null;
let lockCountdown = 10;
let currentScoreData = null;

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
                    <h3> My Competitions</h3>
                    <p>View competitions assigned to you</p>
                    <button onclick="showMyCompetitions()" class="card-button">View Assignments</button>
                </div>
                <div class="dashboard-card">
    <h3> Unlock Requests</h3>
    <p>View status of your unlock requests</p>
    <button onclick="viewMyUnlockRequests()" class="card-button">View Requests</button>
</div>
                <div class="dashboard-card">
                    <h3> Score Participants</h3>
                    <p>Rate and score participant performances</p>
                    <button onclick="showMyCompetitions()" class="card-button">Start Scoring</button>
                </div>
                
                <div class="dashboard-card">
                    <h3> Scoring History</h3>
                    <p>Review your previous scores and comments</p>
                    <button onclick="showScoringHistory()" class="card-button">View History</button>
                </div>
                
                <div class="dashboard-card">
                    <h3> My Profile</h3>
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

    fetch('https://mseufci-judgingsystem.up.railway.app/judges')
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

        fetch(`https://mseufci-judgingsystem.up.railway.app/judge-competitions/${currentJudge.judge_id}`)
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
    fetch(`https://mseufci-judgingsystem.up.railway.app/participants/${competitionId}`)
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
// ================================================
// ADD TO judge-app.js
// Check if score is locked before allowing scoring
// ================================================

// REPLACE the scoreParticipant function (around line 180-220)
function scoreParticipant(participantId, competitionId, participantName) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch('https://mseufci-judgingsystem.up.railway.app/judges')
    .then(response => response.json())
    .then(judges => {
        const currentJudge = judges.find(j => j.user_id === user.user_id);
        if (!currentJudge) {
            showNotification('Judge profile not found', 'error');
            return;
        }

        // ✅ CHECK IF ALREADY SCORED AND LOCKED
        checkIfScoreLocked(currentJudge.judge_id, participantId, competitionId, null, (isLocked, lockInfo) => {
            if (isLocked) {
                // Score is locked - show unlock request option
                showLockedScoreMessage(currentJudge.judge_id, participantId, competitionId, null, participantName, lockInfo);
                return;
            }
            
            // Not locked - proceed with normal scoring flow
            fetch(`https://mseufci-judgingsystem.up.railway.app/participant/${participantId}`)
            .then(response => response.json())
            .then(participant => {
                fetch(`https://mseufci-judgingsystem.up.railway.app/competition/${competitionId}`)
                .then(response => response.json())
                .then(competition => {
                    if (competition.is_pageant) {
                        showSegmentSelection(currentJudge.judge_id, participantId, competitionId, participantName);
                    } else {
                        showRegularScoringWithPhoto(currentJudge.judge_id, participantId, competitionId, participantName, participant);
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
    });
}

// ✅ NEW FUNCTION: Check if score is locked
function checkIfScoreLocked(judgeId, participantId, competitionId, segmentId, callback) {
    let url = `https://mseufci-judgingsystem.up.railway.app/check-score-lock/${judgeId}/${participantId}/${competitionId}`;
    
    if (segmentId) {
        url += `/${segmentId}`;
    }
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log('Lock check result:', data);
        
        // If locked and past edit window (45 seconds)
        if (data.is_locked && data.seconds_since_lock > 10) {
            callback(true, data);
        } else {
            callback(false, data);
        }
    })
    .catch(error => {
        console.error('Error checking lock:', error);
        // If error, allow scoring (fail-open)
        callback(false, null);
    });
}

// ✅ NEW FUNCTION: Show locked score message
function showLockedScoreMessage(judgeId, participantId, competitionId, segmentId, participantName, lockInfo) {
    const minutesLocked = Math.floor(lockInfo.seconds_since_lock / 60);
    
    document.getElementById("content").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 80px; margin-bottom: 20px;">🔒</div>
            <h2>Score Already Submitted & Locked</h2>
            <h3 style="color: #800020;">${participantName}</h3>
            
            <div style="max-width: 600px; margin: 30px auto; padding: 20px; background: #fff3cd; border-radius: 8px; border: 2px solid #ffc107;">
                <p style="font-size: 16px; margin-bottom: 15px;">
                    ✅ You submitted a score for this participant <strong>${minutesLocked} minutes ago</strong>
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
                <button onclick="requestUnlock(${judgeId}, ${participantId}, ${competitionId}, ${segmentId}, '${participantName.replace(/'/g, "\\'")}', '${segmentId ? 'segment' : 'overall'}')" 
                        class="card-button" 
                        style="font-size: 16px; padding: 15px 30px;">
                    📨 Request Unlock from Admin
                </button>
            </div>
            
            <div style="margin-top: 30px;">
                <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">
                    ← Back to Participants
                </button>
            </div>
        </div>
    `;
}

// ✅ UPDATE: Also check lock status for segment scoring
function showSegmentScoring(judgeId, participantId, competitionId, segmentId, participantName, segmentName) {
    console.log('Loading segment-specific criteria...');
    
    // ✅ CHECK IF THIS SEGMENT IS LOCKED
    checkIfScoreLocked(judgeId, participantId, competitionId, segmentId, (isLocked, lockInfo) => {
        if (isLocked) {
            showLockedScoreMessage(judgeId, participantId, competitionId, segmentId, `${participantName} - ${segmentName}`, lockInfo);
            return;
        }
        
        // Not locked - proceed with normal scoring
        Promise.all([
            fetch(`https://mseufci-judgingsystem.up.railway.app/participant/${participantId}`).then(r => r.json()),
            fetch(`https://mseufci-judgingsystem.up.railway.app/segment-criteria/${segmentId}`).then(r => r.json())
        ])
        .then(([participant, criteria]) => {
            if (criteria.length === 0) {
                showNotification('No criteria configured for this segment', 'error');
                return;
            }
            displaySegmentScoringFormWithPhoto(judgeId, participantId, competitionId, segmentId, participantName, segmentName, criteria, participant);
        })
        .catch(error => {
            console.error('Error loading criteria:', error);
            showNotification('Error loading scoring criteria', 'error');
        });
    });
}

console.log('Lock checking added to scoring functions');


function showRegularScoringWithPhoto(judgeId, participantId, competitionId, participantName, participant) {
    fetch(`https://mseufci-judgingsystem.up.railway.app/competition-criteria/${competitionId}`)
    .then(response => response.json())
    .then(criteria => {
        if (criteria.length === 0) {
            showNotification('No criteria configured for this competition', 'error');
            return;
        }

        let scoreForm = `
            <h2>Score Participant: ${participantName}</h2>
            <div style="margin-bottom: 20px;">
                <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Back to Participants</button>
            </div>
            
            ${participant.photo_url ? `
                <div style="text-align: center; margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #fff0f5 0%, #ffe4e9 100%); border-radius: 12px; border: 3px solid #ff69b4;">
                    <div style="display: inline-block; position: relative;">
                        ${participant.contestant_number ? `
                            <div style="position: absolute; top: 10px; left: 10px; background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-size: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); z-index: 10;">
                                #${participant.contestant_number}
                            </div>
                        ` : ''}
                        <img src="${participant.photo_url}" 
                             alt="${participantName}" 
                             style="max-width: 350px; max-height: 450px; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); border: 4px solid white;"
                             onerror="this.src='https://via.placeholder.com/350x450/800020/ffffff?text=Photo+Not+Available'; this.style.opacity='0.6';">
                    </div>
                </div>
            ` : ''}
            
            <form id="detailedScoreForm" class="dashboard-card" style="max-width: 900px; margin: 0 auto; text-align: left;">
                <h3 style="color: #800020; margin-bottom: 20px;">Score Each Criterion</h3>
                
                <div id="criteriaScores">
        `;

        criteria.forEach((criterion, index) => {
            scoreForm += `
                <div class="criterion-item" style="margin-bottom: 25px; background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #800020;">
                    <h4 style="color: #800020; margin-bottom: 10px;">
                        ${index + 1}. ${criterion.criteria_name} (${criterion.percentage}%)
                    </h4>
                    <p style="color: #666; margin-bottom: 15px; font-size: 14px;">
                        ${criterion.description || 'Score this criterion'}
                    </p>
                    
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
                           oninput="calculateTotalScore()"
                           style="width: 200px; padding: 12px; font-size: 18px; text-align: center; font-weight: bold; border: 2px solid #ddd; border-radius: 8px;">
                </div>
            `;
        });

        scoreForm += `
                </div>
                
                <div id="totalScoreDisplay" style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(128, 0, 32, 0.3);">
                    <h3 style="margin: 0 0 10px 0; font-size: 18px;">Total Weighted Score</h3>
                    <div style="font-size: 3.5em; font-weight: bold; margin: 15px 0;" id="totalScore">0.00</div>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">out of 100 points</p>
                </div>
                
                <label for="general_comments" style="display: block; margin-top: 20px; font-weight: 600; color: #800020; font-size: 16px;">General Comments:</label>
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

        document.getElementById("content").innerHTML = scoreForm;

        // ✅ Load draft and add auto-save
        setTimeout(() => {
            loadRegularDraft(judgeId, participantId, competitionId);
            
            const allInputs = document.querySelectorAll('#detailedScoreForm input, #detailedScoreForm textarea');
            allInputs.forEach(input => {
                input.addEventListener('input', () => {
                    autoSaveRegularDraft(judgeId, participantId, competitionId);
                });
            });
        }, 500);

        // ✅ Form submission with lock countdown
        document.getElementById("detailedScoreForm").onsubmit = function(event) {
            event.preventDefault();

            const scores = [];
            let totalWeightedScore = 0;
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

                const weightedScore = (score * percentage) / 100;
                totalWeightedScore += weightedScore;

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

            fetch('https://mseufci-judgingsystem.up.railway.app/submit-detailed-scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Scores submitted successfully!', 'success');
                    
                    // ✅ START COUNTDOWN
                    console.log('🔒 Starting countdown for regular scoring');
                    startLockCountdown(judgeId, participantId, competitionId, null, 'overall');
                    
                    // ✅ Clear draft
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
        };
    })
    .catch(error => {
        console.error('Error loading criteria:', error);
        showNotification('Error loading criteria', 'error');
    });
}

// ✅ ADD these NEW functions for regular draft support in judge-app.js:



function saveRegularDraftToServer(judgeId, participantId, competitionId) {
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
    
    // Save to localStorage
    const draftKey = `regular_draft_${judgeId}_${participantId}_${competitionId}`;
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    
    showDraftStatus('✅ Draft saved', 'success');
    setTimeout(() => hideDraftStatus(), 3000);
}

function loadRegularDraft(judgeId, participantId, competitionId) {
    const draftKey = `regular_draft_${judgeId}_${participantId}_${competitionId}`;
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
            
            calculateTotalScore();
            showNotification(' Draft loaded', 'info');
        }
    }
}

function clearRegularDraft(judgeId, participantId, competitionId) {
    const draftKey = `regular_draft_${judgeId}_${participantId}_${competitionId}`; // ✅ Fixed: was "competationId"
    localStorage.removeItem(draftKey);
}

// ✅ ADD these NEW functions for regular draft support in judge-app.js:

function autoSaveRegularDraft(judgeId, participantId, competitionId) {
    clearTimeout(window.regularDraftTimeout);
    
    showDraftStatus('Saving draft...', 'saving');
    
    window.regularDraftTimeout = setTimeout(() => {
        saveRegularDraftToServer(judgeId, participantId, competitionId);
    }, 2000);
}

function saveRegularDraftToServer(judgeId, participantId, competitionId) {
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
    
    // Save to localStorage
    const draftKey = `regular_draft_${judgeId}_${participantId}_${competitionId}`;
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    
    showDraftStatus('✅ Draft saved', 'success');
    setTimeout(() => hideDraftStatus(), 3000);
}

function loadRegularDraft(judgeId, participantId, competitionId) {
    const draftKey = `regular_draft_${judgeId}_${participantId}_${competitionId}`;
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
            
            calculateTotalScore();
            showNotification(' Draft loaded', 'info');
        }
    }
}

function clearRegularDraft(judgeId, participantId, competitionId) {
    const draftKey = `regular_draft_${judgeId}_${participantId}_${competitionId}`; // ✅ Fixed: was "competationId"
    localStorage.removeItem(draftKey);
}

// ==========================================
// 6. PAGEANT SEGMENT SELECTION
// ==========================================
function showSegmentSelection(judgeId, participantId, competitionId, participantName) {
    console.log('Showing segment selection...'); // Debug
    
     if (window.currentScoreData) {
        console.log('⚠️ Active countdown detected, preserving it...');
        // Don't interrupt the countdown
    }

    document.getElementById("content").innerHTML = `
        <h2>👑 Pageant Scoring - Select Segment</h2>
        <h3 style="color: #800020;">Participant: ${participantName}</h3>
        
        <div style="margin-bottom: 20px;">
            <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">← Back to Participants</button>
        </div>
        
        <div class="alert alert-info">
            <strong> Multi-Segment Pageant Scoring:</strong>
            <p>This pageant has multiple segments (days). Select which segment you want to score for this participant.</p>
        </div>
        
        <div id="segmentsList">
            <div class="loading">Loading pageant segments...</div>
        </div>
    `;

    fetch(`https://mseufci-judgingsystem.up.railway.app/pageant-segments/${competitionId}`)
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
    console.log('Loading segment-specific criteria...');
    
    // ✅ CHECK IF THIS SEGMENT IS LOCKED FIRST
    checkIfScoreLocked(judgeId, participantId, competitionId, segmentId, (isLocked, lockInfo) => {
        if (isLocked) {
            showLockedScoreMessage(judgeId, participantId, competitionId, segmentId, `${participantName} - ${segmentName}`, lockInfo);
            return;
        }
        
        // Not locked - proceed with loading criteria and form
        Promise.all([
            fetch(`https://mseufci-judgingsystem.up.railway.app/participant/${participantId}`).then(r => r.json()),
            fetch(`https://mseufci-judgingsystem.up.railway.app/segment-criteria/${segmentId}`).then(r => r.json())
        ])
        .then(([participant, criteria]) => {
            console.log('Participant:', participant);
            console.log('Segment criteria loaded:', criteria);
            
            if (criteria.length === 0) {
                showNotification('No criteria configured for this segment', 'error');
                return;
            }

            displaySegmentScoringFormWithPhoto(judgeId, participantId, competitionId, segmentId, participantName, segmentName, criteria, participant);
        })
        .catch(error => {
            console.error('Error loading criteria:', error);
            showNotification('Error loading scoring criteria', 'error');
        });
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
    setTimeout(() => {
        loadDraft(judgeId, participantId, segmentId);
        
        // Add auto-save to all input fields
        const allInputs = document.querySelectorAll('#segmentScoreForm input, #segmentScoreForm textarea');
        allInputs.forEach(input => {
            input.addEventListener('input', () => {
                autoSaveDraft(judgeId, participantId, segmentId);
            });
        });
    }, 500);
    

    document.getElementById("content").innerHTML = formHtml;



}
function displaySegmentScoringFormWithPhoto(judgeId, participantId, competitionId, segmentId, participantName, segmentName, criteria, participant) {
    let formHtml = `
        <h2>Score Segment: ${segmentName}</h2>
        <h3 style="color: #800020;">Participant: ${participantName}</h3>
        
        <div style="margin-bottom: 20px;">
            <button onclick="showSegmentSelection(${judgeId}, ${participantId}, ${competitionId}, '${participantName.replace(/'/g, "\\'")}')" class="secondary">Back to Segment Selection</button>
        </div>
        
        ${participant.photo_url ? `
            <div style="text-align: center; margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #fff0f5 0%, #ffe4e9 100%); border-radius: 12px; border: 3px solid #ff69b4;">
                <div style="display: inline-block; position: relative;">
                    ${participant.contestant_number ? `
                        <div style="position: absolute; top: 10px; left: 10px; background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-size: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); z-index: 10;">
                            #${participant.contestant_number}
                        </div>
                    ` : ''}
                    <img src="${participant.photo_url}" 
                         alt="${participantName}" 
                         style="max-width: 350px; max-height: 450px; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); border: 4px solid white;"
                         onerror="this.src='https://via.placeholder.com/350x450/800020/ffffff?text=Photo+Not+Available'; this.style.opacity='0.6';">
                </div>
                <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 10px; display: inline-block; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <p style="font-weight: 600; color: #800020; font-size: 20px; margin: 0;">
                        ${participant.contestant_number ? `Contestant #${participant.contestant_number}` : 'Contestant'} 
                    </p>
                    <p style="font-size: 18px; color: #666; margin: 5px 0 0 0;">${participantName}</p>
                </div>
            </div>
        ` : `
            <div style="text-align: center; margin: 20px 0; padding: 30px; background: #fff3cd; border-radius: 12px; border: 2px solid #ffc107;">
                <p style="font-size: 18px; color: #856404;">
                    ${participant.contestant_number ? `Contestant #${participant.contestant_number} - ` : ''}${participantName}
                </p>
                <small style="color: #666;">No photo available</small>
            </div>
        `}
        
        <form id="segmentScoreForm" class="dashboard-card" style="max-width: 900px; margin: 0 auto; text-align: left;">
            <div class="alert alert-info">
                <strong>Scoring Instructions:</strong>
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
                
                <div style="display: grid; grid-template-columns: 200px; gap: 20px; align-items: center;">
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
                <strong>How Scoring Works:</strong>
                <ul style="margin-top: 10px; color: #1976d2;">
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
                <button type="button" onclick="showSegmentSelection(${judgeId}, ${participantId}, ${competitionId}, '${participantName.replace(/'/g, "\\'")}')" class="secondary" style="margin-left: 15px; padding: 18px 35px; font-size: 16px;">
                    Cancel
                </button>
            </div>
        </form>
    `;

    document.getElementById("content").innerHTML = formHtml;

    // Form submission
  // Form submission - INSIDE displaySegmentScoringFormWithPhoto function
document.getElementById("segmentScoreForm").onsubmit = function(event) {
    event.preventDefault();

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
        console.error('Form validation failed');
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

    console.log('📤 Submitting segment scores:', submissionData);

    fetch('https://mseufci-judgingsystem.up.railway.app/submit-segment-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('📥 Response data:', data);
        
        if (data.success) {
            showNotification(`✅ Segment "${segmentName}" scored successfully! Total: ${totalWeightedScore.toFixed(2)}/100`, 'success');
            
            // ✅ START LOCK COUNTDOWN HERE (CRITICAL FIX)
            if (data.should_start_countdown) {
                console.log('🔒 Starting lock countdown for segment score...');
                startLockCountdown(judgeId, participantId, competitionId, segmentId, 'segment');
            }
            
            // Delay navigation to allow countdown to start
            setTimeout(() => {
                showSegmentSelection(judgeId, participantId, competitionId, participantName);
            }, 2000);
        } else {
            console.error('Submission failed:', data);
            showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('❌ Fetch error:', error);
        showNotification('Error submitting segment scores: ' + error.message, 'error');
    });
};

    
    setTimeout(() => {
        loadDraft(judgeId, participantId, segmentId);
        
        const allInputs = document.querySelectorAll('#segmentScoreForm input, #segmentScoreForm textarea');
        allInputs.forEach(input => {
            input.addEventListener('input', () => {
                autoSaveDraft(judgeId, participantId, segmentId);
            });
        });
    }, 500);
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
    fetch(`https://mseufci-judgingsystem.up.railway.app/competition-criteria/${competitionId}`)
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
    // First fetch participant details to get photo
    fetch(`https://mseufci-judgingsystem.up.railway.app/participant/${participantId}`)
    .then(response => response.json())
    .then(participant => {
        let scoreForm = `
            <h2>Score Participant: ${participantName}</h2>
            <div style="margin-bottom: 20px;">
                <button onclick="viewCompetitionParticipants(${competitionId})" class="secondary">Back to Participants</button>
            </div>
            
            ${participant.photo_url ? `
                <div style="text-align: center; margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #fff0f5 0%, #ffe4e9 100%); border-radius: 12px; border: 3px solid #ff69b4;">
                    <div style="display: inline-block; position: relative;">
                        ${participant.contestant_number ? `
                            <div style="position: absolute; top: 10px; left: 10px; background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-size: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); z-index: 10;">
                                #${participant.contestant_number}
                            </div>
                        ` : ''}
                        <img src="${participant.photo_url}" 
                             alt="${participantName}" 
                             style="max-width: 350px; max-height: 450px; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); border: 4px solid white;"
                             onerror="this.src='https://via.placeholder.com/350x450/800020/ffffff?text=Photo+Not+Available'; this.style.opacity='0.6';">
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 10px; display: inline-block; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <p style="font-weight: 600; color: #800020; font-size: 20px; margin: 0;">
                            ${participant.contestant_number ? `Contestant #${participant.contestant_number}` : 'Contestant'} 
                        </p>
                        <p style="font-size: 18px; color: #666; margin: 5px 0 0 0;">${participantName}</p>
                    </div>
                </div>
            ` : `
                <div style="text-align: center; margin: 20px 0; padding: 30px; background: #fff3cd; border-radius: 12px; border: 2px solid #ffc107;">
                    <p style="font-size: 18px; color: #856404;">
                        ${participant.contestant_number ? `Contestant #${participant.contestant_number} - ` : ''}${participantName}
                    </p>
                    <small style="color: #666;">No photo available</small>
                </div>
            `}
            
            <form id="detailedScoreForm" class="dashboard-card" style="max-width: 800px; margin: 0 auto; text-align: left;">
                <h3 style="color: #800020; margin-bottom: 20px;">Detailed Criteria Scoring</h3>
                
                <div class="alert alert-info">
                    <strong>Scoring Instructions:</strong>
                    <p>Rate each criterion from 0 to 100. Your scores will be weighted automatically based on percentages.</p>
                </div>
                
                <div id="criteriaScores">
        `;

        criteria.forEach((criterion, index) => {
            scoreForm += `
                <div class="criterion-item" style="margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #800020;">
                    <h4>${index + 1}. ${criterion.criteria_name} (${criterion.percentage}%)</h4>
                    <p style="color: #666; font-size: 14px;">${criterion.description || 'Score this criterion based on the performance'}</p>
                    
                    <label for="score_${criterion.criteria_id}">Score (0-${criterion.max_score}):</label>
                    <input type="number" id="score_${criterion.criteria_id}" 
                           data-criteria-id="${criterion.criteria_id}"
                           data-percentage="${criterion.percentage}"
                           data-max-score="${criterion.max_score}"
                           min="0" max="${criterion.max_score}" step="0.1" required
                           oninput="calculateTotalScore()"
                           style="width: 200px; padding: 12px; font-size: 18px; text-align: center; font-weight: bold; border: 2px solid #ddd; border-radius: 8px;">
                </div>
            `;
        });

        scoreForm += `
                </div>
                
                <div id="totalScoreDisplay" style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(128, 0, 32, 0.3);">
                    <h3 style="margin: 0 0 10px 0; font-size: 18px;">Total Weighted Score</h3>
                    <div style="font-size: 3.5em; font-weight: bold; margin: 15px 0;" id="totalScore">0.00</div>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">out of 100 points</p>
                </div>
                
                <label for="general_comments">General Comments:</label>
                <textarea id="general_comments" rows="3" placeholder="Overall feedback and comments..."></textarea>
                
                <div style="margin-top: 20px; text-align: center;">
                    <input type="submit" value="Submit Scores" style="padding: 15px 40px; font-size: 16px;">
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
                const comments = null; // Removed individual comments
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

            fetch('https://mseufci-judgingsystem.up.railway.app/submit-detailed-scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            })
            .then(response => response.json())
   .then(data => {
    console.log('📥 Response data:', data);
    
    if (data.success) {
        showNotification(`✅ Segment "${segmentName}" scored successfully! Total: ${totalWeightedScore.toFixed(2)}/100`, 'success');
        
        // ✅ ALWAYS START COUNTDOWN FOR SEGMENT SCORES
        console.log('🔒 Starting lock countdown for segment score...');
        startLockCountdown(judgeId, participantId, competitionId, segmentId, 'segment');
        
        // Clear draft
        clearDraft(judgeId, participantId, segmentId);
        
        // Delay navigation
        setTimeout(() => {
            showSegmentSelection(judgeId, participantId, competitionId, participantName);
        }, 2000);
    } else {
        console.error('Submission failed:', data);
        showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
    }
})
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error submitting scores', 'error');
            });
        };
    })
    .catch(error => {
        console.error('Error loading participant:', error);
        showNotification('Error loading participant details', 'error');
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
// Notification System
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

console.log('✅ FIXED: Lock Countdown System Loaded');

// ==========================================
// 9. SCORING HISTORY
// ==========================================
function showScoringHistory() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch('https://mseufci-judgingsystem.up.railway.app/judges')
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

        fetch(`https://mseufci-judgingsystem.up.railway.app/judge-competitions/${currentJudge.judge_id}`)
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
                        fetch(`https://mseufci-judgingsystem.up.railway.app/overall-scores/${comp.competition_id}`).then(r => r.json()),
                        fetch(`https://mseufci-judgingsystem.up.railway.app/detailed-scores/${comp.competition_id}`).then(r => r.json()).catch(() => [])
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

    fetch('https://mseufci-judgingsystem.up.railway.app/judges')
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
    fetch('https://mseufci-judgingsystem.up.railway.app/competitions', { method: 'HEAD' })
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

// ==========================================
// DRAFT AUTO-SAVE FUNCTIONALITY
// ==========================================

let draftSaveTimeout;
let lastDraftSave = null;

// Auto-save draft scores as judge types
function autoSaveDraft(judgeId, participantId, segmentId) {
    // Clear previous timeout
    clearTimeout(draftSaveTimeout);
    
    // Show saving indicator
    showDraftStatus('Saving draft...', 'saving');
    
    // Wait 2 seconds after user stops typing
    draftSaveTimeout = setTimeout(() => {
        saveDraftToServer(judgeId, participantId, segmentId);
    }, 2000);
}

// Save draft to server via AJAX
function saveDraftToServer(judgeId, participantId, segmentId) {
    const criteriaInputs = document.querySelectorAll('[data-criteria-id]');
    const draftScores = [];
    
    criteriaInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const criteriaId = input.getAttribute('data-criteria-id');
        const percentage = parseFloat(input.getAttribute('data-percentage')) || 0;
        const comments = document.getElementById(`comments_${criteriaId}`)?.value || '';
        
        draftScores.push({
            criteria_id: criteriaId,
            score: score,
            weighted_score: (score * percentage) / 100,
            comments: comments
        });
    });
    
    const generalComments = document.getElementById('general_comments')?.value || '';
    const totalScore = calculateCurrentTotal();
    
    const draftData = {
        judge_id: judgeId,
        participant_id: participantId,
        segment_id: segmentId,
        scores: draftScores,
        general_comments: generalComments,
        total_score: totalScore,
        is_draft: true,
        saved_at: new Date().toISOString()
    };
    
    // Save to localStorage (instant backup)
    const draftKey = `draft_${judgeId}_${participantId}_${segmentId}`;
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    
    // Save to server via AJAX
    fetch('https://mseufci-judgingsystem.up.railway.app/save-draft-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            lastDraftSave = new Date();
            showDraftStatus('✅ Draft saved', 'success');
            setTimeout(() => hideDraftStatus(), 3000);
        } else {
            showDraftStatus('⚠️ Save failed (using local backup)', 'warning');
        }
    })
    .catch(error => {
        console.error('Draft save error:', error);
        showDraftStatus('⚠️ Offline - saved locally', 'warning');
    });
}

// Calculate current total score
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

// Show draft save status indicator
function showDraftStatus(message, type) {
    let indicator = document.getElementById('draft-status-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'draft-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 9999;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        `;
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

// Load draft from server or localStorage
function loadDraft(judgeId, participantId, segmentId) {
    const draftKey = `draft_${judgeId}_${participantId}_${segmentId}`;
    
    // Try server first
    fetch(`https://mseufci-judgingsystem.up.railway.app/get-draft-scores/${judgeId}/${participantId}/${segmentId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success && data.draft) {
            applyDraftToForm(data.draft);
            showNotification(' Draft loaded from server', 'info');
        } else {
            // Fallback to localStorage
            const localDraft = localStorage.getItem(draftKey);
            if (localDraft) {
                applyDraftToForm(JSON.parse(localDraft));
                showNotification(' Draft loaded from local backup', 'info');
            }
        }
    })
    .catch(error => {
        console.error('Error loading draft:', error);
        // Fallback to localStorage
        const localDraft = localStorage.getItem(draftKey);
        if (localDraft) {
            applyDraftToForm(JSON.parse(localDraft));
            showNotification(' Draft loaded from local backup', 'warning');
        }
    });
}

// Apply draft data to form
function applyDraftToForm(draft) {
    if (!draft || !draft.scores) return;
    
    draft.scores.forEach(score => {
        const input = document.getElementById(`score_${score.criteria_id}`);
        if (input) {
            input.value = score.score;
        }
        
        const commentsField = document.getElementById(`comments_${score.criteria_id}`);
        if (commentsField && score.comments) {
            commentsField.value = score.comments;
        }
    });
    
    const generalComments = document.getElementById('general_comments');
    if (generalComments && draft.general_comments) {
        generalComments.value = draft.general_comments;
    }
    
    // Recalculate total
    calculateSegmentTotalScore();
}

// Clear draft after successful submission
function clearDraft(judgeId, participantId, segmentId) {
    const draftKey = `draft_${judgeId}_${participantId}_${segmentId}`;
    localStorage.removeItem(draftKey);
    
    fetch(`https://mseufci-judgingsystem.up.railway.app/delete-draft-scores/${judgeId}/${participantId}/${segmentId}`, {
        method: 'DELETE'
    }).catch(err => console.error('Error deleting draft:', err));
}
// ==========================================
// SCORE LOCKING FUNCTIONS
// ==========================================

// Start lock countdown after score submission
function startLockCountdown(judgeId, participantId, competitionId, segmentId, scoreType) {
    console.log('⏱️ Starting lock countdown:', { judgeId, participantId, competitionId, segmentId, scoreType });
    
    // Clear any existing timer
    if (lockTimer) {
        clearInterval(lockTimer);
    }
    
    lockCountdown = 10;
    currentScoreData = { judgeId, participantId, competitionId, segmentId, scoreType };
    
    // Show countdown UI
    showLockCountdown();
    
    // Start countdown
    lockTimer = setInterval(() => {
        lockCountdown--;
        updateLockCountdown();
        
        if (lockCountdown <= 0) {
            clearInterval(lockTimer);
            autoLockScore();
        }
    }, 1000);
}

// Show countdown timer UI
function showLockCountdown() {
    let countdownDiv = document.getElementById('lock-countdown');
    
    if (!countdownDiv) {
        countdownDiv = document.createElement('div');
        countdownDiv.id = 'lock-countdown';
        countdownDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 9999;
            font-weight: bold;
            text-align: center;
            min-width: 200px;
        `;
        document.body.appendChild(countdownDiv);
    }
    
    countdownDiv.innerHTML = `
        <div style="font-size: 14px; margin-bottom: 5px;">⏱️ Edit Window</div>
        <div style="font-size: 28px;" id="countdown-number">${lockCountdown}</div>
        <div style="font-size: 12px; margin-top: 5px;">seconds remaining</div>
    `;
    countdownDiv.style.display = 'block';
}

// ==========================================
// FIXED: Update countdown display
// ==========================================
function updateLockCountdown() {
    const countdownNumber = document.getElementById('countdown-number');
    const countdownDiv = document.getElementById('lock-countdown');
    
    if (countdownNumber && countdownDiv) {
        countdownNumber.textContent = lockCountdown;
        
        // Change color as time runs out
        if (lockCountdown <= 10) {
            countdownDiv.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            countdownNumber.style.animation = 'pulse 0.5s ease-in-out';
        } else if (lockCountdown <= 20) {
            countdownDiv.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        }
    }
}

// Update countdown display
function updateLockCountdown() {
    const countdownNumber = document.getElementById('countdown-number');
    const countdownDiv = document.getElementById('lock-countdown');
    
    if (countdownNumber) {
        countdownNumber.textContent = lockCountdown;
        
        // Change color as time runs out
        if (lockCountdown <= 10) {
            countdownDiv.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            countdownNumber.style.animation = 'pulse 0.5s ease-in-out';
        } else if (lockCountdown <= 20) {
            countdownDiv.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        }
    }
}

// Auto-lock score after countdown
function autoLockScore() {
    if (!currentScoreData) {
        console.warn('No score data to lock');
        return;
    }
    
    console.log('🔒 Auto-locking score:', currentScoreData);
    
    const countdownDiv = document.getElementById('lock-countdown');
    if (countdownDiv) {
        countdownDiv.innerHTML = `
            <div style="font-size: 14px;">🔒 Locking Score...</div>
        `;
    }
    
    fetch('https://mseufci-judgingsystem.up.railway.app/auto-lock-score', {
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
        console.log('✅ Lock response:', data);
        if (data.success) {
            if (countdownDiv) {
                countdownDiv.innerHTML = `
                    <div style="font-size: 14px;">🔒 Score Locked</div>
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
        console.error('❌ Auto-lock error:', error);
        if (countdownDiv) {
            countdownDiv.innerHTML = `
                <div style="font-size: 14px;">⚠️ Lock Failed</div>
                <div style="font-size: 12px; margin-top: 5px;">Please refresh page</div>
            `;
        }
    });
    
    currentScoreData = null;
}

// Cancel lock countdown (if judge leaves page)
function cancelLockCountdown() {
    if (lockTimer) {
        clearInterval(lockTimer);
        lockTimer = null;
    }
    
    const countdownDiv = document.getElementById('lock-countdown');
    if (countdownDiv) {
        countdownDiv.style.display = 'none';
    }
}

// Request unlock from admin
function requestUnlock(judgeId, participantId, competitionId, segmentId, participantName, scoreType) {
    const reason = prompt(`Request unlock for ${participantName}?\n\nPlease explain why you need to edit this score:`);
    
    if (!reason || reason.trim() === '') {
        showNotification('Unlock request cancelled - reason required', 'warning');
        return;
    }
    
    fetch('https://mseufci-judgingsystem.up.railway.app/request-unlock', {
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

// View my unlock requests
function viewMyUnlockRequests() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user) return;

    fetch('https://mseufci-judgingsystem.up.railway.app/judges')
    .then(response => response.json())
    .then(judges => {
        const currentJudge = judges.find(j => j.user_id === user.user_id);
        if (!currentJudge) {
            showNotification('Judge profile not found', 'error');
            return;
        }

        fetch(`https://mseufci-judgingsystem.up.railway.app/unlock-requests/judge/${currentJudge.judge_id}`)
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

// Display unlock requests
function displayUnlockRequests(requests) {
    let html = `
        <h2> My Unlock Requests</h2>
        
        <div style="margin-bottom: 20px;">
            <button onclick="showMyCompetitions()" class="secondary">← Back to Competitions</button>
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
            const statusIcon = request.status === 'approved' ? '✅' : 
                             request.status === 'rejected' ? '❌' : '⏳';
            
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

console.log('✅ Score Locking Functions Added to Judge Dashboard');
setInterval(checkConnectionSpeed, 10000);
checkConnectionSpeed();

// ==========================================
// END OF JUDGE DASHBOARD
// ==========================================
console.log('✅ Complete Judge Dashboard Loaded Successfully - With Pageant Segments Support');