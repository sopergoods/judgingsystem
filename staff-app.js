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
            <h2>🏆 Enhanced Staff Dashboard</h2>
            <p>Manage day-to-day operations with support for custom events, pageants, and detailed criteria.</p>
            
            <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border: 2px solid #800020;">
                <h3 style="color: #800020; margin-bottom: 15px;">✨ Enhanced Staff Features</h3>
                <ul style="color: #666; line-height: 1.8; text-align: left; max-width: 600px; margin: 0 auto;">
                    <li><strong>Event Types:</strong> View and understand different competition categories</li>
                    <li><strong>Pageant Support:</strong> Register participants with special pageant fields</li>
                    <li><strong>Criteria Awareness:</strong> Understand how competitions are scored</li>
                    <li><strong>Advanced Filtering:</strong> Filter by event types and competition categories</li>
                    <li><strong>Enhanced Reports:</strong> Generate reports with new scoring insights</li>
                </ul>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 30px;">
                <div class="dashboard-card">
                    <h3>🎭 Event Types</h3>
                    <p>View available competition categories</p>
                    <button onclick="showEventTypes()" class="card-button">View Event Types</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>🏆 Competitions</h3>
                    <p>View active competitions and details</p>
                    <button onclick="showViewCompetitions()" class="card-button">View Competitions</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>👥 Participants</h3>
                    <p>Register and manage all participants</p>
                    <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                    <button onclick="showViewParticipants()" class="card-button">Manage All</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>⚖️ Judges</h3>
                    <p>View judge assignments and expertise</p>
                    <button onclick="showViewJudges()" class="card-button">View Judges</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>📊 Enhanced Reports</h3>
                    <p>Generate detailed reports and analytics</p>
                    <button onclick="showReports()" class="card-button">View Reports</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>📋 Scoring Overview</h3>
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
        <h2>🎭 Available Event Types</h2>
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
        <h2>🏆 Competition Management</h2>
        
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
                    <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
                    <h3>${eventTypeFilter ? 'No competitions found for this event type' : 'No Competitions Available'}</h3>
                    <p>Contact the administrator to set up competitions.</p>
                </div>
            `;
        } else {
            competitionsHtml = '<div style="display: grid; gap: 20px;">';
            
            filteredCompetitions.forEach(competition => {
                const eventIcon = competition.is_pageant ? '👑' : '🎪';
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
                if (!groups[participant.registration_fee]) {
                    groups[participant.registration_fee] = [];
                }
                groups[participant.registration_fee].push(participant);
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
                        <label for="registration_fee">Registration Status:</label>
                        <select id="registration_fee" name="registration_fee" required>
                            <option value="pending">Pending Payment</option>
                            <option value="paid">Paid</option>
                            <option value="waived">Fee Waived</option>
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
            registration_fee: document.getElementById("registration_fee").value,
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