// Enhanced Staff Dashboard JavaScript with Pageant Support and New Features

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

// Check if user is authenticated and has staff role
function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update header to show staff info
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

// Enhanced Dashboard
function showDashboard() {
    document.getElementById("content").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2> WELCOME!</h2>
           <h2> Staff Dashboard</h2>
           
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 30px;">
                <div class="dashboard-card">
                    <h3> Event Types</h3>
                    <p>View available competition categories</p>
                    <button onclick="showEventTypes()" class="card-button">View Event Types</button>
                </div>
                
                <div class="dashboard-card">
                    <h3> Competitions</h3>
                    <p>View active competitions and details</p>
                    <button onclick="showViewCompetitions()" class="card-button">View Competitions</button>
                </div>
                
                <div class="dashboard-card">
                    <h3> Participants</h3>
                    <p>Register and manage all participants</p>
                    <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                    <button onclick="showViewParticipants()" class="card-button">Manage All</button>
                </div>
                
                <div class="dashboard-card">
                    <h3> Judges</h3>
                    <p>View judge assignments and expertise</p>
                    <button onclick="showViewJudges()" class="card-button">View Judges</button>
                </div>
                
                <div class="dashboard-card">
                    <h3> Enhanced Reports</h3>
                    <p>Generate detailed reports and analytics</p>
                    <button onclick="showReports()" class="card-button">View Reports</button>
                </div>
                
                <div class="dashboard-card">
                    <h3> Scoring Overview</h3>
                    <p>View competition scoring progress</p>
                    <button onclick="showScoringOverview()" class="card-button">View Progress</button>
                </div>
            </div>
        </div>
    `;
}

// View Event Types (Staff can view but not edit)
function showEventTypes() {
    document.getElementById("content").innerHTML = `
        <h2> Available Event Types</h2>
        <p style="margin-bottom: 20px;">Understanding different competition categories and their characteristics.</p>
        
        <div id="eventTypesList">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading event types...</p>
            </div>
        </div>
    `;

    fetch('http://localhost:3002/event-types')
    .then(response => response.json())
    .then(eventTypes => {
        let eventTypesHtml = '<div style="display: grid; gap: 20px;">';
        
        eventTypes.forEach(eventType => {
            const typeIcon = eventType.is_pageant ? '👑' : '🎪';
            const typeColor = eventType.is_pageant ? '#ff69b4' : '#17a2b8';
            
            eventTypesHtml += `
                <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${typeColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>${typeIcon} ${eventType.type_name}</h3>
                        <span style="padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${typeColor}; color: white;">
                            ${eventType.is_pageant ? 'BEAUTY PAGEANT' : 'REGULAR EVENT'}
                        </span>
                    </div>
                    
                    <p style="color: #666; margin-bottom: 15px;">
                        ${eventType.description || 'No description provided'}
                    </p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <h4 style="color: #800020; margin-bottom: 10px;">Registration Requirements:</h4>
                        ${eventType.is_pageant ? `
                            <ul style="color: #666; margin-left: 20px;">
                                <li>Basic participant information (name, age, contact)</li>
                                <li>Physical measurements and height</li>
                                <li>Special talents and skills</li>
                                <li>Awards and achievements</li>
                                <li>Performance/talent description</li>
                            </ul>
                        ` : `
                            <ul style="color: #666; margin-left: 20px;">
                                <li>Basic participant information</li>
                                <li>Performance title and description</li>
                                <li>School or organization affiliation</li>
                                <li>Competition-specific requirements</li>
                            </ul>
                        `}
                    </div>
                </div>
            `;
        });
        
        eventTypesHtml += '</div>';
        
        if (eventTypes.length === 0) {
            eventTypesHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🎭</div>
                    <h3>No Event Types Available</h3>
                    <p>Contact the administrator to set up event types.</p>
                </div>
            `;
        }
        
        document.getElementById("eventTypesList").innerHTML = eventTypesHtml;
    })
    .catch(error => {
        console.error('Error loading event types:', error);
        document.getElementById("eventTypesList").innerHTML = '<p class="alert alert-error">Error loading event types.</p>';
    });
}

// Enhanced View Competitions
function showViewCompetitions() {
    document.getElementById("content").innerHTML = `
        <h2> Competition Management</h2>
        
        <div style="margin-bottom: 30px;">
            <div style="display: grid; grid-template-columns: auto auto 1fr; gap: 15px; align-items: center;">
                <label for="eventTypeFilter" style="font-weight: 600; color: #800020;">Filter by Event Type:</label>
                <select id="eventTypeFilter" onchange="filterCompetitionsByType()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                    <option value="">All Event Types</option>
                </select>
                <div></div>
            </div>
        </div>
        
        <div id="competitionsList">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading competitions...</p>
            </div>
        </div>
    `;

    // Load event types for filter
    fetch('http://localhost:3002/event-types')
    .then(response => response.json())
    .then(eventTypes => {
        const filterSelect = document.getElementById("eventTypeFilter");
        eventTypes.forEach(eventType => {
            const option = document.createElement("option");
            option.value = eventType.event_type_id;
            option.textContent = `${eventType.type_name} ${eventType.is_pageant ? '👑' : '🎪'}`;
            filterSelect.appendChild(option);
        });
    });

    // Load competitions
    loadCompetitions();
}

function loadCompetitions(eventTypeFilter = '') {
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        // Filter by event type if specified
        let filteredCompetitions = competitions;
        if (eventTypeFilter) {
            filteredCompetitions = competitions.filter(comp => comp.event_type_id == eventTypeFilter);
        }
        
        let competitionsHtml = '';
        
        if (filteredCompetitions.length === 0) {
            competitionsHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;"></div>
                    <h3>${eventTypeFilter ? 'No competitions found for this event type' : 'No Competitions Available'}</h3>
                    <p>Contact the administrator to set up competitions.</p>
                </div>
            `;
        } else {
            competitionsHtml = '<div style="display: grid; gap: 20px;">';
            
            filteredCompetitions.forEach(competition => {
                const eventIcon = competition.is_pageant ? 'R' : 'P';
                const typeColor = competition.is_pageant ? '#ff69b4' : '#17a2b8';
                
                competitionsHtml += `
                    <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${typeColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3>${competition.competition_name} ${eventIcon}</h3>
                            <span style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; background: ${typeColor}; color: white;">
                                ${competition.type_name}
                            </span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 15px 0;">
                            <div>
                                <p><strong>Date:</strong> ${competition.competition_date}</p>
                                <p><strong>Participants:</strong> ${competition.participant_count || 0}</p>
                            </div>
                            <div>
                                <p><strong>Judges:</strong> ${competition.judge_count || 0}</p>
                                <p><strong>Type:</strong> ${competition.is_pageant ? 'Beauty Pageant' : 'Performance Event'}</p>
                            </div>
                            <div>
                                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
                            </div>
                        </div>
                        
                        ${competition.event_description ? `
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 15px 0;">
                                <strong>Description:</strong> ${competition.event_description}
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 20px;">
                            <button onclick="viewCompetitionDetails(${competition.competition_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ View Details</button>
                            <button onclick="viewCompetitionCriteria(${competition.competition_id}, '${competition.competition_name}')" style="margin: 2px; padding: 8px 16px; background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; border: none; border-radius: 4px; cursor: pointer;">📋 View Criteria</button>
                            <button onclick="registerParticipantForCompetition(${competition.competition_id})" style="margin: 2px; padding: 8px 16px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 4px; cursor: pointer;">➕ Add Participant</button>
                        </div>
                    </div>
                `;
            });
            
            competitionsHtml += '</div>';
        }

        document.getElementById("competitionsList").innerHTML = competitionsHtml;
    })
    .catch(error => {
        console.error('Error loading competitions:', error);
        document.getElementById("competitionsList").innerHTML = '<p class="alert alert-error">Error loading competitions.</p>';
    });
}

