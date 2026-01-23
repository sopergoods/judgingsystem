// =====================================================
// STAFF DASHBOARD - CLEAN VERSION
// Maroon & White Theme | Bug-Free | Professional
// =====================================================

const API_URL = 'https://mseufci-judgingsystem.up.railway.app';
let currentUser = null;
let allCompetitions = [];
let allParticipants = [];
let statusUpdateInterval = null;

// =====================================================
// AUTO-REFRESH SYSTEM
// =====================================================
let currentView = null;
let currentViewParams = null;
let autoRefreshInterval = null;

function setCurrentView(viewFunction, params = null) {
    currentView = viewFunction;
    currentViewParams = params;
    
    // Clear existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Set up auto-refresh for certain views (every 5 seconds)
    const viewsToAutoRefresh = ['showViewParticipants', 'showViewCompetitions', 'showViewJudges'];
    if (viewsToAutoRefresh.includes(viewFunction.name)) {
        autoRefreshInterval = setInterval(() => {
            if (currentView) {
                if (currentViewParams) {
                    currentView(...currentViewParams);
                } else {
                    currentView();
                }
            }
        }, 5000); // Refresh every 5 seconds
    }
}

function refreshCurrentView() {
    if (currentView) {
        if (currentViewParams) {
            currentView(...currentViewParams);
        } else {
            currentView();
        }
    }
}

// =====================================================
// INITIALIZATION & AUTHENTICATION
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    initializeStaffDashboard();
});

function initializeStaffDashboard() {
    checkAuthentication();
    initializeConnectionMonitor();
    setupGlobalErrorHandling();
}

function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    updateUserInterface(user);
}

function updateUserInterface(user) {
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.textContent = `Welcome, ${user.full_name || user.username}`;
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('user');
        clearAllIntervals();
        window.location.href = 'login.html';
    }
}

// =====================================================
// DASHBOARD HOME
// =====================================================${createDashboardCard('Scoring Progress', 'Real-time scoring status', 'showScoringOverview()')}

function showDashboard() {
    clearAllIntervals();
    
    const content = `
        <div style="text-align: center; padding: 40px;">
            <h2>Staff Dashboard</h2>
            <p style="color: #666; margin-bottom: 30px;">Manage competitions, participants, and view reports</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                ${createDashboardCard('Event Types', 'View available competition categories', 'showEventTypes()')}
                ${createDashboardCard('Competitions', 'View active competitions', 'showViewCompetitions()')}
                ${createDashboardCard('Add Participant', 'Register new participants', 'showAddParticipantForm()')}
                ${createDashboardCard('Manage Participants', 'View and edit all participants', 'showViewParticipants()')}
                ${createDashboardCard('Judges', 'View judge assignments', 'showViewJudges()')}
                ${createDashboardCard('Reports', 'Generate analytics reports', 'showReports()')}
                
                ${createDashboardCard('Rankings', 'View competition rankings', 'showCompetitionRankings()')}
            </div>
        </div>
    `;
    
    setContent(content);
}

function createDashboardCard(title, description, onClick) {
    return `
        <div class="dashboard-card">
            <h3>${title}</h3>
            <p>${description}</p>
            <button onclick="${onClick}" class="card-button">View</button>
        </div>
    `;
}

// =====================================================
// EVENT TYPES
// =====================================================

function showEventTypes() {
    clearAllIntervals();
    
    setContent(`
        <h2>Available Event Types</h2>
        <p style="margin-bottom: 20px; color: #666;">Understanding different competition categories</p>
        <div id="eventTypesList"><div class="loading">Loading event types...</div></div>
    `);

    fetchData(`${API_URL}/event-types`)
        .then(displayEventTypes)
        .catch(() => showError('eventTypesList', 'Error loading event types'));
}