function filterCompetitionsByType() {
    const eventTypeId = document.getElementById("eventTypeFilter").value;
    loadCompetitions(eventTypeId);
}

// View Competition Details
function viewCompetitionDetails(competitionId) {
    Promise.all([
        fetch(`http://localhost:3002/competition/${competitionId}`).then(r => r.json()),
        fetch(`http://localhost:3002/participants/${competitionId}`).then(r => r.json()),
        fetch(`http://localhost:3002/judges`).then(r => r.json())
    ])
    .then(([competition, participants, allJudges]) => {
        const judges = allJudges.filter(j => j.competition_id == competitionId);
        const eventIcon = competition.is_pageant ? '👑' : '🎪';
        const typeColor = competition.is_pageant ? '#ff69b4' : '#17a2b8';
        
        let detailsHtml = `
            <h2>👁️ Competition Details</h2>
            
            <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${typeColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>${competition.competition_name} ${eventIcon}</h3>
                    <span style="padding: 8px 16px; border-radius: 15px; font-weight: bold; background: ${typeColor}; color: white;">
                        ${competition.type_name}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px;">
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Basic Information</h4>
                        <p><strong>Date:</strong> ${competition.competition_date}</p>
                        <p><strong>Event Type:</strong> ${competition.type_name} ${eventIcon}</p>
                        <p><strong>Category:</strong> ${competition.is_pageant ? 'Beauty Pageant Event' : 'Performance Competition'}</p>
                    </div>
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Statistics</h4>
                        <p><strong>Total Participants:</strong> ${participants.length}</p>
                        <p><strong>Assigned Judges:</strong> ${judges.length}</p>
                        <p><strong>Registration Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
                    </div>
                </div>
                
                ${competition.event_description ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Event Description</h4>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            ${competition.event_description}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div class="dashboard-card" style="text-align: left;">
                    <h4 style="color: #800020; margin-bottom: 15px;">👥 Participants Overview</h4>
        `;
        
        if (participants.length === 0) {
            detailsHtml += '<p style="color: #666;">No participants registered yet.</p>';
        } else {
            // Group participants by registration status
            const statusGroups = participants.reduce((groups, participant) => {
                if (!groups[participant.status]) {
                    groups[participant.status] = [];
                }
                groups[participant.status].push(participant);
                return groups;
            }, {});
            
            Object.entries(statusGroups).forEach(([status, participants]) => {
                const statusColor = status === 'paid' ? '#28a745' : status === 'pending' ? '#ffc107' : '#17a2b8';
                detailsHtml += `
                    <div style="margin-bottom: 10px;">
                        <span style="color: ${statusColor}; font-weight: bold;">●</span> 
                        ${status.toUpperCase()}: ${participants.length} participants
                    </div>
                `;
            });
        }
        
        detailsHtml += `
                </div>
                
                <div class="dashboard-card" style="text-align: left;">
                    <h4 style="color: #800020; margin-bottom: 15px;">⚖️ Judges Overview</h4>
        `;
        
        if (judges.length === 0) {
            detailsHtml += '<p style="color: #666;">No judges assigned yet.</p>';
        } else {
            judges.forEach(judge => {
                detailsHtml += `
                    <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 5px;">
                        <strong>${judge.judge_name}</strong><br>
                        <small style="color: #666;">${judge.expertise}</small>
                    </div>
                `;
            });
        }
        
        detailsHtml += `
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="showViewCompetitions()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">← Back to Competitions</button>
                <button onclick="viewCompetitionCriteria(${competitionId}, '${competition.competition_name.replace(/'/g, "\\'")}')" class="card-button">📋 View Scoring Criteria</button>
            </div>
        `;
        
        document.getElementById("content").innerHTML = detailsHtml;
    })
    .catch(error => {
        console.error('Error loading competition details:', error);
        alert('Error loading competition details');
    });
}