function displayEventTypes(eventTypes) {
    if (!eventTypes || eventTypes.length === 0) {
        document.getElementById('eventTypesList').innerHTML = createEmptyState('No Event Types', 'Contact administrator to set up event types');
        return;
    }
    
    let html = '<div style="display: grid; gap: 20px;">';
    
    eventTypes.forEach(eventType => {
        const typeColor = eventType.is_pageant ? '#800020' : '#a0002a';
        const typeLabel = eventType.is_pageant ? 'BEAUTY PAGEANT' : 'REGULAR EVENT';
        
        html += `
            <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${typeColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3>${sanitizeHTML(eventType.type_name)}</h3>
                    <span style="padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${typeColor}; color: white;">
                        ${typeLabel}
                    </span>
                </div>
                <p style="color: #666; margin-bottom: 15px;">${sanitizeHTML(eventType.description) || 'No description provided'}</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <h4 style="color: #800020; margin-bottom: 10px;">Registration Requirements:</h4>
                    ${getRequirementsList(eventType.is_pageant)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('eventTypesList').innerHTML = html;
}

function getRequirementsList(isPageant) {
    if (isPageant) {
        return `
            <ul style="color: #666; margin-left: 20px;">
                <li>Basic participant information (name, age, contact)</li>
                <li>Physical measurements and height</li>
                <li>Special talents and skills</li>
                <li>Awards and achievements</li>
                <li>Performance description</li>
            </ul>
        `;
    }
    return `
        <ul style="color: #666; margin-left: 20px;">
            <li>Basic participant information</li>
            <li>Performance title and description</li>
            <li>School or organization affiliation</li>
        </ul>
    `;
}

// =====================================================
// COMPETITIONS
// =====================================================

function showViewCompetitions() {
    setCurrentView(showViewCompetitions);
    clearAllIntervals();
    
    setContent(`
        <h2>Competition Management</h2>
        <div style="margin-bottom: 30px;">
            <label for="eventTypeFilter" style="font-weight: 600; color: #800020; margin-right: 10px;">Filter by Event Type:</label>
            <select id="eventTypeFilter" onchange="filterCompetitionsByType()" class="filter-select">
                <option value="">All Event Types</option>
            </select>
        </div>
        <div id="competitionsList"><div class="loading">Loading competitions...</div></div>
    `);

    Promise.all([
        fetchData(`${API_URL}/event-types`),
        fetchData(`${API_URL}/competitions`)
    ])
    .then(([eventTypes, competitions]) => {
        populateEventTypeFilter(eventTypes);
        allCompetitions = competitions;
        displayCompetitions(competitions);
    })
    .catch(() => showError('competitionsList', 'Error loading competitions'));
}

function populateEventTypeFilter(eventTypes) {
    const filterSelect = document.getElementById('eventTypeFilter');
    if (!filterSelect) return;
    
    eventTypes.forEach(eventType => {
        const option = document.createElement('option');
        option.value = eventType.event_type_id;
        option.textContent = eventType.type_name;
        filterSelect.appendChild(option);
    });
}

function filterCompetitionsByType() {
    const eventTypeId = document.getElementById('eventTypeFilter').value;
    const filtered = eventTypeId ? 
        allCompetitions.filter(comp => comp.event_type_id == eventTypeId) : 
        allCompetitions;
    displayCompetitions(filtered);
}

function displayCompetitions(competitions) {
    if (!competitions || competitions.length === 0) {
        document.getElementById('competitionsList').innerHTML = createEmptyState('No Competitions Found', 'Contact administrator to set up competitions');
        return;
    }

    let html = '<div style="display: grid; gap: 20px;">';
    
    competitions.forEach(competition => {
        const typeColor = competition.is_pageant ? '#800020' : '#a0002a';
        
        html += `
            <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${typeColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3>${sanitizeHTML(competition.competition_name)}</h3>
                    <span style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; background: ${typeColor}; color: white;">
                        ${sanitizeHTML(competition.type_name)}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 15px 0;">
                    <div>
                        <p><strong>Date:</strong> ${formatDate(competition.competition_date)}</p>
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
                        <strong>Description:</strong> ${sanitizeHTML(competition.event_description)}
                    </div>
                ` : ''}
                <div style="margin-top: 20px;">
                    <button onclick="viewCompetitionDetails(${competition.competition_id})" class="card-button">View Details</button>
                    <button onclick="viewCompetitionCriteria(${competition.competition_id})" class="card-button">View Criteria</button>
                    <button onclick="registerParticipantForCompetition(${competition.competition_id})" class="card-button">Add Participant</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('competitionsList').innerHTML = html;
}

function viewCompetitionDetails(competitionId) {
    clearAllIntervals();
    
    Promise.all([
        fetchData(`${API_URL}/competition/${competitionId}`),
        fetchData(`${API_URL}/participants/${competitionId}`),
        fetchData(`${API_URL}/judges`)
    ])
    .then(([competition, participants, allJudges]) => {
        const judges = allJudges.filter(j => j.competition_id == competitionId);
        displayCompetitionDetailsPage(competition, participants, judges);
    })
    .catch(() => showNotification('Error loading competition details', 'error'));
}

function displayCompetitionDetailsPage(competition, participants, judges) {
    const typeColor = competition.is_pageant ? '#800020' : '#a0002a';
    
    const statusGroups = participants.reduce((groups, participant) => {
        if (!groups[participant.status]) groups[participant.status] = [];
        groups[participant.status].push(participant);
        return groups;
    }, {});
    
    let html = `
        <h2>Competition Details</h2>
        <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${typeColor};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>${sanitizeHTML(competition.competition_name)}</h3>
                <span style="padding: 8px 16px; border-radius: 15px; font-weight: bold; background: ${typeColor}; color: white;">
                    ${sanitizeHTML(competition.type_name)}
                </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px;">
                <div>
                    <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Basic Information</h4>
                    <p><strong>Date:</strong> ${formatDate(competition.competition_date)}</p>
                    <p><strong>Event Type:</strong> ${sanitizeHTML(competition.type_name)}</p>
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
                        ${sanitizeHTML(competition.event_description)}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div class="dashboard-card" style="text-align: left;">
                <h4 style="color: #800020; margin-bottom: 15px;">Participants Overview</h4>
                ${participants.length === 0 ? '<p style="color: #666;">No participants registered yet.</p>' : ''}
    `;
    
    Object.entries(statusGroups).forEach(([status, statusParticipants]) => {
        const statusColor = getStatusColor(status);
        html += `
            <div style="margin-bottom: 10px;">
                <span style="color: ${statusColor}; font-weight: bold;">●</span> 
                ${status.toUpperCase()}: ${statusParticipants.length} participants
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="dashboard-card" style="text-align: left;">
                <h4 style="color: #800020; margin-bottom: 15px;">Judges Overview</h4>
                ${judges.length === 0 ? '<p style="color: #666;">No judges assigned yet.</p>' : ''}
    `;
    
    judges.forEach(judge => {
        html += `
            <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 5px;">
                <strong>${sanitizeHTML(judge.judge_name)}</strong><br>
                <small style="color: #666;">${sanitizeHTML(judge.expertise)}</small>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="showViewCompetitions()" class="secondary">Back to Competitions</button>
            <button onclick="viewCompetitionCriteria(${competition.competition_id})" class="card-button">View Scoring Criteria</button>
        </div>
    `;
    
    setContent(html);
}

function viewCompetitionCriteria(competitionId) {
    clearAllIntervals();
    
    fetchData(`${API_URL}/competition/${competitionId}`)
        .then(competition => {
            setContent(`
                <h2>Competition Scoring Criteria</h2>
                <h3 style="color: #800020;">${sanitizeHTML(competition.competition_name)}</h3>
                <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <strong>Information:</strong>
                    <ul style="margin-top: 10px; color: #1976d2;">
                        <li>These criteria determine how judges evaluate participants</li>
                        <li>Each criterion has a specific percentage weight in the final score</li>
                        <li>Judges score each criterion separately from 0 to 100 points</li>
                        <li>Final scores are calculated using weighted averages</li>
                    </ul>
                </div>
                <div id="criteriaDisplay"><div class="loading">Loading scoring criteria...</div></div>
                <div style="margin-top: 30px; text-align: center;">
                    <button onclick="showViewCompetitions()" class="secondary">Back to Competitions</button>
                </div>
            `);
            
            return fetchData(`${API_URL}/competition-criteria/${competitionId}`);
        })
        .then(displayCriteria)
        .catch(() => showError('criteriaDisplay', 'Error loading criteria'));
}

function displayCriteria(criteria) {
    if (!criteria || criteria.length === 0) {
        document.getElementById('criteriaDisplay').innerHTML = `
            <div style="text-align: center; padding: 40px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                <h3>No Scoring Criteria Set</h3>
                <p>The administrator has not set up scoring criteria for this competition yet.</p>
            </div>
        `;
        return;
    }

    const totalWeight = criteria.reduce((sum, c) => sum + parseFloat(c.percentage), 0).toFixed(1);

    let html = `
        <div style="display: grid; gap: 15px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <h4 style="color: #800020; margin-bottom: 10px;">Scoring Breakdown</h4>
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <div><strong>Total Criteria:</strong> ${criteria.length}</div>
                    <div><strong>Total Weight:</strong> ${totalWeight}%</div>
                </div>
            </div>
    `;
    
    criteria.forEach((criterion) => {
        html += `
            <div class="dashboard-card" style="text-align: left; border-left: 5px solid #800020;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: #800020; margin: 0;">#${criterion.order_number} ${sanitizeHTML(criterion.criteria_name)}</h4>
                    <div style="background: #800020; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                        ${criterion.percentage}%
                    </div>
                </div>
                <p style="color: #666; margin-bottom: 15px;">
                    <strong>What judges evaluate:</strong> ${sanitizeHTML(criterion.description) || 'This aspect of the performance will be scored'}
                </p>
                <div style="display: flex; align-items: center; gap: 20px; background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <div><strong>Score Range:</strong> 0 - ${criterion.max_score} points</div>
                    <div style="color: #666;">|</div>
                    <div><strong>Weight:</strong> <span style="color: #800020;">${criterion.percentage}%</span> of final score</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('criteriaDisplay').innerHTML = html;
}

// =====================================================
// PARTICIPANTS - ADD FORM
// =====================================================

function showAddParticipantForm(competitionId = null) {
    fetch(`${API_URL}/competitions`)
        .then(response => response.json())
        .then(competitions => {
            let html = `
                <h2>Add New Participant</h2>
                <form id="participantForm" onsubmit="submitParticipant(event)" style="max-width: 600px; margin: 0 auto;">
                    
                    <label>Participant Name: *</label>
                    <input type="text" id="participant_name" required 
                           placeholder="Full Name" 
                           style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    
                    <label>Contestant Number:</label>
                    <input type="text" id="contestant_number" 
                           placeholder="e.g., 001, P-01" 
                           style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label>Age: *</label>
                            <input type="number" id="age" required min="1" max="100"
                                   style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <div>
                            <label>Gender: *</label>
                            <select id="gender" required 
                                    style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                                <option value="">-- Select --</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <label>Year Level: *</label>
                    <select id="year_level" required 
                            style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">-- Select Year Level --</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                    </select>
                    
                    <label>Competition: *</label>
                    <select id="competition_id" required 
                            style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">-- Select Competition --</option>
            `;
            
            competitions.forEach(comp => {
                // Don't allow adding participants to DONE competitions
                if (comp.status !== 'done') {
                    const selected = competitionId && comp.competition_id == competitionId ? 'selected' : '';
                    html += `<option value="${comp.competition_id}" ${selected}>${comp.competition_name}</option>`;
                }
            });
            
            html += `
                    </select>
                    
                    <label>Photo URL (optional):</label>
                    <input type="url" id="photo_url" 
                           placeholder="https://example.com/photo.jpg" 
                           style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    
                    <div style="margin-top: 20px;">
                        <button type="submit" style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                            Add Participant
                        </button>
                        <button type="button" onclick="showViewParticipants()" style="background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </form>
            `;
            
            setContent(html);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading competitions', 'error');
        });
}

function submitParticipant(event) {
    event.preventDefault();
    
    const participantData = {
        participant_name: document.getElementById('participant_name').value,
        contestant_number: document.getElementById('contestant_number').value || null,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        year_level: document.getElementById('year_level').value,
        competition_id: document.getElementById('competition_id').value,
        photo_url: document.getElementById('photo_url').value || null,
        // Set optional fields as null
        email: null,
        phone: null,
        school_organization: null,
        performance_title: null,
        performance_description: null
    };
    
    fetch(`${API_URL}/add-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message || 'Participant added successfully!', 'success');
            setTimeout(() => {
                showViewParticipants();
                setCurrentView(showViewParticipants);
            }, 500);
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding participant', 'error');
    });
}

function getBasicInfoSection() {
    return `
        <div class="form-section">
            <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin-bottom: 20px;">Basic Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <label for="participant_name">Participant Name: <span style="color: red;">*</span></label>
                    <input type="text" id="participant_name" required>
                </div>
                <div>
                    <label for="email">Email Address: <span style="color: red;">*</span></label>
                    <input type="email" id="email" required>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div>
                    <label for="phone">Phone Number:</label>
                    <input type="tel" id="phone">
                </div>
                <div>
                    <label for="age">Age: <span style="color: red;">*</span></label>
                    <input type="number" id="age" min="1" max="120" required>
                </div>
                <div>
                    <label for="gender">Gender: <span style="color: red;">*</span></label>
                    <select id="gender" required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <label for="school_organization">School/Organization:</label>
            <input type="text" id="school_organization" placeholder="Enter school, company, or organization name">
        </div>
    `;
}

function getCompetitionDetailsSection() {
    return `
        <div class="form-section">
            <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin: 30px 0 20px 0;">Competition Details</h3>
            <label for="competition">Select Competition: <span style="color: red;">*</span></label>
            <select id="competition" required>
                <option value="">Choose Competition</option>
            </select>
            <div id="competitionInfo" style="display: none; background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <div id="competitionDetails"></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px;">
                <div>
                    <label for="performance_title">Performance/Entry Title:</label>
                    <input type="text" id="performance_title" placeholder="Title of performance, talent, or entry">
                </div>
                <div>
                    <label for="status">Status: <span style="color: red;">*</span></label>
                    <select id="status" required>
                        <option value="pending">Pending</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="done">Done</option>
                    </select>
                </div>
            </div>
            <label for="performance_description">Performance Description:</label>
            <textarea id="performance_description" rows="3" placeholder="Describe the performance..."></textarea>
        </div>
    `;
}

function getPageantSection() {
    return `
        <div id="pageantSection" class="form-section" style="display: none;">
            <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin: 30px 0 20px 0;">Pageant Information</h3>
            <div style="background: #fff0f5; border: 2px solid #800020; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <strong>Additional Requirements for Beauty Pageants</strong>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <label for="contestant_number">Contestant/Group Number: <span style="color: red;">*</span></label>
                    <input type="text" id="contestant_number" placeholder="e.g., 1, 2, Group A">
                </div>
                <div>
                    <label for="height">Height:</label>
                    <input type="text" id="height" placeholder="e.g., 5'6&quot; or 168cm">
                </div>
            </div>
            <label for="photo_url">Photo URL: <span style="color: red;">*</span></label>
            <input type="url" id="photo_url" placeholder="https://example.com/photo.jpg">
            <small style="color: #666; display: block; margin-top: 5px;">Upload photo to Imgur or PostImages, then paste URL here</small>
            <label for="talents">Special Talents & Skills:</label>
            <textarea id="talents" rows="3" placeholder="List special talents, skills..."></textarea>
            <label for="special_awards">Awards & Achievements:</label>
            <textarea id="special_awards" rows="3" placeholder="List awards, honors..."></textarea>
        </div>
    `;
}

function getFormButtons(cancelFunction) {
    return `
        <div style="margin-top: 40px; text-align: center;">
            <button type="submit" class="card-button" style="padding: 15px 40px; font-size: 18px;">Register Participant</button>
            <button type="button" onclick="${cancelFunction}" class="secondary" style="margin-left: 15px; padding: 15px 30px; font-size: 16px;">Cancel</button>
        </div>
    `;
}

function populateCompetitionSelect(competitions, preselectedId) {
    const competitionSelect = document.getElementById('competition');
    if (!competitionSelect) return;
    
    competitions.forEach(competition => {
        const option = document.createElement('option');
        option.value = competition.competition_id;
        option.setAttribute('data-is-pageant', competition.is_pageant);
        option.setAttribute('data-type-name', competition.type_name);
        option.setAttribute('data-description', competition.event_description || '');
        option.textContent = `${competition.competition_name} (${competition.type_name})`;
        competitionSelect.appendChild(option);
    });

    if (preselectedId) {
        competitionSelect.value = preselectedId;
        handleCompetitionChange();
    }
}

function setupCompetitionChangeHandler() {
    const select = document.getElementById('competition');
    if (select) {
        select.onchange = handleCompetitionChange;
    }
}

function handleCompetitionChange() {
    const select = document.getElementById('competition');
    const selectedOption = select.options[select.selectedIndex];
    
    if (!select.value) {
        document.getElementById('pageantSection').style.display = 'none';
        document.getElementById('competitionInfo').style.display = 'none';
        return;
    }
    
    const isPageant = selectedOption.getAttribute('data-is-pageant') === '1';
    const typeName = selectedOption.getAttribute('data-type-name');
    const description = selectedOption.getAttribute('data-description');
    
    document.getElementById('pageantSection').style.display = isPageant ? 'block' : 'none';
    
    const contestantNumber = document.getElementById('contestant_number');
    const photoUrl = document.getElementById('photo_url');
    if (contestantNumber) contestantNumber.required = isPageant;
    if (photoUrl) photoUrl.required = isPageant;
    
    document.getElementById('competitionInfo').style.display = 'block';
    document.getElementById('competitionDetails').innerHTML = `
        <h4 style="color: #800020; margin-bottom: 10px;">${sanitizeHTML(typeName)} Event</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <p><strong>Category:</strong> ${isPageant ? 'Beauty Pageant' : 'Performance Competition'}</p>
                <p><strong>Registration Fields:</strong> ${isPageant ? 'Extended' : 'Standard'}</p>
            </div>
            <div>
                <p><strong>Evaluation Type:</strong> Multi-Criteria Scoring</p>
                <p><strong>Special Requirements:</strong> ${isPageant ? 'Physical measurements, talents' : 'Performance details'}</p>
            </div>
        </div>
        ${description ? `<p style="margin-top: 10px;"><strong>Description:</strong> ${sanitizeHTML(description)}</p>` : ''}
    `;
}

function setupParticipantFormSubmit() {
    const form = document.getElementById('addParticipantForm');
    if (!form) return;

    form.onsubmit = function(e) {
        e.preventDefault();

        const participantData = {
            participant_name: getInputValue('participant_name'),
            contestant_number: getInputValue('contestant_number'),
            photo_url: getInputValue('photo_url'),
            email: getInputValue('email'),
            phone: getInputValue('phone'),
            age: getInputValue('age'),
            gender: getInputValue('gender'),
            school_organization: getInputValue('school_organization'),
            performance_title: getInputValue('performance_title'),
            performance_description: getInputValue('performance_description'),
            competition_id: getInputValue('competition'),
            status: 'Active',
            height: null,
            measurements: null,
            talents: getInputValue('talents'),
            special_awards: getInputValue('special_awards')
        };

        fetch(`${API_URL}/add-participant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(participantData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Participant added with Active status successfully!');
                showViewParticipants();
            } else {
                alert('Error: ' + (data.error || 'Error adding participant'));
            }
        })
        .catch(() => alert('Error adding participant!'));
    };
}


function registerParticipantForCompetition(competitionId) {
    showAddParticipantForm(competitionId);
}

// =====================================================
// PARTICIPANTS - VIEW & MANAGE
// =====================================================

function showViewParticipants() {
    setCurrentView(showViewParticipants);
    clearAllIntervals();
    
    setContent(`
        <h2>Manage Participants</h2>
        <div style="margin-bottom: 30px;">
            <button onclick="showAddParticipantForm()" class="card-button">Add New Participant</button>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: auto auto auto 1fr; gap: 15px; align-items: center; flex-wrap: wrap;">
                <label for="filterCompetition" style="font-weight: 600; color: #800020;">Competition:</label>
                <select id="filterCompetition" onchange="filterParticipants()" class="filter-select">
                    <option value="">All Competitions</option>
                </select>
                <label for="filterYear" style="font-weight: 600; color: #800020;">Year:</label>
                <select id="filterYear" onchange="filterParticipants()" class="filter-select">
                    <option value="">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                </select>
                <label for="filterStatus" style="font-weight: 600; color: #800020;">Status:</label>
                <select id="filterStatus" onchange="filterParticipants()" class="filter-select">
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="done">Done</option>
                </select>
            </div>
        </div>
        <div id="participantsList"><div class="loading">Loading participants...</div></div>
    `);

    Promise.all([
        fetchData(`${API_URL}/competitions`),
        fetchData(`${API_URL}/participants`)
    ])
    .then(([competitions, participants]) => {
        populateCompetitionFilter(competitions);
        allParticipants = participants;
        displayParticipants(participants);
    })
    .catch(() => showError('participantsList', 'Error loading participants'));
}

function populateCompetitionFilter(competitions) {
    const filterSelect = document.getElementById('filterCompetition');
    if (!filterSelect) return;
    
    competitions.forEach(competition => {
        const option = document.createElement('option');
        option.value = competition.competition_id;
        option.textContent = competition.competition_name;
        filterSelect.appendChild(option);
    });
}

function filterParticipants() {
    const competitionId = document.getElementById('filterCompetition').value;
    const year = document.getElementById('filterYear').value;
    const status = document.getElementById('filterStatus').value;
    
    let filtered = allParticipants;
    
    if (competitionId) {
        filtered = filtered.filter(p => p.competition_id == competitionId);
    }
    
    if (year) {
        filtered = filtered.filter(p => (p.year_level || '').toLowerCase() === year.toLowerCase());
    }
    
    if (status) {
        filtered = filtered.filter(p => (p.status || '').toLowerCase() === status.toLowerCase());
    }
    
    displayParticipants(filtered);
}

function displayParticipants(participants) {
    if (!participants || participants.length === 0) {
        document.getElementById('participantsList').innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>No Participants Found</h3>
                <p>No participants match the current filters.</p>
                <button onclick="showAddParticipantForm()" class="card-button">Add First Participant</button>
            </div>
        `;
        return;
    }

    let html = '<div style="display: grid; gap: 20px;">';
    
    participants.forEach(participant => {
        const statusColor = getStatusColor(participant.status);
        
        html += `
            <div class="dashboard-card" style="text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <h3>${sanitizeHTML(participant.participant_name)}</h3>
                    <span style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                        ${participant.status.toUpperCase()}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                    <div>
                        <p><strong>Age:</strong> ${participant.age}</p>
                        <p><strong>Gender:</strong> ${participant.gender}</p>
                        ${participant.year_level ? `<p><strong>Year Level:</strong> ${sanitizeHTML(participant.year_level)}</p>` : ''}
                        <p><strong>Email:</strong> ${sanitizeHTML(participant.email)}</p>
                    </div>
                    <div>
                        <p><strong>Competition:</strong> ${sanitizeHTML(participant.competition_name)}</p>
                        <p><strong>Event Type:</strong> ${sanitizeHTML(participant.type_name) || 'N/A'}</p>
                        <p><strong>Performance:</strong> ${sanitizeHTML(participant.performance_title) || 'N/A'}</p>
                    </div>
                    <div>
                        <p><strong>School/Course:</strong> ${sanitizeHTML(participant.school_organization) || 'N/A'}</p>
                        ${participant.height ? `<p><strong>Height:</strong> ${sanitizeHTML(participant.height)}</p>` : ''}
                    </div>
                </div>
                ${participant.performance_description ? `
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <strong>Performance Description:</strong><br>
                        <span style="color: #666;">${sanitizeHTML(participant.performance_description)}</span>
                    </div>
                ` : ''}
                <div style="margin-top: 15px;">
                    <button onclick="viewParticipantDetails(${participant.participant_id})" class="card-button">View Details</button>
                   <button onclick="editParticipantById(${participant.participant_id})" class="card-button">Edit</button>

                    <button onclick="updateRegistrationStatus(${participant.participant_id}, '${participant.status}')" class="card-button">Update Status</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('participantsList').innerHTML = html;
}

function viewParticipantDetails(id) {
    clearAllIntervals();
    
    fetchData(`${API_URL}/participant/${id}`)
        .then(participant => {
            const statusColor = getStatusColor(participant.status);
            
            let html = `
                <h2>Participant Details</h2>
                <div class="dashboard-card" style="text-align: left; max-width: 800px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>${sanitizeHTML(participant.participant_name)}</h3>
                        <span style="padding: 8px 16px; border-radius: 15px; font-weight: bold; background: ${statusColor}; color: white;">
                            ${participant.status.toUpperCase()}
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
                        <div>
                            <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Basic Information</h4>
                            <p><strong>Email:</strong> ${sanitizeHTML(participant.email)}</p>
                            <p><strong>Phone:</strong> ${sanitizeHTML(participant.phone) || 'Not provided'}</p>
                            <p><strong>Age:</strong> ${participant.age}</p>
                            <p><strong>Gender:</strong> ${participant.gender}</p>
                            <p><strong>School/Organization:</strong> ${sanitizeHTML(participant.school_organization) || 'Not specified'}</p>
                        </div>
                        <div>
                            <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Competition Details</h4>
                            <p><strong>Competition:</strong> ${sanitizeHTML(participant.competition_name)}</p>
                            <p><strong>Event Type:</strong> ${sanitizeHTML(participant.type_name) || 'N/A'}</p>
                            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${participant.status.toUpperCase()}</span></p>
                        </div>
                    </div>
                    <div style="margin-top: 25px;">
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Performance Information</h4>
                        <p><strong>Performance Title:</strong> ${sanitizeHTML(participant.performance_title) || 'Not specified'}</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            <strong>Description:</strong><br>${sanitizeHTML(participant.performance_description) || 'No description provided'}
                        </div>
                    </div>
            `;
            
            if (participant.is_pageant) {
                html += `
                    <div style="margin-top: 25px;">
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Pageant Information</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <p><strong>Height:</strong> ${sanitizeHTML(participant.height) || 'Not provided'}</p>
                                <p><strong>Contestant Number:</strong> ${sanitizeHTML(participant.contestant_number) || 'Not assigned'}</p>
                            </div>
                            <div>
                                <p><strong>Special Talents:</strong></p>
                                <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">
                                    ${sanitizeHTML(participant.talents) || 'Not specified'}
                                </div>
                            </div>
                        </div>
                        ${participant.special_awards ? `
                            <div style="margin-top: 15px;">
                                <p><strong>Awards & Achievements:</strong></p>
                                <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">
                                    ${sanitizeHTML(participant.special_awards)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            html += `
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="showViewParticipants()" class="secondary">Back to Participants</button>
                   <button onclick="editParticipantById(${participant.participant_id})" class="card-button">Edit Participant</button>

                    <button onclick="updateRegistrationStatus(${participant.participant_id}, '${participant.status}')" class="card-button">Update Status</button>
                </div>
            `;
            
            setContent(html);
        })
        .catch(() => showNotification('Error loading participant details', 'error'));
}

function updateRegistrationStatus(participantId, currentStatus) {
    // Only two states in Staff: ACTIVE <-> DONE
    const s = String(currentStatus || '').toLowerCase();
    const nextStatus = (s === 'done') ? 'active' : 'done';

    if (confirm(`Change status to "${nextStatus.toUpperCase()}"?`)) {
        putData(`${API_URL}/update-participant-status/${participantId}`, { status: nextStatus })
            .then(data => {
                if (data.success) {
                    showNotification(`Status updated to ${nextStatus.toUpperCase()}`, 'success');
                    setTimeout(() => showViewParticipants(), 600);
                } else {
                    showNotification(data.error || 'Error updating status', 'error');
                }
            })
            .catch(() => showNotification('Error updating status', 'error'));
    }
}


// =====================================================
// SHOW EDIT PARTICIPANT FORM (Admin-style)
// =====================================================
function showEditParticipantForm(participant) {
    // Handle both participant object and participantId
    const participantId = participant.participant_id || participant;
    const isObject = typeof participant === 'object' && participant.participant_id;
    
    if (!isObject) {
        // If just ID was passed, fetch the participant data
        fetch(`${API_URL}/participant/${participantId}`)
            .then(r => r.json())
            .then(p => showEditParticipantForm(p))
            .catch(err => {
                console.error('Error loading participant', err);
                showNotification('Error loading participant', 'error');
            });
        return;
    }
    
    Promise.all([
        Promise.resolve(participant),
        fetch(`${API_URL}/competitions`).then(r => r.json())
    ])
    .then(([participantData, competitions]) => {
        let html = `
            <h2>Edit Participant</h2>
            <form id="editParticipantForm" onsubmit="updateParticipant(event, ${participantData.participant_id})" style="max-width: 600px; margin: 0 auto;">
                
                <label>Participant Name: *</label>
                <input type="text" id="participant_name" value="${participantData.participant_name || ''}" required 
                       style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                
                <label>Contestant Number:</label>
                <input type="text" id="contestant_number" value="${participantData.contestant_number || ''}"
                       style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label>Age: *</label>
                        <input type="number" id="age" value="${participantData.age || ''}" required min="1" max="100"
                               style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div>
                        <label>Gender: *</label>
                        <select id="gender" required 
                                style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="">-- Select --</option>
                            <option value="male" ${participantData.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${participantData.gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${participantData.gender === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                
                <label>Year Level: *</label>
                <select id="year_level" required 
                        style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="">-- Select Year Level --</option>
                    <option value="1st Year" ${participantData.year_level === '1st Year' ? 'selected' : ''}>1st Year</option>
                    <option value="2nd Year" ${participantData.year_level === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                    <option value="3rd Year" ${participantData.year_level === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                    <option value="4th Year" ${participantData.year_level === '4th Year' ? 'selected' : ''}>4th Year</option>
                </select>
                
                <label>Competition: *</label>
                <select id="competition_id" required 
                        style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="">-- Select Competition --</option>
        `;
        
        competitions.forEach(comp => {
            const selected = comp.competition_id === participantData.competition_id ? 'selected' : '';
            html += `<option value="${comp.competition_id}" ${selected}>${comp.competition_name}</option>`;
        });
        
        html += `
                </select>
                
                <label>Photo URL (optional):</label>
                <input type="url" id="photo_url" value="${participantData.photo_url || ''}"
                       style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                
                <div style="margin-top: 20px;">
                    <button type="submit" style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        Update Participant
                    </button>
                    <button type="button" onclick="showViewParticipants()" style="background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
            </form>
        `;
        
        document.getElementById("content").innerHTML = html;
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error loading participant', 'error');
    });
}

function updateParticipant(event, participantId) {
    event.preventDefault();
    
    const participantData = {
        participant_name: document.getElementById('participant_name').value,
        contestant_number: document.getElementById('contestant_number').value || null,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        year_level: document.getElementById('year_level').value,
        competition_id: document.getElementById('competition_id').value,
        photo_url: document.getElementById('photo_url').value || null,
        // Set optional fields as null (removed: email, phone, school_organization, performance_title, talents, special_awards)
        email: null,
        phone: null,
        school_organization: null,
        performance_title: null,
        performance_description: null,
        talents: null,
        special_awards: null
    };
    
    fetch(`${API_URL}/update-participant/${participantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message || 'Participant updated successfully!', 'success');
            setTimeout(() => {
                showViewParticipants();
                setCurrentView(showViewParticipants);
            }, 500);
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating participant', 'error');
    });
}
function getBasicInfoSectionWithValues(participant) {
    return `
        <div class="form-section">
            <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin-bottom: 20px;">Basic Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <label for="participant_name">Participant Name:</label>
                    <input type="text" id="participant_name" value="${sanitizeHTML(participant.participant_name)}" required>
                </div>
                <div>
                    <label for="email">Email Address:</label>
                    <input type="email" id="email" value="${sanitizeHTML(participant.email)}" required>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div>
                    <label for="phone">Phone Number:</label>
                    <input type="tel" id="phone" value="${sanitizeHTML(participant.phone) || ''}">
                </div>
                <div>
                    <label for="age">Age:</label>
                    <input type="number" id="age" min="1" max="120" value="${participant.age}" required>
                </div>
                <div>
                    <label for="gender">Gender:</label>
                    <select id="gender" required>
                        <option value="male" ${participant.gender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="female" ${participant.gender === 'female' ? 'selected' : ''}>Female</option>
                        <option value="other" ${participant.gender === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>
            <label for="school_organization">School/Organization:</label>
            <input type="text" id="school_organization" value="${sanitizeHTML(participant.school_organization) || ''}">
        </div>
    `;
}

function getCompetitionDetailsSectionWithValues(participant) {
    return `
        <div class="form-section">
            <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin: 30px 0 20px 0;">Competition Details</h3>
            <label for="competition">Select Competition:</label>
            <select id="competition" required data-selected="${participant.competition_id}">
                <option value="">Choose Competition</option>
            </select>
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px;">
                <div>
                    <label for="performance_title">Performance Title:</label>
                    <input type="text" id="performance_title" value="${sanitizeHTML(participant.performance_title) || ''}">
                </div>
                <div>
                    <label for="status">Status:</label>
                    <select id="status" required>
                        <option value="pending" ${participant.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="ongoing" ${participant.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                        <option value="done" ${participant.status === 'done' ? 'selected' : ''}>Done</option>
                    </select>
                </div>
            </div>
            <label for="performance_description">Performance Description:</label>
            <textarea id="performance_description" rows="3">${sanitizeHTML(participant.performance_description) || ''}</textarea>
        </div>
    `;
}

function getAdditionalInfoSectionWithValues(participant) {
    return `
        <div class="form-section">
            <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin: 30px 0 20px 0;">Additional Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <label for="contestant_number">Contestant Number:</label>
                    <input type="text" id="contestant_number" value="${sanitizeHTML(participant.contestant_number) || ''}">
                </div>
                <div>
                    <label for="height">Height:</label>
                    <input type="text" id="height" value="${sanitizeHTML(participant.height) || ''}">
                </div>
            </div>
            <label for="photo_url">Photo URL:</label>
            <input type="url" id="photo_url" value="${sanitizeHTML(participant.photo_url) || ''}">
            <label for="talents">Special Talents:</label>
            <textarea id="talents" rows="3">${sanitizeHTML(participant.talents) || ''}</textarea>
            <label for="special_awards">Awards:</label>
            <textarea id="special_awards" rows="3">${sanitizeHTML(participant.special_awards) || ''}</textarea>
        </div>
    `;
}

function populateCompetitionSelectForEdit(competitions) {
    const competitionSelect = document.getElementById('competition');
    if (!competitionSelect) return;
    
    const selectedId = competitionSelect.getAttribute('data-selected');
    
    competitions.forEach(competition => {
        const option = document.createElement('option');
        option.value = competition.competition_id;
        option.textContent = `${competition.competition_name} (${competition.type_name})`;
        if (competition.competition_id == selectedId) {
            option.selected = true;
        }
        competitionSelect.appendChild(option);
    });
}

function setupEditFormSubmit(participantId) {
  const form = document.getElementById('editParticipantForm');
  if (!form) return;

  form.onsubmit = function (e) {
    e.preventDefault();

    // Read values
    const name = getInputValue('participant_name')?.trim();
    const email = getInputValue('email')?.trim();
    const ageVal = getInputValue('age');
    const genderVal = getInputValue('gender');
    const compVal = getInputValue('competition');

    // Normalize
    const age = ageVal ? parseInt(ageVal, 10) : null;
    const gender = (genderVal || '').toString().trim().toLowerCase(); // 'male' | 'female' | 'other'
    const competition_id = compVal ? parseInt(compVal, 10) : null;

    // Validate required fields (these are what the server requires)
    if (!name || !email || !age || !gender || !competition_id) {
      alert('Please complete Name, Email, Age, Gender, and Competition.');
      return;
    }

    // Build payload
    const participantData = {
      participant_name: name,
      contestant_number: getInputValue('contestant_number') || null,
      photo_url: getInputValue('photo_url') || null,
      email,
      phone: getInputValue('phone') || null,
      age,
      gender, // send normalized lowercase
      school_organization: getInputValue('school_organization') || null,
      performance_title: getInputValue('performance_title') || null,
      performance_description: getInputValue('performance_description') || '',
      competition_id, // send as number
      status: (getInputValue('status') || 'active'), // fallback to active
      height: getInputValue('height') || null,
      measurements: null,
      talents: getInputValue('talents') || null,
      special_awards: getInputValue('special_awards') || null
    };

    fetch(`${API_URL}/update-participant/${participantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participantData)
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          alert('Participant updated successfully!');
          showViewParticipants();
        } else {
          alert('Error: ' + (data.error || 'Error updating participant'));
        }
      })
      .catch(() => alert('Error updating participant!'));
  };
}


// =====================================================
// JUDGES
// =====================================================

function showViewJudges() {
    setCurrentView(showViewJudges);
    clearAllIntervals();
    
    setContent(`
        <h2>View Judges</h2>
        <p style="margin-bottom: 20px;">View judge assignments and expertise areas.</p>
        <div id="judgesList"><div class="loading">Loading judges...</div></div>
    `);

    fetchData(`${API_URL}/judges`)
        .then(displayJudges)
        .catch(() => showError('judgesList', 'Error loading judges'));
}

function displayJudges(judges) {
    if (!judges || judges.length === 0) {
        document.getElementById('judgesList').innerHTML = createEmptyState('No Judges Assigned', 'Contact administrator to add judges');
        return;
    }

    let html = '<div style="display: grid; gap: 20px;">';
    
    judges.forEach(judge => {
        html += `
            <div class="dashboard-card" style="text-align: left;">
                <h3>${sanitizeHTML(judge.judge_name)}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                        <div>
                            <p><strong>Competition:</strong> ${sanitizeHTML(judge.competition_name) || 'Not assigned'}</p>
                            <p><strong>Event Type:</strong> ${sanitizeHTML(judge.type_name) || 'N/A'}</p>
                            <p><strong>Username:</strong> ${sanitizeHTML(judge.username) || 'Not set'}</p>
                        </div>
                        <div>
                            <p><strong>Account Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
                        </div>
                </div>
                ${judge.credentials ? `
                    <div style="margin-top: 15px;">
                        <p><strong>Credentials:</strong></p>
                        <div style="background: #e7f3ff; padding: 10px; border-radius: 5px; font-size: 14px;">
                            ${sanitizeHTML(judge.credentials)}
                        </div>
                    </div>
                ` : ''}
                <div style="margin-top: 20px;">
                    <button onclick="viewJudgeDetails(${judge.judge_id})" class="card-button">View Details</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('judgesList').innerHTML = html;
}

function viewJudgeDetails(id) {
    clearAllIntervals();
    
    fetchData(`${API_URL}/judge/${id}`)
        .then(judge => {
            setContent(`
                <h2>Judge Details</h2>
                <div class="dashboard-card" style="text-align: left; max-width: 700px; margin: 0 auto;">
                    <h3>${sanitizeHTML(judge.judge_name)}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
                        <div>
                            <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Contact Information</h4>
                            <p><strong>Email:</strong> ${sanitizeHTML(judge.email)}</p>
                            <p><strong>Phone:</strong> ${sanitizeHTML(judge.phone) || 'Not provided'}</p>
                            <p><strong>Username:</strong> ${sanitizeHTML(judge.username) || 'Not set'}</p>
                            <p><strong>Experience:</strong> ${judge.experience_years} years</p>
                        </div>
                        <div>
                            <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Assignment Details</h4>
                            <p><strong>Assigned Competition:</strong> ${sanitizeHTML(judge.competition_name) || 'Not assigned'}</p>
                            <p><strong>Event Type:</strong> ${sanitizeHTML(judge.type_name) || 'N/A'}</p>
                            <p><strong>Account Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
                        </div>
                    </div>
                    <div style="margin-top: 25px;">
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Credentials</h4>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            ${sanitizeHTML(judge.credentials) || 'No credentials provided'}
                        </div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="showViewJudges()" class="secondary">Back to Judges</button>
                </div>
            `);
        })
        .catch(() => showNotification('Error loading judge details', 'error'));
}

// =====================================================
// REPORTS
// =====================================================

function showReports() {
    clearAllIntervals();
    
    setContent(`
        <h2>Reports & Analytics</h2>
        <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>Available Reports:</strong>
            <p style="color: #1976d2; margin-top: 8px;">Generate comprehensive reports for competitions, participants, and registration status.</p>
        </div>
        <div id="reportsContent"><div class="loading">Loading report data...</div></div>
    `);

    Promise.all([
        fetchData(`${API_URL}/competitions`),
        fetchData(`${API_URL}/participants`),
        fetchData(`${API_URL}/judges`)
    ])
    .then(([competitions, participants, judges]) => {
        generateReports(competitions, participants, judges);
    })
    .catch(() => showError('reportsContent', 'Error loading report data'));
}

function generateReports(competitions, participants, judges) {
    const totalCompetitions = competitions.length;
    const totalParticipants = participants.length;
    const totalJudges = judges.length;
    
    const participantsByCompetition = participants.reduce((acc, participant) => {
        if (!acc[participant.competition_id]) {
            acc[participant.competition_id] = [];
        }
        acc[participant.competition_id].push(participant);
        return acc;
    }, {});
    
    const statusGroups = participants.reduce((groups, participant) => {
        if (!groups[participant.status]) {
            groups[participant.status] = [];
        }
        groups[participant.status].push(participant);
        return groups;
    }, {});
    
    const pageantParticipants = participants.filter(p => p.is_pageant).length;
    const regularParticipants = participants.filter(p => !p.is_pageant).length;
    
    let html = `
        <div class="report-section">
            <h3>Overall Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                ${createStatCard(totalCompetitions, 'Total Competitions', '#800020')}
                ${createStatCard(totalParticipants, 'Total Participants', '#28a745')}
                ${createStatCard(totalJudges, 'Total Judges', '#17a2b8')}
            </div>
        </div>
        
        <div class="report-section">
            <h3>Registration Status Breakdown</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${generateStatusCards(statusGroups, totalParticipants)}
            </div>
        </div>
        
        <div class="report-section">
            <h3>Event Type Distribution</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                ${createEventTypeCard(pageantParticipants, 'Beauty Pageant Participants', totalParticipants, '#800020')}
                ${createEventTypeCard(regularParticipants, 'Performance Event Participants', totalParticipants, '#17a2b8')}
            </div>
        </div>
        
        <div class="report-section">
            <h3>Competition Details</h3>
            ${generateCompetitionDetails(competitions, participantsByCompetition)}
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
    `;
    
    document.getElementById('reportsContent').innerHTML = html;
}

function createStatCard(value, label, color) {
    return `
        <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px solid ${color};">
            <h4 style="color: ${color}; font-size: 2em; margin-bottom: 10px;">${value}</h4>
            <p style="color: #666; font-weight: 600;">${label}</p>
        </div>
    `;
}

function generateStatusCards(statusGroups, totalParticipants) {
    let html = '';
    
    Object.entries(statusGroups).forEach(([status, statusParticipants]) => {
        const statusColor = getStatusColor(status);
        const percentage = totalParticipants > 0 ? ((statusParticipants.length / totalParticipants) * 100).toFixed(1) : 0;
        
        html += `
            <div style="background: white; border: 2px solid ${statusColor}; border-radius: 8px; padding: 15px; text-align: center;">
                <h4 style="color: ${statusColor}; font-size: 1.5em;">${statusParticipants.length}</h4>
                <p style="font-weight: 600; text-transform: uppercase;">${status}</p>
                <p style="color: #666; font-size: 14px;">${percentage}% of total</p>
            </div>
        `;
    });
    
    return html;
}

function createEventTypeCard(count, label, total, color) {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    
    return `
        <div style="background: white; border: 2px solid ${color}; border-radius: 8px; padding: 20px; text-align: center;">
            <h4 style="color: ${color}; font-size: 2em;">${count}</h4>
            <p style="font-weight: 600;">${label}</p>
            <p style="color: #666; font-size: 14px;">${percentage}% of total</p>
        </div>
    `;
}

function generateCompetitionDetails(competitions, participantsByCompetition) {
    let html = '';
    
    competitions.forEach(competition => {
        const competitionParticipants = participantsByCompetition[competition.competition_id] || [];
        const typeColor = competition.is_pageant ? '#800020' : '#17a2b8';
        
        html += `
            <div style="background: white; border-left: 5px solid ${typeColor}; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h4 style="color: #800020;">${sanitizeHTML(competition.competition_name)}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 10px;">
                    <div>
                        <p><strong>Event Type:</strong> ${sanitizeHTML(competition.type_name) || 'N/A'}</p>
                        <p><strong>Date:</strong> ${formatDate(competition.competition_date)}</p>
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
    
    return html;
}

// =====================================================
// SCORING OVERVIEW
// =====================================================

function showScoringOverview() {
    clearAllIntervals();
    
    setContent(`
        <h2>Competition Scoring Overview</h2>
        <div style="margin-bottom: 30px;">
            <label for="scoringCompetition" style="font-weight: 600; color: #800020; margin-right: 10px;">Select Competition:</label>
            <select id="scoringCompetition" onchange="loadScoringOverview()" class="filter-select">
                <option value="">Choose Competition</option>
            </select>
        </div>
        <div id="scoringContent">
            ${createEmptyState('Select a Competition', 'Choose a competition to view scoring progress')}
        </div>
    `);

    fetchData(`${API_URL}/competitions`)
        .then(competitions => {
            const select = document.getElementById('scoringCompetition');
            competitions.forEach(competition => {
                const option = document.createElement('option');
                option.value = competition.competition_id;
                option.textContent = competition.competition_name;
                select.appendChild(option);
            });
        });
}

function loadScoringOverview() {
    const competitionId = document.getElementById('scoringCompetition').value;
    
    if (!competitionId) {
        document.getElementById('scoringContent').innerHTML = createEmptyState('Select a Competition', 'Choose a competition to view scoring progress');
        return;
    }

    document.getElementById('scoringContent').innerHTML = '<div class="loading">Loading scoring overview...</div>';

    Promise.all([
        fetchData(`${API_URL}/competition/${competitionId}`),
        fetchData(`${API_URL}/participants/${competitionId}`),
        fetchData(`${API_URL}/judges`),
        fetchData(`${API_URL}/overall-scores/${competitionId}`).catch(() => [])
    ])
    .then(([competition, participants, allJudges, scores]) => {
        const judges = allJudges.filter(j => j.competition_id == competitionId);
        displayScoringOverview(competition, participants, judges, scores);
    })
    .catch(() => showError('scoringContent', 'Error loading scoring overview'));
}

function displayScoringOverview(competition, participants, judges, scores) {
    const totalPossibleScores = participants.length * judges.length;
    const completedScores = scores.length;
    const progressPercentage = totalPossibleScores > 0 ? ((completedScores / totalPossibleScores) * 100).toFixed(1) : 0;
    
    let html = `
        <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
            <h3>${sanitizeHTML(competition.competition_name)}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 15px 0;">
                <div>
                    <p><strong>Event Type:</strong> ${sanitizeHTML(competition.type_name)}</p>
                    <p><strong>Date:</strong> ${formatDate(competition.competition_date)}</p>
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
                        <div style="background: #28a745; height: 100%; width: ${progressPercentage}%; border-radius: 10px;"></div>
                    </div>
                    <p style="font-size: 14px; color: #666;">${completedScores}/${totalPossibleScores} scores (${progressPercentage}%)</p>
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${generateParticipantStatus(participants, judges, scores)}
            ${generateJudgeStatus(judges, participants, scores)}
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="viewCompetitionCriteria(${competition.competition_id})" class="card-button">View Criteria</button>
            <button onclick="showViewParticipants()" class="card-button" style="margin-left: 10px;">View All Participants</button>
            <button onclick="showDashboard()" class="secondary" style="margin-left: 10px;">Back to Dashboard</button>
        </div>
    `;
    
    document.getElementById('scoringContent').innerHTML = html;
}

function generateParticipantStatus(participants, judges, scores) {
    // Feature 10: Separate remaining participants from completed ones
    const remainingParticipants = [];
    const completedParticipants = [];
    const partialParticipants = [];
    
    participants.forEach(participant => {
        const participantScores = scores.filter(s => s.participant_id === participant.participant_id);
        const judgeCount = judges.length;
        const scoredByJudges = participantScores.length;
        
        if (scoredByJudges === 0) {
            remainingParticipants.push({ participant, scoredByJudges, judgeCount });
        } else if (scoredByJudges === judgeCount) {
            completedParticipants.push({ participant, scoredByJudges, judgeCount });
        } else {
            partialParticipants.push({ participant, scoredByJudges, judgeCount });
        }
    });
    
    let html = `
        <div class="dashboard-card" style="text-align: left;">
            <h4 style="color: #800020; margin-bottom: 15px;">Participant Scoring Status</h4>
    `;
    
    if (participants.length === 0) {
        html += '<p style="color: #666;">No participants registered.</p>';
    } else {
        // Feature 10: Show remaining participants first
        if (remainingParticipants.length > 0) {
            html += `
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin-bottom: 15px; border-radius: 5px;">
                    <strong style="color: #856404;">⚠️ Remaining for Scoring: ${remainingParticipants.length}</strong>
                </div>
            `;
            remainingParticipants.forEach(({ participant, scoredByJudges, judgeCount }) => {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: #fff3cd; border-radius: 5px;">
                        <span><strong>${sanitizeHTML(participant.participant_name)}</strong> ${participant.contestant_number ? `(#${participant.contestant_number})` : ''}</span>
                        <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #dc3545; color: white;">
                            Pending (${scoredByJudges}/${judgeCount})
                        </span>
                    </div>
                `;
            });
        }
        
        if (partialParticipants.length > 0) {
            html += `<div style="margin-top: 15px; font-weight: 600; color: #856404;">In Progress (${partialParticipants.length}):</div>`;
            partialParticipants.forEach(({ participant, scoredByJudges, judgeCount }) => {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: #f8f9fa; border-radius: 5px;">
                        <span>${sanitizeHTML(participant.participant_name)}</span>
                        <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #ffc107; color: #000;">
                            Partial (${scoredByJudges}/${judgeCount})
                        </span>
                    </div>
                `;
            });
        }
        
        if (completedParticipants.length > 0) {
            html += `<div style="margin-top: 15px; font-weight: 600; color: #155724;">Completed (${completedParticipants.length}):</div>`;
            completedParticipants.forEach(({ participant, scoredByJudges, judgeCount }) => {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: #f8f9fa; border-radius: 5px;">
                        <span>${sanitizeHTML(participant.participant_name)}</span>
                        <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #28a745; color: white;">
                            Complete (${scoredByJudges}/${judgeCount})
                        </span>
                    </div>
                `;
            });
        }
    }
    
    html += '</div>';
    return html;
}

function generateJudgeStatus(judges, participants, scores) {
    // Feature 3: Hide judge details, only show summary stats
    let html = `
        <div class="dashboard-card" style="text-align: left;">
            <h4 style="color: #800020; margin-bottom: 15px;">Scoring Progress Summary</h4>
    `;
    
    if (judges.length === 0) {
        html += '<p style="color: #666;">No judges assigned.</p>';
    } else {
        let totalScored = 0;
        let completedJudges = 0;
        
        judges.forEach(judge => {
            const judgeScores = scores.filter(s => s.judge_id === judge.judge_id);
            const participantCount = participants.length;
            const scoredParticipants = judgeScores.length;
            totalScored += scoredParticipants;
            if (scoredParticipants === participantCount) {
                completedJudges++;
            }
        });
        
        html += `
            <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <p><strong>Total Judges:</strong> ${judges.length}</p>
                <p><strong>Completed Scoring:</strong> ${completedJudges}/${judges.length}</p>
                <p><strong>Total Scores Submitted:</strong> ${totalScored} out of ${participants.length * judges.length}</p>
            </div>
        `;
        
        // Feature 3: Hide individual judge details - only show anonymous progress
        judges.forEach(judge => {
            const judgeScores = scores.filter(s => s.judge_id === judge.judge_id);
            const participantCount = participants.length;
            const scoredParticipants = judgeScores.length;
            const statusColor = scoredParticipants === participantCount ? '#28a745' : scoredParticipants > 0 ? '#ffc107' : '#dc3545';
            const statusText = scoredParticipants === participantCount ? 'Complete' : scoredParticipants > 0 ? 'In Progress' : 'Not Started';
            
            html += `
                <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>Judge ${judge.judge_id}</strong>
                        <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                            ${statusText}
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        ${scoredParticipants}/${participantCount} participants scored
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    return html;
}

// =====================================================
// RANKINGS
// =====================================================

function showCompetitionRankings() {
    clearAllIntervals();
    
    setContent(`
        <h2>Competition Rankings</h2>
        <div style="margin-bottom: 30px;">
            <label for="rankingsCompetition" style="font-weight: 600; color: #800020; margin-right: 10px;">Select Competition:</label>
            <select id="rankingsCompetition" onchange="loadCompetitionRankings()" class="filter-select">
                <option value="">Choose Competition</option>
            </select>
            <button onclick="printRankings()" id="printBtn" style="display: none; margin-left: 15px;" class="card-button">
                Print Rankings
            </button>
        </div>
        <div id="rankingsContent">
            ${createEmptyState('Select a Competition', 'Choose a competition to view the current rankings')}
        </div>
    `);

    fetchData(`${API_URL}/competitions`)
        .then(competitions => {
            const select = document.getElementById('rankingsCompetition');
            competitions.forEach(competition => {
                const option = document.createElement('option');
                option.value = competition.competition_id;
                option.setAttribute('data-is-pageant', competition.is_pageant);
                option.setAttribute('data-name', competition.competition_name);
                option.textContent = competition.competition_name;
                select.appendChild(option);
            });
        });
}

function loadCompetitionRankings() {
    const select = document.getElementById('rankingsCompetition');
    const competitionId = select.value;
    
    if (!competitionId) {
        document.getElementById('rankingsContent').innerHTML = createEmptyState('Select a Competition', 'Choose a competition to view rankings');
        document.getElementById('printBtn').style.display = 'none';
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const isPageant = selectedOption.getAttribute('data-is-pageant') === '1';
    const competitionName = selectedOption.getAttribute('data-name');

    document.getElementById('rankingsContent').innerHTML = '<div class="loading">Loading rankings...</div>';
    document.getElementById('printBtn').style.display = 'inline-block';

    window.currentCompetitionName = competitionName;
    window.currentCompetitionId = competitionId;

    const endpoint = isPageant ? 
        `${API_URL}/pageant-grand-total/${competitionId}` : 
        `${API_URL}/overall-scores/${competitionId}`;

    fetchData(endpoint)
        .then(scores => {
            if (!scores || scores.length === 0) {
                document.getElementById('rankingsContent').innerHTML = `
                    <div style="text-align: center; padding: 40px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                        <h3>No Scores Yet</h3>
                        <p>No scores have been submitted for this competition.</p>
                    </div>
                `;
                return;
            }

            displayRankings(scores, competitionName, isPageant);
        })
        .catch(() => showError('rankingsContent', 'Error loading rankings'));
}

function displayRankings(scores, competitionName, isPageant) {
    let rankings = [];
    
   if (isPageant) {
   rankings = scores.map(score => ({
     participant_name: score.participant_name,
     contestant_number: score.contestant_number,
     performance_title: score.performance_title,
     // use weighted grand total from API
     average_score: Number(score.weighted_grand_total),   // keep field name used by renderer
     judge_count: score.judge_count,
     segments_completed: score.segments_completed
   }));
    } else {
        const participantScores = {};
        scores.forEach(score => {
            if (!participantScores[score.participant_id]) {
                participantScores[score.participant_id] = {
                    participant_name: score.participant_name,
                    performance_title: score.performance_title,
                    scores: []
                };
            }
            participantScores[score.participant_id].scores.push(parseFloat(score.total_score));
        });
        
        rankings = Object.values(participantScores).map(p => {
            const sum = p.scores.reduce((acc, s) => acc + s, 0);
            return {
                participant_name: p.participant_name,
                performance_title: p.performance_title,
                average_score: sum / p.scores.length,
                judge_count: p.scores.length
            };
        });
    }
    
    rankings.sort((a, b) => b.average_score - a.average_score);
    
    window.currentRankings = rankings;
    window.isPageantRankings = isPageant;
    
    let html = `
        <div id="printableRankings">
            <div class="print-header" style="display: none;">
                <h1 style="color: #800020; text-align: center; margin-bottom: 10px;">Competition Rankings</h1>
                <h2 style="text-align: center; color: #666; margin-bottom: 20px;">${sanitizeHTML(competitionName)}</h2>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">
                    Generated on ${new Date().toLocaleString()}
                </p>
            </div>
            
            <div style="background: #800020; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;" class="no-print">
                <h3 style="margin: 0; color: white;">${sanitizeHTML(competitionName)}</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Current Rankings - ${rankings.length} Participants</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #800020; color: white;">
                        <th style="padding: 15px; text-align: center; width: 80px;">Rank</th>
                        <th style="padding: 15px; text-align: left;">Participant</th>
                        ${isPageant ? '<th style="padding: 15px; text-align: center;">Contestant #</th>' : ''}
                        <th style="padding: 15px; text-align: left;">Performance</th>
                        <th style="padding: 15px; text-align: center;">Average Score</th>
                        <th style="padding: 15px; text-align: center;">Judges</th>
                        ${isPageant ? '<th style="padding: 15px; text-align: center;">Segments</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `;
    
    rankings.forEach((participant, index) => {
        const rank = index + 1;
        const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#666';
        const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
        
        html += `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #ddd;">
                <td style="padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: ${rankColor};">
                    ${rankMedal} ${rank}
                </td>
                <td style="padding: 15px; font-weight: 600;">${sanitizeHTML(participant.participant_name)}</td>
                ${isPageant ? `<td style="padding: 15px; text-align: center;">${sanitizeHTML(participant.contestant_number) || 'N/A'}</td>` : ''}
                <td style="padding: 15px;">${sanitizeHTML(participant.performance_title) || 'N/A'}</td>
                <td style="padding: 15px; text-align: center; font-size: 20px; font-weight: bold; color: #800020;">
                    ${participant.average_score.toFixed(2)}
                </td>
                <td style="padding: 15px; text-align: center;">${participant.judge_count}</td>
                ${isPageant ? `<td style="padding: 15px; text-align: center;">${participant.segments_completed || 'N/A'}</td>` : ''}
            </tr>
        `;
    });
    
    const avgScore = (rankings.reduce((sum, p) => sum + p.average_score, 0) / rankings.length).toFixed(2);
    
    html += `
                </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;" class="no-print">
                <h4 style="color: #800020;">Ranking Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div><strong>Total Participants:</strong> ${rankings.length}</div>
                    <div><strong>Highest Score:</strong> ${rankings[0]?.average_score.toFixed(2) || 'N/A'}</div>
                    <div><strong>Lowest Score:</strong> ${rankings[rankings.length - 1]?.average_score.toFixed(2) || 'N/A'}</div>
                    <div><strong>Average Score:</strong> ${avgScore}</div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;" class="no-print">
            <button onclick="printRankings()" class="card-button">Print Rankings</button>
            <button onclick="exportRankingsCSV()" class="card-button">Export to CSV</button>
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
    `;
    
    document.getElementById('rankingsContent').innerHTML = html;
}

function printRankings() {
    const printHeaders = document.querySelectorAll('.print-header');
    printHeaders.forEach(header => header.style.display = 'block');
    
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(element => element.style.display = 'none');
    
    window.print();
    
    setTimeout(() => {
        printHeaders.forEach(header => header.style.display = 'none');
        noPrintElements.forEach(element => element.style.display = 'block');
    }, 1000);
}

function exportRankingsCSV() {
    if (!window.currentRankings) {
        showNotification('No rankings data to export', 'error');
        return;
    }
    
    const isPageant = window.isPageantRankings;
    const competitionName = window.currentCompetitionName;
    
    let csv = `Competition Rankings - ${competitionName}\n`;
    csv += `Generated on ${new Date().toLocaleString()}\n\n`;
    
    if (isPageant) {
       csv += 'Rank,Participant Name,Contestant Number,Performance,Grand Total (Weighted),Judges,Segments Completed\n';
    } else {
        csv += 'Rank,Participant Name,Performance,Average Score,Judges\n';
    }
    
    window.currentRankings.forEach((participant, index) => {
        const rank = index + 1;
        const row = [
            rank,
            `"${participant.participant_name}"`,
            ...(isPageant ? [`"${participant.contestant_number || 'N/A'}"`] : []),
            `"${participant.performance_title || 'N/A'}"`,
            participant.average_score.toFixed(2),
            participant.judge_count,
            ...(isPageant ? [participant.segments_completed || 'N/A'] : [])
        ];
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${competitionName.replace(/\s+/g, '_')}_Rankings_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Rankings exported successfully', 'success');
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function fetchData(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

function postData(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

function putData(url, data) {
    return fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

function setContent(html) {
    const contentElement = document.getElementById('content');
    if (contentElement) {
        contentElement.innerHTML = html;
    }
}

function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? (element.value || null) : null;
}

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getStatusColor(status) {
    const colors = {
        'done': '#28a745',
        'ongoing': '#ffc107',
        'pending': '#dc3545',
        'active': '#28a745'
    };
    return colors[status] || '#666';
}

function createEmptyState(title, message) {
    return `
        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #fff3cd; border-radius: 8px;">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

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
        max-width: 300px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
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
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function clearAllIntervals() {
    if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        statusUpdateInterval = null;
    }
}

function initializeConnectionMonitor() {
    window.addEventListener('online', () => {
        showNotification('You are back online', 'success');
    });

    window.addEventListener('offline', () => {
        showNotification('You are offline. Some features may not work.', 'warning');
    });
}

function setupGlobalErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
    });
}

function loadCompetitionsDropdown(selectId, selectedId = null) {
    const select = document.getElementById(selectId);
    if (!select) return;

    fetch(`${API_URL}/competitions`)
        .then(res => res.json())
        .then(data => {
            select.innerHTML = '<option value="">Select competition</option>';
            data.forEach(c => {
                const option = document.createElement('option');
                option.value = c.competition_id;
                option.textContent = `${c.competition_name} (${c.type_name || ''})`;
                if (selectedId && String(selectedId) === String(c.competition_id)) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Error loading competitions:', err);
            select.innerHTML = '<option value="">Error loading competitions</option>';
        });
}

// Open Admin-style edit form by fetching the participant by ID
function editParticipantById(participantId) {
  fetch(`${API_URL}/participant/${participantId}`)
    .then(res => res.json())
    .then(participant => {
      showEditParticipantForm(participant); // uses the Admin-style form you added
    })
    .catch(err => {
      console.error('Error loading participant', err);
      alert('Error loading participant');
    });
}

// Initialize dashboard on load
showDashboard();