// View Competition Criteria (Staff can view but not edit)
function viewCompetitionCriteria(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>📋 Competition Scoring Criteria</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>ℹ️ Information for Staff:</strong>
            <ul style="margin-top: 10px; color: #1976d2;">
                <li>These criteria determine how judges evaluate participants</li>
                <li>Each criterion has a specific percentage weight in the final score</li>
                <li>Judges score each criterion separately from 0 to 100 points</li>
                <li>Final scores are calculated using weighted averages</li>
            </ul>
        </div>
        
        <div id="criteriaDisplay">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading scoring criteria...</p>
            </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
            <button onclick="showViewCompetitions()" class="secondary">← Back to Competitions</button>
        </div>
    `;

    fetch(`http://localhost:3002/competition-criteria/${competitionId}`)
    .then(response => response.json())
    .then(criteria => {
        if (criteria.length === 0) {
            document.getElementById("criteriaDisplay").innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h3>No Scoring Criteria Set</h3>
                    <p>The administrator hasn't set up scoring criteria for this competition yet.</p>
                    <p>Contact them to configure the judging criteria before the competition begins.</p>
                </div>
            `;
            return;
        }

        let criteriaHtml = `
            <div style="display: grid; gap: 15px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="color: #800020; margin-bottom: 10px;">Scoring Breakdown</h4>
                    <div style="display: flex; justify-content: center; gap: 20px;">
                        <div><strong>Total Criteria:</strong> ${criteria.length}</div>
                        <div><strong>Total Weight:</strong> ${criteria.reduce((sum, c) => sum + parseFloat(c.percentage), 0).toFixed(1)}%</div>
                    </div>
                </div>
        `;
        
        criteria.forEach((criterion, index) => {
            criteriaHtml += `
                <div class="dashboard-card" style="text-align: left; border-left: 5px solid #800020;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="color: #800020; margin: 0;">#{criterion.order_number} ${criterion.criteria_name}</h4>
                        <div style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                            ${criterion.percentage}%
                        </div>
                    </div>
                    
                    <p style="color: #666; margin-bottom: 15px;">
                        <strong>What judges evaluate:</strong> ${criterion.description || 'This aspect of the performance will be scored'}
                    </p>
                    
                    <div style="display: flex; align-items: center; gap: 20px; background: #f8f9fa; padding: 12px; border-radius: 8px;">
                        <div><strong>Score Range:</strong> 0 - ${criterion.max_score} points</div>
                        <div style="color: #666;">|</div>
                        <div><strong>Weight:</strong> <span style="color: #800020;">${criterion.percentage}%</span> of final score</div>
                    </div>
                </div>
            `;
        });
        
        criteriaHtml += '</div>';
        document.getElementById("criteriaDisplay").innerHTML = criteriaHtml;
    })
    .catch(error => {
        console.error('Error loading criteria:', error);
        document.getElementById("criteriaDisplay").innerHTML = '<p class="alert alert-error">Error loading scoring criteria.</p>';
    });
}

// Enhanced Add Participant Form with Auto-Detection
function showAddParticipantForm(preselectedCompetitionId = null) {
    document.getElementById("content").innerHTML = `
        <h2>👥 Register New Participant</h2>
        
        <form id="addParticipantForm" style="max-width: 800px;">
            <div class="form-section">
                <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin-bottom: 20px;">Basic Information</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <label for="participant_name">Participant Name:</label>
                        <input type="text" id="participant_name" name="participant_name" required>
                    </div>
                    <div>
                        <label for="email">Email Address:</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label for="phone">Phone Number:</label>
                        <input type="tel" id="phone" name="phone">
                    </div>
                    <div>
                        <label for="age">Age:</label>
                        <input type="number" id="age" name="age" min="1" max="120" required>
                    </div>
                    <div>
                        <label for="gender">Gender:</label>
                        <select id="gender" name="gender" required>
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                
                <label for="school_organization">School/Organization:</label>
                <input type="text" id="school_organization" name="school_organization" placeholder="Enter school, company, or organization name">
            </div>
            
            <div class="form-section">
                <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin: 30px 0 20px 0;">Competition Details</h3>
                
                <label for="competition">Select Competition:</label>
                <select id="competition" name="competition" required>
                    <option value="">Choose Competition</option>
                </select>
                
                <div id="competitionInfo" style="display: none; background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 15px 0;">
                    <div id="competitionDetails"></div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px;">
                    <div>
                        <label for="performance_title">Performance/Entry Title:</label>
                        <input type="text" id="performance_title" name="performance_title" placeholder="Title of performance, talent, or entry">
                    </div>
                    <div>
                       <label for="status">Participant Status:</label>
<select id="status" name="status" required>
    <option value="pending">Pending</option>
    <option value="ongoing">Ongoing</option>
    <option value="done">Done</option>
</select>
                    </div>
                </div>
                
                <label for="performance_description">Performance Description:</label>
                <textarea id="performance_description" name="performance_description" rows="3" placeholder="Describe the performance, talent, or what the participant will be presenting..."></textarea>
            </div>
            
            <div id="pageantSection" class="form-section" style="display: none;">
                <h3 style="color: #ff69b4; border-bottom: 2px solid #ff69b4; padding-bottom: 10px; margin: 30px 0 20px 0;">👑 Beauty Pageant Information</h3>
                
                <div style="background: #fff0f5; border: 2px solid #ff69b4; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <strong>📝 Additional Requirements for Beauty Pageants:</strong>
                    <p style="color: #666; margin-top: 8px;">Beauty pageant competitions require additional information for comprehensive evaluation.</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <label for="height">Height:</label>
                        <input type="text" id="height" name="height" placeholder="e.g.,<input type="text" id="height" name="height" placeholder="e.g., 5'6&quot; or 168cm">
                    </div>
                    <div>
                        <label for="measurements">Measurements:</label>
                        <input type="text" id="measurements" name="measurements" placeholder="e.g., 34-24-36">
                    </div>
                </div>
                
                <label for="talents">Special Talents & Skills:</label>
                <textarea id="talents" name="talents" rows="3" placeholder="List special talents, skills, musical instruments, languages, etc..."></textarea>
                
                <label for="special_awards">Awards & Achievements:</label>
                <textarea id="special_awards" name="special_awards" rows="3" placeholder="List awards, honors, achievements, leadership positions, academic honors, etc..."></textarea>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
                <button type="submit" style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; border: none; padding: 15px 40px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 18px;">
                    ✅ Register Participant
                </button>
                <button type="button" onclick="showViewParticipants()" class="secondary" style="margin-left: 15px; padding: 15px 30px; font-size: 16px;">
                    Cancel
                </button>
            </div>
        </form>
    `;

    // Load competitions and handle form logic
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        const competitionSelect = document.getElementById("competition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.setAttribute('data-is-pageant', competition.is_pageant);
            option.setAttribute('data-type-name', competition.type_name);
            option.setAttribute('data-description', competition.event_description || '');
            const eventIcon = competition.is_pageant ? '👑' : '🎪';
            option.textContent = `${competition.competition_name} (${competition.type_name}) ${eventIcon}`;
            competitionSelect.appendChild(option);
        });

        // Preselect competition if provided
        if (preselectedCompetitionId) {
            competitionSelect.value = preselectedCompetitionId;
            handleCompetitionChange();
        }

        // Handle competition selection changes
        competitionSelect.onchange = handleCompetitionChange;
    })
    .catch(error => {
        console.error('Error fetching competitions:', error);
    });

    function handleCompetitionChange() {
        const select = document.getElementById("competition");
        const selectedOption = select.options[select.selectedIndex];
        
        if (select.value) {
            const isPageant = selectedOption.getAttribute('data-is-pageant') === '1';
            const typeName = selectedOption.getAttribute('data-type-name');
            const description = selectedOption.getAttribute('data-description');
            const eventIcon = isPageant ? '👑' : '🎪';
            
            // Show/hide pageant section
            document.getElementById("pageantSection").style.display = isPageant ? "block" : "none";
            
            // Show competition info
            document.getElementById("competitionInfo").style.display = "block";
            document.getElementById("competitionDetails").innerHTML = `
                <h4 style="color: #800020; margin-bottom: 10px;">${eventIcon} ${typeName} Event</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <p><strong>Category:</strong> ${isPageant ? 'Beauty Pageant' : 'Performance Competition'}</p>
                        <p><strong>Registration Fields:</strong> ${isPageant ? 'Extended (includes pageant info)' : 'Standard'}</p>
                    </div>
                    <div>
                        <p><strong>Evaluation Type:</strong> Multi-Criteria Scoring</p>
                        <p><strong>Special Requirements:</strong> ${isPageant ? 'Physical measurements, talents' : 'Performance details'}</p>
                    </div>
                </div>
                ${description ? `<p style="margin-top: 10px;"><strong>Description:</strong> ${description}</p>` : ''}
            `;
        } else {
            document.getElementById("pageantSection").style.display = "none";
            document.getElementById("competitionInfo").style.display = "none";
        }
    }

    document.getElementById("addParticipantForm").onsubmit = function(event) {
        event.preventDefault();

        const participantData = {
            participant_name: document.getElementById("participant_name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            age: document.getElementById("age").value,
            gender: document.getElementById("gender").value,
            school_organization: document.getElementById("school_organization").value,
            performance_title: document.getElementById("performance_title").value,
            performance_description: document.getElementById("performance_description").value,
            competition_id: document.getElementById("competition").value,
            status: document.getElementById("status").value,
            // Pageant specific fields
            height: document.getElementById("height").value,
            measurements: document.getElementById("measurements").value,
            talents: document.getElementById("talents").value,
            special_awards: document.getElementById("special_awards").value
        };

        fetch('http://localhost:3002/add-participant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(participantData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Participant registered successfully!');
                showViewParticipants();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error registering participant');
        });
    };
}

// Quick registration for specific competition
function registerParticipantForCompetition(competitionId) {
    showAddParticipantForm(competitionId);
}
// Continue from where staff-app.js was cut off...

// Enhanced View Participants with Filtering
function showViewParticipants() {
    document.getElementById("content").innerHTML = `
        <h2>👥 Manage Participants</h2>
        
        <div style="margin-bottom: 30px;">
            <button onclick="showAddParticipantForm()" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                ➕ Add New Participant
            </button>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: auto auto auto 1fr; gap: 15px; align-items: center;">
                <label for="filterCompetition" style="font-weight: 600; color: #800020;">Filter by Competition:</label>
                <select id="filterCompetition" onchange="filterParticipants()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                    <option value="">All Competitions</option>
                </select>
                
                <label for="filterStatus" style="font-weight: 600; color: #800020;">Registration Status:</label>
                <select id="filterStatus" onchange="filterParticipants()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                    <option value="">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="waived">Waived</option>
                </select>
            </div>
        </div>
        
        <div id="participantsList">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading participants...</p>
            </div>
        </div>
    `;

    // Populate competition filter dropdown
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        const filterSelect = document.getElementById("filterCompetition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.textContent = `${competition.competition_name} ${competition.is_pageant ? '👑' : '🎪'}`;
            filterSelect.appendChild(option);
        });
    });

    // Load and display participants
    loadParticipants();
}

function loadParticipants(competitionId = '', status = '') {
    let url = 'http://localhost:3002/participants';
    if (competitionId) {
        url = `http://localhost:3002/participants/${competitionId}`;
    }

    fetch(url)
    .then(response => response.json())
    .then(participants => {
        // Filter by status if specified
        let filteredParticipants = participants;
        if (status) {
            filteredParticipants = participants.filter(p => p.status === status);
        }
        
        let participantsHtml = '';
        
        if (filteredParticipants.length === 0) {
            participantsHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
                    <h3>No Participants Found</h3>
                    <p>No participants match the current filters. Try adjusting your search criteria.</p>
                    <button onclick="showAddParticipantForm()" class="card-button">Add First Participant</button>
                </div>
            `;
        } else {
            participantsHtml = '<div style="display: grid; gap: 20px;">';
            
            filteredParticipants.forEach(participant => {
                const statusColor = participant.status === 'done' ? '#28a745' : 
                   participant.status === 'ongoing' ? '#ffc107' : '#dc3545';
                const eventIcon = participant.is_pageant ? '👑' : '🎪';
                
                participantsHtml += `
                    <div class="dashboard-card" style="text-align: left;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <h3>${participant.participant_name} ${eventIcon}</h3>
                            <span style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                                ${participant.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                            <div>
                                <p><strong>Age:</strong> ${participant.age}</p>
                                <p><strong>Gender:</strong> ${participant.gender}</p>
                                <p><strong>Email:</strong> ${participant.email}</p>
                            </div>
                            <div>
                                <p><strong>Competition:</strong> ${participant.competition_name}</p>
                                <p><strong>Event Type:</strong> ${participant.type_name || participant.category} ${eventIcon}</p>
                                <p><strong>Performance:</strong> ${participant.performance_title || 'N/A'}</p>
                            </div>
                            <div>
                                <p><strong>School/Org:</strong> ${participant.school_organization || 'N/A'}</p>
                                <p><strong>Registered:</strong> ${participant.registration_date ? new Date(participant.registration_date).toLocaleDateString() : 'N/A'}</p>
                                ${participant.is_pageant && participant.height ? `<p><strong>Height:</strong> ${participant.height}</p>` : ''}
                            </div>
                        </div>
                        
                        ${participant.performance_description ? `
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                                <strong>Performance Description:</strong><br>
                                <span style="color: #666;">${participant.performance_description}</span>
                            </div>
                        ` : ''}
                        
                        ${participant.is_pageant && (participant.talents || participant.special_awards) ? `
                            <div style="background: #fff0f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                                ${participant.talents ? `<p><strong>Talents:</strong> <span style="color: #666;">${participant.talents}</span></p>` : ''}
                                ${participant.special_awards ? `<p><strong>Awards:</strong> <span style="color: #666;">${participant.special_awards}</span></p>` : ''}
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 15px;">
                            <button onclick="viewParticipantDetails(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ View Details</button>
                            <button onclick="editParticipant(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">✏️ Edit</button>
                            <button onclick="updateRegistrationStatus(${participant.participant_id}, '${participant.status}')" style="margin: 2px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">💰 Update Status</button>
                        </div>
                    </div>
                `;
            });
            
            participantsHtml += '</div>';
        }

        document.getElementById("participantsList").innerHTML = participantsHtml;
    })
    .catch(error => {
        console.error('Error fetching participants:', error);
        document.getElementById("participantsList").innerHTML = '<p class="alert alert-error">Error loading participants.</p>';
    });
}

function filterParticipants() {
    const competitionId = document.getElementById("filterCompetition").value;
    const status = document.getElementById("filterStatus").value;
    loadParticipants(competitionId, status);
}

// View Participant Details
function viewParticipantDetails(id) {
    fetch(`http://localhost:3002/participant/${id}`)
    .then(response => response.json())
    .then(participant => {
       const statusColor = participant.status === 'done' ? '#28a745' : 
                   participant.status === 'ongoing' ? '#ffc107' : '#dc3545';
        const eventIcon = participant.is_pageant ? '👑' : '🎪';
        
        let detailsHtml = `
            <h2>👁️ Participant Details</h2>
            <div class="dashboard-card" style="text-align: left; max-width: 800px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>${participant.participant_name} ${eventIcon}</h3>
                    <span style="padding: 8px 16px; border-radius: 15px; font-weight: bold; background: ${statusColor}; color: white;">
                        ${participant.status.toUpperCase()}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Basic Information</h4>
                        <p><strong>Email:</strong> ${participant.email}</p>
                        <p><strong>Phone:</strong> ${participant.phone || 'Not provided'}</p>
                        <p><strong>Age:</strong> ${participant.age}</p>
                        <p><strong>Gender:</strong> ${participant.gender}</p>
                        <p><strong>School/Organization:</strong> ${participant.school_organization || 'Not specified'}</p>
                    </div>
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Competition Details</h4>
                        <p><strong>Competition:</strong> ${participant.competition_name}</p>
                        <p><strong>Event Type:</strong> ${participant.type_name || participant.category} ${eventIcon}</p>
                        <p><strong>Registration Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${participant.status.toUpperCase()}</span></p>
                        <p><strong>Registration Date:</strong> ${participant.registration_date ? new Date(participant.registration_date).toLocaleDateString() : 'Not recorded'}</p>
                    </div>
                </div>
                
                <div style="margin-top: 25px;">
                    <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Performance Information</h4>
                    <p><strong>Performance Title:</strong> ${participant.performance_title || 'Not specified'}</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <strong>Performance Description:</strong><br>
                        ${participant.performance_description || 'No description provided'}
                    </div>
                </div>
        `;
        
        // Add pageant specific information if applicable
        if (participant.is_pageant) {
            detailsHtml += `
                <div style="margin-top: 25px;">
                    <h4 style="color: #ff69b4; border-bottom: 1px solid #ff69b4; padding-bottom: 5px;">👑 Pageant Information</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <p><strong>Height:</strong> ${participant.height || 'Not provided'}</p>
                            <p><strong>Measurements:</strong> ${participant.measurements || 'Not provided'}</p>
                        </div>
                        <div>
                            <p><strong>Special Talents:</strong></p>
                            <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">
                                ${participant.talents || 'Not specified'}
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <p><strong>Awards & Achievements:</strong></p>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">
                            ${participant.special_awards || 'Not specified'}
                        </div>
                    </div>
                </div>
            `;
        }
        
        detailsHtml += `
            </div>
            <br>
            <div style="text-align: center;">
                <button onclick="showViewParticipants()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">← Back to Participants</button>
                <button onclick="editParticipant(${participant.participant_id})" class="card-button">✏️ Edit Participant</button>
                <button onclick="updateRegistrationStatus(${participant.participant_id}, '${participant.status}')" class="card-button" style="margin-left: 10px;">💰 Update Status</button>
            </div>
        `;
        
        document.getElementById("content").innerHTML = detailsHtml;
    })
    .catch(error => {
        console.error('Error fetching participant details:', error);
        alert('Error loading participant details');
    });
}

// Update Registration Status
function updateRegistrationStatus(participantId, currentStatus) {
    const statusOptions = {
        'pending': 'paid',
        'paid': 'waived',
        'waived': 'pending'
    };
    
    const nextStatus = statusOptions[currentStatus];
    const confirmMessage = `Change registration status to "${nextStatus.toUpperCase()}"?`;
    
    if (confirm(confirmMessage)) {
        fetch(`http://localhost:3002/update-participant-status/${participantId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: nextStatus })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Registration status updated to ${nextStatus.toUpperCase()}`);
                showViewParticipants();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating registration status');
        });
    }
}

// View Judges (Staff can view but not edit)
function showViewJudges() {
    document.getElementById("content").innerHTML = `
        <h2>⚖️ View Judges</h2>
        <p style="margin-bottom: 20px;">View judge assignments and expertise areas.</p>
        
        <div id="judgesList">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading judges...</p>
            </div>
        </div>
    `;

    fetch('http://localhost:3002/judges')
    .then(response => response.json())
    .then(judges => {
        let judgesHtml = '';
        
        if (judges.length === 0) {
            judgesHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚖️</div>
                    <h3>No Judges Assigned</h3>
                    <p>Contact the administrator to add judges to competitions.</p>
                </div>
            `;
        } else {
            judgesHtml = '<div style="display: grid; gap: 20px;">';
            
            judges.forEach(judge => {
                const eventIcon = judge.is_pageant ? '👑' : '🎪';
                
                judgesHtml += `
                    <div class="dashboard-card" style="text-align: left;">
                        <h3>⚖️ ${judge.judge_name}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                            <div>
                                <p><strong>Email:</strong> ${judge.email}</p>
                                <p><strong>Phone:</strong> ${judge.phone || 'Not provided'}</p>
                                <p><strong>Experience:</strong> ${judge.experience_years} years</p>
                            </div>
                            <div>
                                <p><strong>Competition:</strong> ${judge.competition_name || 'Not assigned'}</p>
                                <p><strong>Event Type:</strong> ${judge.type_name ? `${judge.type_name} ${eventIcon}` : 'N/A'}</p>
                                <p><strong>Username:</strong> ${judge.username || 'Not set'}</p>
                            </div>
                            <div>
                                <p><strong>Expertise:</strong></p>
                                <div style="background: #f9f9f9; padding: 8px; border-radius: 4px; font-size: 14px;">
                                    ${judge.expertise || 'Not specified'}
                                </div>
                            </div>
                        </div>
                        
                        ${judge.credentials ? `
                            <div style="margin-top: 15px;">
                                <p><strong>Credentials:</strong></p>
                                <div style="background: #e7f3ff; padding: 10px; border-radius: 5px; font-size: 14px;">
                                    ${judge.credentials}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 20px;">
                            <button onclick="viewJudgeDetails(${judge.judge_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ View Details</button>
                        </div>
                    </div>
                `;
            });
            
            judgesHtml += '</div>';
        }

        document.getElementById("judgesList").innerHTML = judgesHtml;
    })
    .catch(error => {
        console.error('Error loading judges:', error);
        document.getElementById("judgesList").innerHTML = '<p class="alert alert-error">Error loading judges.</p>';
    });
}

// View Judge Details
function viewJudgeDetails(id) {
    fetch(`http://localhost:3002/judge/${id}`)
    .then(response => response.json())
    .then(judge => {
        const eventIcon = judge.is_pageant ? '👑' : '🎪';
        
        document.getElementById("content").innerHTML = `
            <h2>👁️ Judge Details</h2>
            <div class="dashboard-card" style="text-align: left; max-width: 700px; margin: 0 auto;">
                <h3>⚖️ ${judge.judge_name}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Contact Information</h4>
                        <p><strong>Email:</strong> ${judge.email}</p>
                        <p><strong>Phone:</strong> ${judge.phone || 'Not provided'}</p>
                        <p><strong>Username:</strong> ${judge.username || 'Not set'}</p>
                        <p><strong>Experience:</strong> ${judge.experience_years} years</p>
                    </div>
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Assignment Details</h4>
                        <p><strong>Assigned Competition:</strong> ${judge.competition_name || 'Not assigned'}</p>
                        <p><strong>Event Type:</strong> ${judge.type_name ? `${judge.type_name} ${eventIcon}` : 'N/A'}</p>
                        <p><strong>Account Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
                    </div>
                </div>
                
                <div style="margin-top: 25px;">
                    <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Areas of Expertise</h4>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        ${judge.expertise || 'No expertise specified'}
                    </div>
                </div>
                
                <div style="margin-top: 25px;">
                    <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Credentials & Qualifications</h4>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        ${judge.credentials || 'No credentials provided'}
                    </div>
                </div>
            </div>
            <br>
            <div style="text-align: center;">
                <button onclick="showViewJudges()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">← Back to Judges</button>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error fetching judge details:', error);
        alert('Error loading judge details');
    });
}

// Enhanced Reports Function
function showReports() {
    document.getElementById("content").innerHTML = `
        <h2>📊 Enhanced Reports & Analytics</h2>
        
        <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>📈 Available Reports:</strong>
            <p style="color: #1976d2; margin-top: 8px;">Generate comprehensive reports for competitions, participants, and registration status.</p>
        </div>
        
        <div id="reportsContent">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading report data...</p>
            </div>
        </div>
    `;

    // Load data for reports
    Promise.all([
        fetch('http://localhost:3002/competitions').then(r => r.json()),
        fetch('http://localhost:3002/participants').then(r => r.json()),
        fetch('http://localhost:3002/judges').then(r => r.json())
    ])
    .then(([competitions, participants, judges]) => {
        generateReports(competitions, participants, judges);
    })
    .catch(error => {
        console.error('Error loading report data:', error);
        document.getElementById("reportsContent").innerHTML = '<p class="alert alert-error">Error loading report data.</p>';
    });
}

function generateReports(competitions, participants, judges) {
    // Calculate statistics
    const totalCompetitions = competitions.length;
    const totalParticipants = participants.length;
    const totalJudges = judges.length;
    
    // Group participants by competition
    const participantsByCompetition = participants.reduce((acc, participant) => {
        if (!acc[participant.competition_id]) {
            acc[participant.competition_id] = [];
        }
        acc[participant.competition_id].push(participant);
        return acc;
    }, {});
    
    // Group by registration status
    const statusGroups = participants.reduce((groups, participant) => {
        if (!groups[participant.status]) {
            groups[participant.status] = [];
        }
        groups[participant.status].push(participant);
        return groups;
    }, {});
    
    // Group by event type (pageant vs regular)
    const pageantParticipants = participants.filter(p => p.is_pageant).length;
    const regularParticipants = participants.filter(p => !p.is_pageant).length;
    
    let reportsHtml = `
        <div class="report-section">
            <h3>📊 Overall Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px solid #800020;">
                    <h4 style="color: #800020; font-size: 2em; margin-bottom: 10px;">${totalCompetitions}</h4>
                    <p style="color: #666; font-weight: 600;">Total Competitions</p>
                </div>
                <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px solid #28a745;">
                    <h4 style="color: #28a745; font-size: 2em; margin-bottom: 10px;">${totalParticipants}</h4>
                    <p style="color: #666; font-weight: 600;">Total Participants</p>
                </div>
                <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px solid #17a2b8;">
                    <h4 style="color: #17a2b8; font-size: 2em; margin-bottom: 10px;">${totalJudges}</h4>
                    <p style="color: #666; font-weight: 600;">Total Judges</p>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>💰 Registration Status Breakdown</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
    `;
    
    Object.entries(statusGroups).forEach(([status, participants]) => {
        const statusColor = status === 'paid' ? '#28a745' : status === 'pending' ? '#ffc107' : '#17a2b8';
        const percentage = totalParticipants > 0 ? ((participants.length / totalParticipants) * 100).toFixed(1) : 0;
        
        reportsHtml += `
            <div style="background: white; border: 2px solid ${statusColor}; border-radius: 8px; padding: 15px; text-align: center;">
                <h4 style="color: ${statusColor}; font-size: 1.5em;">${participants.length}</h4>
                <p style="font-weight: 600; text-transform: uppercase;">${status}</p>
                <p style="color: #666; font-size: 14px;">${percentage}% of total</p>
            </div>
        `;
    });
    
    reportsHtml += `
            </div>
        </div>
        
        <div class="report-section">
            <h3>🎭 Event Type Distribution</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: white; border: 2px solid #ff69b4; border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: #ff69b4; font-size: 2em;">👑 ${pageantParticipants}</h4>
                    <p style="font-weight: 600;">Beauty Pageant Participants</p>
                    <p style="color: #666; font-size: 14px;">${totalParticipants > 0 ? ((pageantParticipants / totalParticipants) * 100).toFixed(1) : 0}% of total</p>
                </div>
                <div style="background: white; border: 2px solid #17a2b8; border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: #17a2b8; font-size: 2em;">🎪 ${regularParticipants}</h4>
                    <p style="font-weight: 600;">Performance Event Participants</p>
                    <p style="color: #666; font-size: 14px;">${totalParticipants > 0 ? ((regularParticipants / totalParticipants) * 100).toFixed(1) : 0}% of total</p>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3> Competition Details</h3>
    `;
    
    competitions.forEach(competition => {
        const competitionParticipants = participantsByCompetition[competition.competition_id] || [];
        const eventIcon = competition.is_pageant ? '👑' : '🎪';
        const typeColor = competition.is_pageant ? '#ff69b4' : '#17a2b8';
        
        reportsHtml += `
            <div style="background: white; border-left: 5px solid ${typeColor}; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h4 style="color: #800020;">${competition.competition_name} ${eventIcon}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 10px;">
                    <div>
                        <p><strong>Event Type:</strong> ${competition.type_name || competition.category}</p>
                        <p><strong>Date:</strong> ${competition.competition_date}</p>
                    </div>
                    <div>
                        <p><strong>Participants:</strong> ${competitionParticipants.length}</p>
                        <p><strong>Category:</strong> ${competition.is_pageant ? 'Beauty Pageant' : 'Performance Event'}</p>
                    </div>
                    <div>
                        <p><strong>Status:</strong> <span style="color: #28a745;">Active</span></p>
                    </div>
                </div>
            </div>
        `;
    });
    
    reportsHtml += `
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="exportReportData()" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                📊 Export Report Data
            </button>
            <button onclick="showDashboard()" class="secondary">← Back to Dashboard</button>
        </div>
    `;
    
    document.getElementById("reportsContent").innerHTML = reportsHtml;
}

// Export Report Data (placeholder function)
function exportReportData() {
    alert('Export functionality will generate CSV/PDF reports with detailed statistics.');
}

// Scoring Overview Function
function showScoringOverview() {
    document.getElementById("content").innerHTML = `
        <h2>📋 Competition Scoring Overview</h2>
        
        <div style="margin-bottom: 30px;">
            <label for="scoringCompetition" style="font-weight: 600; color: #800020; margin-right: 10px;">Select Competition:</label>
            <select id="scoringCompetition" onchange="loadScoringOverview()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                <option value="">Choose Competition</option>
            </select>
        </div>
        
        <div id="scoringContent">
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                <h3>Select a Competition</h3>
                <p>Choose a competition to view scoring progress and judge assignments.</p>
            </div>
        </div>
    `;

    // Load competitions for dropdown
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        const select = document.getElementById("scoringCompetition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.textContent = `${competition.competition_name} ${competition.is_pageant ? '👑' : '🎪'}`;
            select.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error loading competitions:', error);
    });
}

function loadScoringOverview() {
    const competitionId = document.getElementById("scoringCompetition").value;
    if (!competitionId) {
        document.getElementById("scoringContent").innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                <h3>Select a Competition</h3>
                <p>Choose a competition to view scoring progress.</p>
            </div>
        `;
        return;
    }

    document.getElementById("scoringContent").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 24px;">⏳</div>
            <p>Loading scoring overview...</p>
        </div>
    `;

    // Load competition data, participants, judges, and scores
    Promise.all([
        fetch(`http://localhost:3002/competition/${competitionId}`).then(r => r.json()),
        fetch(`http://localhost:3002/participants/${competitionId}`).then(r => r.json()),
        fetch(`http://localhost:3002/judges`).then(r => r.json()),
        fetch(`http://localhost:3002/overall-scores/${competitionId}`).then(r => r.json()).catch(() => [])
    ])
    .then(([competition, participants, allJudges, scores]) => {
        const judges = allJudges.filter(j => j.competition_id == competitionId);
        const eventIcon = competition.is_pageant ? '👑' : '🎪';
        
        // Calculate scoring progress
        const totalPossibleScores = participants.length * judges.length;
        const completedScores = scores.length;
        const progressPercentage = totalPossibleScores > 0 ? ((completedScores / totalPossibleScores) * 100).toFixed(1) : 0;
        
        let overviewHtml = `
            <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                <h3>${competition.competition_name} ${eventIcon}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 15px 0;">
                    <div>
                        <p><strong>Event Type:</strong> ${competition.type_name || competition.category}</p>
                        <p><strong>Date:</strong> ${competition.competition_date}</p>
                        <p><strong>Category:</strong> ${competition.is_pageant ? 'Beauty Pageant' : 'Performance Event'}</p>
                    </div>
                    <div>
                        <p><strong>Participants:</strong> ${participants.length}</p>
                        <p><strong>Judges:</strong> ${judges.length}</p>
                        <p><strong>Scoring Method:</strong> Multi-Criteria</p>
                    </div>
                    <div>
                        <p><strong>Scoring Progress:</strong></p>
                        <div style="background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; margin: 5px 0;">
                            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); height: 100%; width: ${progressPercentage}%; border-radius: 10px;"></div>
                        </div>
                        <p style="font-size: 14px; color: #666;">${completedScores}/${totalPossibleScores} scores (${progressPercentage}%)</p>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="dashboard-card" style="text-align: left;">
                    <h4 style="color: #800020; margin-bottom: 15px;">👥 Participant Status</h4>
        `;
        
        if (participants.length === 0) {
            overviewHtml += '<p style="color: #666;">No participants registered.</p>';
        } else {
            participants.forEach(participant => {
                const participantScores = scores.filter(s => s.participant_id === participant.participant_id);
                const judgeCount = judges.length;
                const scoredByJudges = participantScores.length;
                const statusColor = scoredByJudges === judgeCount ? '#28a745' : scoredByJudges > 0 ? '#ffc107' : '#dc3545';
                const statusText = scoredByJudges === judgeCount ? 'Complete' : scoredByJudges > 0 ? 'Partial' : 'Pending';
                
                overviewHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: #f8f9fa; border-radius: 5px;">
                        <span>${participant.participant_name}</span>
                        <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                            ${statusText} (${scoredByJudges}/${judgeCount})
                        </span>
                    </div>
                `;
            });
        }
        
        overviewHtml += `
                </div>
                
                <div class="dashboard-card" style="text-align: left;">
                    <h4 style="color: #800020; margin-bottom: 15px;">⚖️ Judge Assignment</h4>
        `;
        
        if (judges.length === 0) {
            overviewHtml += '<p style="color: #666;">No judges assigned.</p>';
        } else {
            judges.forEach(judge => {
                const judgeScores = scores.filter(s => s.judge_id === judge.judge_id);
                const participantCount = participants.length;
                const scoredParticipants = judgeScores.length;
                const statusColor = scoredParticipants === participantCount ? '#28a745' : scoredParticipants > 0 ? '#ffc107' : '#dc3545';
                const statusText = scoredParticipants === participantCount ? 'Complete' : scoredParticipants > 0 ? 'In Progress' : 'Not Started';
                
                overviewHtml += `
                    <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong>${judge.judge_name}</strong>
                            <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                                ${statusText}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            ${judge.expertise} • ${scoredParticipants}/${participantCount} participants scored
                        </div>
                    </div>
                `;
            });
        }
        
        overviewHtml += `
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="viewCompetitionCriteria(${competitionId}, '${competition.competition_name.replace(/'/g, "\\'")}')" class="card-button" style="margin-right: 10px;">📋 View Criteria</button>
                <button onclick="showDashboard()" class="secondary">← Back to Dashboard</button>
            </div>
        `;
        
        document.getElementById("scoringContent").innerHTML = overviewHtml;
    })
    .catch(error => {
        console.error('Error loading scoring overview:', error);
        document.getElementById("scoringContent").innerHTML = '<p class="alert alert-error">Error loading scoring overview.</p>';
    });
}

// Edit Participant (placeholder - would need full implementation)
function editParticipant(participantId) {
    alert('Edit participant functionality - this would open a form similar to the add participant form but pre-populated with existing data.');
    // This would need to be implemented similar to showAddParticipantForm but with existing data loaded
}

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', function() {
    showDashboard();
});

// ==========================================
// AJAX ENHANCEMENTS FOR STAFF DASHBOARD
// ADD THIS AT THE BOTTOM OF staff-app.js
// ==========================================

// ==========================================
// 1. OFFLINE/ONLINE DETECTION
// ==========================================
let isOnline = navigator.onLine;
let offlineQueue = [];

window.addEventListener('online', function() {
    isOnline = true;
    showNotification('You are back online!', 'success');
    processOfflineQueue();
});

window.addEventListener('offline', function() {
    isOnline = false;
    showNotification('You are offline. Changes will be saved when connection is restored.', 'warning');
});

function processOfflineQueue() {
    if (offlineQueue.length === 0) return;
    showNotification(`Syncing ${offlineQueue.length} saved changes...`, 'info');
    
    const promises = offlineQueue.map(({ url, options }) => fetch(url, options));
    Promise.all(promises)
        .then(() => {
            showNotification('All changes synced successfully!', 'success');
            offlineQueue = [];
        })
        .catch(error => {
            showNotification('Some changes failed to sync. Will retry...', 'warning');
        });
}

// ==========================================
// 2. NOTIFICATION SYSTEM
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
        max-width: 300px;
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
// 3. CONNECTION SPEED MONITOR
// ==========================================
let connectionQuality = 'good';

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
// 4. LIVE PARTICIPANT STATUS MONITOR
// ==========================================
function showLiveParticipantStatus(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>📊 Live Participant Status</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #2196F3;">
            <strong>🔴 LIVE</strong> - Updates every 5 seconds
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="showViewCompetitions()" class="secondary">← Back to Competitions</button>
        </div>
        
        <div id="participantStatusGrid">
            <div class="loading">Loading participant status...</div>
        </div>
    `;
    
    updateParticipantStatus(competitionId);
    const statusInterval = setInterval(() => updateParticipantStatus(competitionId), 5000);
    window.currentStatusInterval = statusInterval;
}

function updateParticipantStatus(competitionId) {
    Promise.all([
        fetch(`http://localhost:3002/participants/${competitionId}`).then(r => r.json()),
        fetch(`http://localhost:3002/overall-scores/${competitionId}`).then(r => r.json()),
        fetch('http://localhost:3002/judges').then(r => r.json())
    ])
    .then(([participants, scores, allJudges]) => {
        const judges = allJudges.filter(j => j.competition_id == competitionId);
        const totalJudges = judges.length;
        
        // FIX: Check if element exists before updating
        const participantStatusGrid = document.getElementById("participantStatusGrid");
        if (!participantStatusGrid) {
            console.error('participantStatusGrid element not found');
            return;
        }
        
        if (participants.length === 0) {
            participantStatusGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <h3>No Participants Yet</h3>
                    <p>Add participants to this competition to track their scoring status.</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">';
        
        participants.forEach(participant => {
            const participantScores = scores.filter(s => s.participant_id === participant.participant_id);
            const scoredByJudges = participantScores.length;
            const percentage = totalJudges > 0 ? (scoredByJudges / totalJudges * 100).toFixed(0) : 0;
            
            const statusColor = percentage == 100 ? '#28a745' : percentage > 0 ? '#ffc107' : '#dc3545';
            const statusText = percentage == 100 ? 'COMPLETE ✅' : percentage > 0 ? 'IN PROGRESS 🔄' : 'WAITING ⏳';
            
            html += `
                <div class="participant-status-card" style="background: white; border: 3px solid ${statusColor}; padding: 20px; border-radius: 12px; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; color: #800020;">${participant.participant_name}</h4>
                    
                    <div style="background: #f0f0f0; height: 25px; border-radius: 15px; overflow: hidden; margin: 15px 0;">
                        <div style="background: ${statusColor}; height: 100%; width: ${percentage}%; transition: width 0.5s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                            ${percentage > 10 ? percentage + '%' : ''}
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <small style="font-weight: bold; color: ${statusColor};">${statusText}</small>
                        <small style="color: #666;">${scoredByJudges}/${totalJudges} judges</small>
                    </div>
                    
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                        <small style="color: #999;">Performance: ${participant.performance_title || 'N/A'}</small>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        participantStatusGrid.innerHTML = html;
    })
    .catch(error => {
        console.error('Error updating participant status:', error);
        const participantStatusGrid = document.getElementById("participantStatusGrid");
        if (participantStatusGrid) {
            participantStatusGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff3cd; border-radius: 8px;">
                    <h3>⚠️ Error Loading Status</h3>
                    <p>Could not load participant status. Please refresh the page.</p>
                    <button onclick="location.reload()" class="card-button">Refresh Page</button>
                </div>
            `;
        }
    });
}
// ==========================================
// 5. REAL-TIME PARTICIPANT COUNT UPDATES
// ==========================================
let participantCountInterval;

function startParticipantCountUpdates() {
    participantCountInterval = setInterval(updateParticipantCounts, 10000);
}

function updateParticipantCounts() {
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        competitions.forEach(comp => {
            const countElement = document.getElementById(`participant-count-${comp.competition_id}`);
            if (countElement) {
                const oldCount = parseInt(countElement.textContent);
                const newCount = comp.participant_count || 0;
                
                if (oldCount !== newCount) {
                    countElement.textContent = newCount;
                    countElement.style.color = '#28a745';
                    countElement.style.fontWeight = 'bold';
                    
                    // Flash animation
                    countElement.style.animation = 'flash 1s ease-in-out';
                    
                    setTimeout(() => {
                        countElement.style.color = '';
                        countElement.style.fontWeight = '';
                        countElement.style.animation = '';
                    }, 2000);
                }
            }
        });
    })
    .catch(error => {
        console.error('Error updating participant counts:', error);
    });
}

function stopParticipantCountUpdates() {
    if (participantCountInterval) clearInterval(participantCountInterval);
}

// ==========================================
// 6. LIVE SEARCH FOR PARTICIPANTS
// ==========================================
function setupLiveParticipantSearch() {
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'margin-bottom: 20px;';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'participantSearch';
    searchInput.placeholder = '🔍 Search participants by name, email, or school...';
    searchInput.style.cssText = `
        width: 100%;
        max-width: 500px;
        padding: 15px 20px;
        border: 2px solid #ddd;
        border-radius: 25px;
        font-size: 16px;
        transition: all 0.3s ease;
    `;
    
    searchInput.onfocus = function() {
        this.style.borderColor = '#800020';
        this.style.boxShadow = '0 0 10px rgba(128, 0, 32, 0.2)';
    };
    
    searchInput.onblur = function() {
        this.style.borderColor = '#ddd';
        this.style.boxShadow = 'none';
    };
    
    let searchTimeout;
    searchInput.oninput = function(e) {
        clearTimeout(searchTimeout);
        
        // Show searching indicator
        const resultsDiv = document.getElementById('participantsList');
        if (e.target.value.length > 0) {
            resultsDiv.style.opacity = '0.5';
        }
        
        searchTimeout = setTimeout(() => {
            liveSearchParticipants(e.target.value);
        }, 300);
    };
    
    searchContainer.appendChild(searchInput);
    return searchContainer;
}

function liveSearchParticipants(query) {
    const resultsDiv = document.getElementById('participantsList');
    
    if (query.length === 0) {
        // Reload all participants if search is empty
        loadParticipants();
        return;
    }
    
    fetch('http://localhost:3002/participants')
    .then(response => response.json())
    .then(participants => {
        const filtered = participants.filter(participant => {
            const searchText = `${participant.participant_name} ${participant.email} ${participant.school_organization} ${participant.performance_title}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        
        resultsDiv.style.opacity = '1';
        
        if (filtered.length === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff3cd; border-radius: 8px; border: 2px solid #ffc107;">
                    <h3>🔍 No Results Found</h3>
                    <p>No participants match "${query}"</p>
                    <button onclick="document.getElementById('participantSearch').value=''; loadParticipants();" class="card-button">Clear Search</button>
                </div>
            `;
        } else {
            showNotification(`Found ${filtered.length} participant(s)`, 'info');
            displayFilteredParticipants(filtered);
        }
    })
    .catch(error => {
        console.error('Search error:', error);
        showNotification('Search error occurred', 'error');
        resultsDiv.style.opacity = '1';
    });
}

function displayFilteredParticipants(participants) {
    let html = '<div style="display: grid; gap: 20px;">';
    
    participants.forEach(participant => {
        const statusColor = participant.status === 'done' ? '#28a745' : 
                           participant.status === 'ongoing' ? '#ffc107' : '#dc3545';
        const eventIcon = participant.is_pageant ? '👑' : '🎪';
        
        html += `
            <div class="dashboard-card" style="text-align: left; border-left: 4px solid ${statusColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <h3>${participant.participant_name} ${eventIcon}</h3>
                    <span style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                        ${participant.status.toUpperCase()}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                    <div>
                        <p><strong>Age:</strong> ${participant.age}</p>
                        <p><strong>Gender:</strong> ${participant.gender}</p>
                        <p><strong>Email:</strong> ${participant.email}</p>
                    </div>
                    <div>
                        <p><strong>Competition:</strong> ${participant.competition_name}</p>
                        <p><strong>Event Type:</strong> ${participant.type_name || participant.category} ${eventIcon}</p>
                        <p><strong>Performance:</strong> ${participant.performance_title || 'N/A'}</p>
                    </div>
                    <div>
                        <p><strong>School/Org:</strong> ${participant.school_organization || 'N/A'}</p>
                        ${participant.is_pageant && participant.height ? `<p><strong>Height:</strong> ${participant.height}</p>` : ''}
                    </div>
                </div>
                
                <div style="margin-top: 15px;">
                    <button onclick="viewParticipantDetails(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ View Details</button>
                    <button onclick="editParticipant(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">✏️ Edit</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('participantsList').innerHTML = html;
}

// ==========================================
// 7. QUICK STATS DASHBOARD
// ==========================================
function showQuickStatsDashboard() {
    document.getElementById("content").innerHTML = `
        <h2>📊 Quick Statistics Dashboard</h2>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #2196F3;">
            <strong>🔄 Auto-refreshing</strong> - Statistics update every 15 seconds
        </div>
        
        <div id="quickStatsContent">
            <div class="loading">Loading statistics...</div>
        </div>
    `;
    
    loadQuickStats();
    const statsInterval = setInterval(loadQuickStats, 15000);
    window.currentStatsInterval = statsInterval;
}

function loadQuickStats() {
    Promise.all([
        fetch('http://localhost:3002/competitions').then(r => r.json()),
        fetch('http://localhost:3002/participants').then(r => r.json()),
        fetch('http://localhost:3002/judges').then(r => r.json())
    ])
    .then(([competitions, participants, judges]) => {
        // Calculate stats
        const totalCompetitions = competitions.length;
        const totalParticipants = participants.length;
        const totalJudges = judges.length;
        
        const activeCompetitions = competitions.filter(c => new Date(c.competition_date) >= new Date()).length;
        const paidParticipants = participants.filter(p => p.status === 'paid').length;
        const pendingParticipants = participants.filter(p => p.status === 'pending').length;
        
        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div style="text-align: center; background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(128, 0, 32, 0.3);">
                    <h4 style="font-size: 3em; margin: 0;">${totalCompetitions}</h4>
                    <p style="margin: 10px 0 0 0; font-size: 1.1em;">Total Competitions</p>
                    <small>${activeCompetitions} active</small>
                </div>
                
                <div style="text-align: center; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    <h4 style="font-size: 3em; margin: 0;">${totalParticipants}</h4>
                    <p style="margin: 10px 0 0 0; font-size: 1.1em;">Total Participants</p>
                    <small>${paidParticipants} paid | ${pendingParticipants} pending</small>
                </div>
                
                <div style="text-align: center; background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);">
                    <h4 style="font-size: 3em; margin: 0;">${totalJudges}</h4>
                    <p style="margin: 10px 0 0 0; font-size: 1.1em;">Total Judges</p>
                    <small>Assigned to competitions</small>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <h3>📈 Recent Activity</h3>
                <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #ddd; margin-top: 15px;">
                    <p>🔴 Live updates - Last refreshed: ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        `;
        
        document.getElementById('quickStatsContent').innerHTML = html;
    })
    .catch(error => {
        console.error('Error loading quick stats:', error);
        showNotification('Error loading statistics', 'error');
    });
}

function stopQuickStats() {
    if (window.currentStatsInterval) {
        clearInterval(window.currentStatsInterval);
    }
}

// ==========================================
// 8. ENHANCE EXISTING FUNCTIONS
// ==========================================

// Enhance the existing showViewParticipants function
const originalShowViewParticipants = showViewParticipants;
showViewParticipants = function() {
    originalShowViewParticipants();
    
    // Add live search after the page loads
    setTimeout(() => {
        const content = document.getElementById('content');
        const searchBox = setupLiveParticipantSearch();
        
        // Insert search box before the filters
        const filterDiv = content.querySelector('[id*="filter"]')?.parentElement;
        if (filterDiv) {
            filterDiv.parentElement.insertBefore(searchBox, filterDiv);
        } else {
            content.insertBefore(searchBox, content.firstChild.nextSibling);
        }
    }, 100);
};

// ==========================================
// 9. SELECT COMPETITION FOR LIVE STATUS
// ==========================================
function selectCompetitionForLiveStatus() {
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        if (competitions.length === 0) {
            showNotification('No competitions available', 'warning');
            return;
        }
        
        let html = `
            <h2>Select Competition for Live Status</h2>
            <div style="display: grid; gap: 15px; margin-top: 20px;">
        `;
        
        competitions.forEach(comp => {
            const eventIcon = comp.is_pageant ? '👑' : '🎪';
            html += `
                <div class="dashboard-card" style="text-align: left; cursor: pointer; transition: all 0.3s ease;" 
                     onclick="showLiveParticipantStatus(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')"
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 20px rgba(128, 0, 32, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow=''">
                    <h3>${comp.competition_name} ${eventIcon}</h3>
                    <p><strong>Date:</strong> ${comp.competition_date}</p>
                    <p><strong>Participants:</strong> <span id="participant-count-${comp.competition_id}">${comp.participant_count || 0}</span></p>
                    <p><strong>Judges:</strong> ${comp.judge_count || 0}</p>
                    <button class="card-button" style="margin-top: 10px;">View Live Status</button>
                </div>
            `;
        });
        
        html += '</div>';
        document.getElementById("content").innerHTML = html;
        
        // Start auto-updating participant counts
        startParticipantCountUpdates();
    })
    .catch(error => {
        console.error('Error loading competitions:', error);
        showNotification('Error loading competitions', 'error');
    });
}

// ==========================================
// 10. ADD TO DASHBOARD
// ==========================================
// Enhance the existing showDashboard to include new features
const originalShowDashboard = showDashboard;
showDashboard = function() {
    originalShowDashboard();
    
    // Add new dashboard cards
    setTimeout(() => {
        const content = document.getElementById('content');
        const dashboardGrid = content.querySelector('[style*="grid"]');
        
        if (dashboardGrid) {
            const newCards = `
                <div class="dashboard-card">
                    <h3>📊 Live Status</h3>
                    <p>Real-time participant scoring status</p>
                    <button onclick="selectCompetitionForLiveStatus()" class="card-button">View Live Status</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>📈 Quick Stats</h3>
                    <p>Auto-refreshing statistics dashboard</p>
                    <button onclick="showQuickStatsDashboard()" class="card-button">View Statistics</button>
                </div>
            `;
            
            dashboardGrid.insertAdjacentHTML('beforeend', newCards);
        }
    }, 100);
};

// ==========================================
// 11. CLEANUP ON PAGE NAVIGATION
// ==========================================
function cleanupIntervals() {
    stopParticipantStatus();
    stopParticipantCountUpdates();
    stopQuickStats();
}

// Auto-cleanup when navigating
window.addEventListener('beforeunload', cleanupIntervals);

// ==========================================
// 12. FLASH ANIMATION CSS
// ==========================================
const style = document.createElement('style');
style.textContent = `
    @keyframes flash {
        0%, 100% { background-color: transparent; }
        50% { background-color: #ffd700; }
    }
`;
document.head.appendChild(style);

// ==========================================
// END OF AJAX ENHANCEMENTS FOR staff-app.js
// ==========================================

console.log('✅ AJAX Enhancements loaded for Staff Dashboard');