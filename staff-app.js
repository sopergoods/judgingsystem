// Staff Dashboard JavaScript - Refactored & Bug-Fixed Version

const API_URL = 'https://mseufci-judgingsystem.up.railway.app';
let statusUpdateInterval = null;

// Authentication Check
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeConnectionMonitor();
});

function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
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
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Dashboard
function showDashboard() {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2>Welcome to Staff Dashboard</h2>
            <p>Manage competitions, participants, and view reports</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 30px;">
                <div class="dashboard-card">
                    <h3>Event Types</h3>
                    <p>View available competition categories</p>
                    <button onclick="showEventTypes()" class="card-button">View Event Types</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>Competitions</h3>
                    <p>View active competitions and details</p>
                    <button onclick="showViewCompetitions()" class="card-button">View Competitions</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>Participants</h3>
                    <p>Register and manage all participants</p>
                    <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                    <button onclick="showViewParticipants()" class="card-button">Manage All</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>Judges</h3>
                    <p>View judge assignments and expertise</p>
                    <button onclick="showViewJudges()" class="card-button">View Judges</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>Reports</h3>
                    <p>Generate detailed reports and analytics</p>
                    <button onclick="showReports()" class="card-button">View Reports</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>Live Status</h3>
                    <p>Real-time scoring progress tracking</p>
                    <button onclick="showScoringOverview()" class="card-button">View Progress</button>
                </div>
            </div>
        </div>
    `;
}

// Event Types
function showEventTypes() {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>Available Event Types</h2>
        <p style="margin-bottom: 20px;">Understanding different competition categories and their characteristics.</p>
        <div id="eventTypesList"><div class="loading">Loading event types...</div></div>
    `;

    fetchData(`${API_URL}/event-types`)
        .then(eventTypes => {
            if (eventTypes.length === 0) {
                document.getElementById("eventTypesList").innerHTML = `
                    <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                        <h3>No Event Types Available</h3>
                        <p>Contact the administrator to set up event types.</p>
                    </div>
                `;
                return;
            }
            
            let html = '<div style="display: grid; gap: 20px;">';
            eventTypes.forEach(eventType => {
                const typeColor = eventType.is_pageant ? '#800020' : '#a0002a';
                const typeLabel = eventType.is_pageant ? 'BEAUTY PAGEANT' : 'REGULAR EVENT';
                
                html += `
                    <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${typeColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3>${eventType.type_name}</h3>
                            <span style="padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${typeColor}; color: white;">
                                ${typeLabel}
                            </span>
                        </div>
                        <p style="color: #666; margin-bottom: 15px;">${eventType.description || 'No description provided'}</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <h4 style="color: #800020; margin-bottom: 10px;">Registration Requirements:</h4>
                            ${eventType.is_pageant ? `
                                <ul style="color: #666; margin-left: 20px;">
                                    <li>Basic participant information (name, age, contact)</li>
                                    <li>Physical measurements and height</li>
                                    <li>Special talents and skills</li>
                                    <li>Awards and achievements</li>
                                    <li>Performance description</li>
                                </ul>
                            ` : `
                                <ul style="color: #666; margin-left: 20px;">
                                    <li>Basic participant information</li>
                                    <li>Performance title and description</li>
                                    <li>School or organization affiliation</li>
                                </ul>
                            `}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            document.getElementById("eventTypesList").innerHTML = html;
        })
        .catch(() => showError('eventTypesList', 'Error loading event types'));
}

// Competitions
function showViewCompetitions() {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>Competition Management</h2>
        <div style="margin-bottom: 30px;">
            <label for="eventTypeFilter" style="font-weight: 600; color: #800020; margin-right: 10px;">Filter by Event Type:</label>
            <select id="eventTypeFilter" onchange="filterCompetitionsByType()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                <option value="">All Event Types</option>
            </select>
        </div>
        <div id="competitionsList"><div class="loading">Loading competitions...</div></div>
    `;

    Promise.all([
        fetchData(`${API_URL}/event-types`),
        fetchData(`${API_URL}/competitions`)
    ]).then(([eventTypes, competitions]) => {
        const filterSelect = document.getElementById("eventTypeFilter");
        eventTypes.forEach(eventType => {
            const option = document.createElement("option");
            option.value = eventType.event_type_id;
            option.textContent = eventType.type_name;
            filterSelect.appendChild(option);
        });
        
        window.allCompetitions = competitions;
        loadCompetitions(competitions);
    }).catch(() => showError('competitionsList', 'Error loading competitions'));
}

function filterCompetitionsByType() {
    const eventTypeId = document.getElementById("eventTypeFilter").value;
    const filtered = eventTypeId ? 
        window.allCompetitions.filter(comp => comp.event_type_id == eventTypeId) : 
        window.allCompetitions;
    loadCompetitions(filtered);
}

function loadCompetitions(competitions) {
    if (competitions.length === 0) {
        document.getElementById("competitionsList").innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>No Competitions Found</h3>
                <p>Contact the administrator to set up competitions.</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: grid; gap: 20px;">';
    competitions.forEach(competition => {
        const typeColor = competition.is_pageant ? '#800020' : '#a0002a';
        html += `
            <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${typeColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3>${competition.competition_name}</h3>
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
                    <button onclick="viewCompetitionDetails(${competition.competition_id})" class="card-button">View Details</button>
                    <button onclick="viewCompetitionCriteria(${competition.competition_id}, '${escapeQuotes(competition.competition_name)}')" class="card-button">View Criteria</button>
                    <button onclick="registerParticipantForCompetition(${competition.competition_id})" class="card-button">Add Participant</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    document.getElementById("competitionsList").innerHTML = html;
}

function viewCompetitionDetails(competitionId) {
    clearIntervals();
    Promise.all([
        fetchData(`${API_URL}/competition/${competitionId}`),
        fetchData(`${API_URL}/participants/${competitionId}`),
        fetchData(`${API_URL}/judges`)
    ]).then(([competition, participants, allJudges]) => {
        const judges = allJudges.filter(j => j.competition_id == competitionId);
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
                    <h3>${competition.competition_name}</h3>
                    <span style="padding: 8px 16px; border-radius: 15px; font-weight: bold; background: ${typeColor}; color: white;">
                        ${competition.type_name}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px;">
                    <div>
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Basic Information</h4>
                        <p><strong>Date:</strong> ${competition.competition_date}</p>
                        <p><strong>Event Type:</strong> ${competition.type_name}</p>
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
                    <h4 style="color: #800020; margin-bottom: 15px;">Participants Overview</h4>
                    ${participants.length === 0 ? '<p style="color: #666;">No participants registered yet.</p>' : ''}
        `;
        
        Object.entries(statusGroups).forEach(([status, participants]) => {
            const statusColor = status === 'done' ? '#28a745' : status === 'ongoing' ? '#ffc107' : '#dc3545';
            html += `
                <div style="margin-bottom: 10px;">
                    <span style="color: ${statusColor}; font-weight: bold;">●</span> 
                    ${status.toUpperCase()}: ${participants.length} participants
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
                    <strong>${judge.judge_name}</strong><br>
                    <small style="color: #666;">${judge.expertise}</small>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="showViewCompetitions()" class="secondary">Back to Competitions</button>
                <button onclick="viewCompetitionCriteria(${competitionId}, '${escapeQuotes(competition.competition_name)}')" class="card-button">View Scoring Criteria</button>
            </div>
        `;
        
        document.getElementById("content").innerHTML = html;
    }).catch(() => showNotification('Error loading competition details', 'error'));
}

function viewCompetitionCriteria(competitionId, competitionName) {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>Competition Scoring Criteria</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
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
    `;

    fetchData(`${API_URL}/competition-criteria/${competitionId}`)
        .then(criteria => {
            if (criteria.length === 0) {
                document.getElementById("criteriaDisplay").innerHTML = `
                    <div style="text-align: center; padding: 40px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                        <h3>No Scoring Criteria Set</h3>
                        <p>The administrator has not set up scoring criteria for this competition yet.</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div style="display: grid; gap: 15px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <h4 style="color: #800020; margin-bottom: 10px;">Scoring Breakdown</h4>
                        <div style="display: flex; justify-content: center; gap: 20px;">
                            <div><strong>Total Criteria:</strong> ${criteria.length}</div>
                            <div><strong>Total Weight:</strong> ${criteria.reduce((sum, c) => sum + parseFloat(c.percentage), 0).toFixed(1)}%</div>
                        </div>
                    </div>
            `;
            
            criteria.forEach((criterion) => {
                html += `
                    <div class="dashboard-card" style="text-align: left; border-left: 5px solid #800020;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="color: #800020; margin: 0;">#${criterion.order_number} ${criterion.criteria_name}</h4>
                            <div style="background: #800020; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
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
            
            html += '</div>';
            document.getElementById("criteriaDisplay").innerHTML = html;
        })
        .catch(() => showError('criteriaDisplay', 'Error loading scoring criteria'));
}

// Add Participant Form
function showAddParticipantForm(preselectedCompetitionId = null) {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>Register New Participant</h2>
        <form id="addParticipantForm" style="max-width: 800px;">
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
            
            <div class="form-section">
                <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin: 30px 0 20px 0;">Competition Details</h3>
                <label for="competition">Select Competition: <span style="color: red;">*</span></label>
                <select id="competition" required><option value="">Choose Competition</option></select>
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
            
            <div style="margin-top: 40px; text-align: center;">
                <button type="submit" class="card-button" style="padding: 15px 40px; font-size: 18px;">Register Participant</button>
                <button type="button" onclick="showViewParticipants()" class="secondary" style="margin-left: 15px; padding: 15px 30px; font-size: 16px;">Cancel</button>
            </div>
        </form>
    `;

    fetchData(`${API_URL}/competitions`).then(competitions => {
        const competitionSelect = document.getElementById("competition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.setAttribute('data-is-pageant', competition.is_pageant);
            option.setAttribute('data-type-name', competition.type_name);
            option.setAttribute('data-description', competition.event_description || '');
            option.textContent = `${competition.competition_name} (${competition.type_name})`;
            competitionSelect.appendChild(option);
        });

        if (preselectedCompetitionId) {
            competitionSelect.value = preselectedCompetitionId;
            handleCompetitionChange();
        }

        competitionSelect.onchange = handleCompetitionChange;
    });

    function handleCompetitionChange() {
        const select = document.getElementById("competition");
        const selectedOption = select.options[select.selectedIndex];
        
        if (select.value) {
            const isPageant = selectedOption.getAttribute('data-is-pageant') === '1';
            const typeName = selectedOption.getAttribute('data-type-name');
            const description = selectedOption.getAttribute('data-description');
            
            document.getElementById("pageantSection").style.display = isPageant ? "block" : "none";
            
            const contestantNumber = document.getElementById("contestant_number");
            const photoUrl = document.getElementById("photo_url");
            if (contestantNumber) contestantNumber.required = isPageant;
            if (photoUrl) photoUrl.required = isPageant;
            
            document.getElementById("competitionInfo").style.display = "block";
            document.getElementById("competitionDetails").innerHTML = `
                <h4 style="color: #800020; margin-bottom: 10px;">${typeName} Event</h4>
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
            contestant_number: document.getElementById("contestant_number")?.value || null,
            photo_url: document.getElementById("photo_url")?.value || null,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value || null,
            age: document.getElementById("age").value,
            gender: document.getElementById("gender").value,
            school_organization: document.getElementById("school_organization").value || null,
            performance_title: document.getElementById("performance_title").value || null,
            performance_description: document.getElementById("performance_description").value || null,
            competition_id: document.getElementById("competition").value,
            status: document.getElementById("status").value,
            height: document.getElementById("height")?.value || null,
            measurements: null,
            talents: document.getElementById("talents")?.value || null,
            special_awards: document.getElementById("special_awards")?.value || null
        };

        postData(`${API_URL}/add-participant`, participantData)
            .then(data => {
                if (data.success) {
                    showNotification('Participant registered successfully!', 'success');
                    setTimeout(() => showViewParticipants(), 1500);
                } else {
                    showNotification('Error: ' + data.error, 'error');
                }
            })
            .catch(() => showNotification('Error registering participant', 'error'));
    };
}

function registerParticipantForCompetition(competitionId) {
    showAddParticipantForm(competitionId);
}

// View Participants
function showViewParticipants() {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>Manage Participants</h2>
        <div style="margin-bottom: 30px;">
            <button onclick="showAddParticipantForm()" class="card-button">Add New Participant</button>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: auto auto auto 1fr; gap: 15px; align-items: center;">
                <label for="filterCompetition" style="font-weight: 600; color: #800020;">Filter by Competition:</label>
                <select id="filterCompetition" onchange="filterParticipants()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                    <option value="">All Competitions</option>
                </select>
                <label for="filterStatus" style="font-weight: 600; color: #800020;">Status:</label>
                <select id="filterStatus" onchange="filterParticipants()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                    <option value="">All Statuses</option>
                    <option value="done">Done</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="pending">Pending</option>
                </select>
            </div>
        </div>
        <div id="participantsList"><div class="loading">Loading participants...</div></div>
    `;

    Promise.all([
        fetchData(`${API_URL}/competitions`),
        fetchData(`${API_URL}/participants`)
    ]).then(([competitions, participants]) => {
        const filterSelect = document.getElementById("filterCompetition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.textContent = competition.competition_name;
            filterSelect.appendChild(option);
        });
        
        window.allParticipants = participants;
        loadParticipants(participants);
    }).catch(() => showError('participantsList', 'Error loading participants'));
}

function filterParticipants() {
    const competitionId = document.getElementById("filterCompetition").value;
    const status = document.getElementById("filterStatus").value;
    
    let filtered = window.allParticipants;
    if (competitionId) {
        filtered = filtered.filter(p => p.competition_id == competitionId);
    }
    if (status) {
        filtered = filtered.filter(p => p.status === status);
    }
    loadParticipants(filtered);
}

function loadParticipants(participants) {
    if (participants.length === 0) {
        document.getElementById("participantsList").innerHTML = `
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
        const statusColor = participant.status === 'done' ? '#28a745' : 
                           participant.status === 'ongoing' ? '#ffc107' : '#dc3545';
        
        html += `
            <div class="dashboard-card" style="text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <h3>${participant.participant_name}</h3>
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
                        <p><strong>Event Type:</strong> ${participant.type_name || 'N/A'}</p>
                        <p><strong>Performance:</strong> ${participant.performance_title || 'N/A'}</p>
                    </div>
                    <div>
                        <p><strong>School/Org:</strong> ${participant.school_organization || 'N/A'}</p>
                        ${participant.height ? `<p><strong>Height:</strong> ${participant.height}</p>` : ''}
                    </div>
                </div>
                ${participant.performance_description ? `
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <strong>Performance Description:</strong><br>
                        <span style="color: #666;">${participant.performance_description}</span>
                    </div>
                ` : ''}
                <div style="margin-top: 15px;">
                    <button onclick="viewParticipantDetails(${participant.participant_id})" class="card-button">View Details</button>
                    <button onclick="editParticipant(${participant.participant_id})" class="card-button">Edit</button>
                    <button onclick="updateRegistrationStatus(${participant.participant_id}, '${participant.status}')" class="card-button">Update Status</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    document.getElementById("participantsList").innerHTML = html;
}

function viewParticipantDetails(id) {
    clearIntervals();
    fetchData(`${API_URL}/participant/${id}`)
        .then(participant => {
            const statusColor = participant.status === 'done' ? '#28a745' : 
                               participant.status === 'ongoing' ? '#ffc107' : '#dc3545';
            
            let html = `
                <h2>Participant Details</h2>
                <div class="dashboard-card" style="text-align: left; max-width: 800px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>${participant.participant_name}</h3>
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
                            <p><strong>Event Type:</strong> ${participant.type_name || 'N/A'}</p>
                            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${participant.status.toUpperCase()}</span></p>
                        </div>
                    </div>
                    <div style="margin-top: 25px;">
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Performance Information</h4>
                        <p><strong>Performance Title:</strong> ${participant.performance_title || 'Not specified'}</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            <strong>Description:</strong><br>${participant.performance_description || 'No description provided'}
                        </div>
                    </div>
            `;
            
            if (participant.is_pageant) {
                html += `
                    <div style="margin-top: 25px;">
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Pageant Information</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <p><strong>Height:</strong> ${participant.height || 'Not provided'}</p>
                                <p><strong>Contestant Number:</strong> ${participant.contestant_number || 'Not assigned'}</p>
                            </div>
                            <div>
                                <p><strong>Special Talents:</strong></p>
                                <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">
                                    ${participant.talents || 'Not specified'}
                                </div>
                            </div>
                        </div>
                        ${participant.special_awards ? `
                            <div style="margin-top: 15px;">
                                <p><strong>Awards & Achievements:</strong></p>
                                <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">
                                    ${participant.special_awards}
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
                    <button onclick="editParticipant(${participant.participant_id})" class="card-button">Edit Participant</button>
                    <button onclick="updateRegistrationStatus(${participant.participant_id}, '${participant.status}')" class="card-button">Update Status</button>
                </div>
            `;
            
            document.getElementById("content").innerHTML = html;
        })
        .catch(() => showNotification('Error loading participant details', 'error'));
}

function updateRegistrationStatus(participantId, currentStatus) {
    const statusOptions = {
        'pending': 'ongoing',
        'ongoing': 'done',
        'done': 'pending'
    };
    
    const nextStatus = statusOptions[currentStatus];
    
    if (confirm(`Change status to "${nextStatus.toUpperCase()}"?`)) {
        putData(`${API_URL}/update-participant-status/${participantId}`, { status: nextStatus })
            .then(data => {
                if (data.success) {
                    showNotification(`Status updated to ${nextStatus.toUpperCase()}`, 'success');
                    setTimeout(() => showViewParticipants(), 1000);
                } else {
                    showNotification('Error: ' + data.error, 'error');
                }
            })
            .catch(() => showNotification('Error updating status', 'error'));
    }
}

function editParticipant(participantId) {
    clearIntervals();
    fetchData(`${API_URL}/participant/${participantId}`)
        .then(participant => {
            document.getElementById("content").innerHTML = `
                <h2>Edit Participant</h2>
                <form id="editParticipantForm" style="max-width: 800px;">
                    <div class="form-section">
                        <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin-bottom: 20px;">Basic Information</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label for="participant_name">Participant Name:</label>
                                <input type="text" id="participant_name" value="${participant.participant_name}" required>
                            </div>
                            <div>
                                <label for="email">Email Address:</label>
                                <input type="email" id="email" value="${participant.email}" required>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                            <div>
                                <label for="phone">Phone Number:</label>
                                <input type="tel" id="phone" value="${participant.phone || ''}">
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
                        <input type="text" id="school_organization" value="${participant.school_organization || ''}">
                    </div>
                    
                    <div class="form-section">
                        <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin: 30px 0 20px 0;">Competition Details</h3>
                        <label for="competition">Select Competition:</label>
                        <select id="competition" required><option value="">Choose Competition</option></select>
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px;">
                            <div>
                                <label for="performance_title">Performance Title:</label>
                                <input type="text" id="performance_title" value="${participant.performance_title || ''}">
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
                        <textarea id="performance_description" rows="3">${participant.performance_description || ''}</textarea>
                    </div>
                    
                    <div class="form-section">
                        <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin: 30px 0 20px 0;">Additional Information</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label for="contestant_number">Contestant Number:</label>
                                <input type="text" id="contestant_number" value="${participant.contestant_number || ''}">
                            </div>
                            <div>
                                <label for="height">Height:</label>
                                <input type="text" id="height" value="${participant.height || ''}">
                            </div>
                        </div>
                        <label for="photo_url">Photo URL:</label>
                        <input type="url" id="photo_url" value="${participant.photo_url || ''}">
                        <label for="talents">Special Talents:</label>
                        <textarea id="talents" rows="3">${participant.talents || ''}</textarea>
                        <label for="special_awards">Awards:</label>
                        <textarea id="special_awards" rows="3">${participant.special_awards || ''}</textarea>
                    </div>
                    
                    <div style="margin-top: 40px; text-align: center;">
                        <button type="submit" class="card-button" style="padding: 15px 40px; font-size: 18px;">Update Participant</button>
                        <button type="button" onclick="showViewParticipants()" class="secondary" style="margin-left: 15px; padding: 15px 30px; font-size: 16px;">Cancel</button>
                    </div>
                </form>
            `;

            fetchData(`${API_URL}/competitions`).then(competitions => {
                const competitionSelect = document.getElementById("competition");
                competitions.forEach(competition => {
                    const option = document.createElement("option");
                    option.value = competition.competition_id;
                    option.textContent = `${competition.competition_name} (${competition.type_name})`;
                    if (competition.competition_id === participant.competition_id) {
                        option.selected = true;
                    }
                    competitionSelect.appendChild(option);
                });
            });

            document.getElementById("editParticipantForm").onsubmit = function(event) {
                event.preventDefault();

                const participantData = {
                    participant_name: document.getElementById("participant_name").value,
                    contestant_number: document.getElementById("contestant_number").value || null,
                    photo_url: document.getElementById("photo_url").value || null,
                    email: document.getElementById("email").value,
                    phone: document.getElementById("phone").value || null,
                    age: document.getElementById("age").value,
                    gender: document.getElementById("gender").value,
                    school_organization: document.getElementById("school_organization").value || null,
                    performance_title: document.getElementById("performance_title").value || null,
                    performance_description: document.getElementById("performance_description").value || null,
                    competition_id: document.getElementById("competition").value,
                    status: document.getElementById("status").value,
                    height: document.getElementById("height").value || null,
                    measurements: null,
                    talents: document.getElementById("talents").value || null,
                    special_awards: document.getElementById("special_awards").value || null
                };

                putData(`${API_URL}/update-participant/${participantId}`, participantData)
                    .then(data => {
                        if (data.success) {
                            showNotification('Participant updated successfully!', 'success');
                            setTimeout(() => showViewParticipants(), 1500);
                        } else {
                            showNotification('Error: ' + data.error, 'error');
                        }
                    })
                    .catch(() => showNotification('Error updating participant', 'error'));
            };
        })
        .catch(() => showNotification('Error loading participant', 'error'));
}

// View Judges
function showViewJudges() {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>View Judges</h2>
        <p style="margin-bottom: 20px;">View judge assignments and expertise areas.</p>
        <div id="judgesList"><div class="loading">Loading judges...</div></div>
    `;

    fetchData(`${API_URL}/judges`)
        .then(judges => {
            if (judges.length === 0) {
                document.getElementById("judgesList").innerHTML = `
                    <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                        <h3>No Judges Assigned</h3>
                        <p>Contact the administrator to add judges to competitions.</p>
                    </div>
                `;
                return;
            }

            let html = '<div style="display: grid; gap: 20px;">';
            judges.forEach(judge => {
                html += `
                    <div class="dashboard-card" style="text-align: left;">
                        <h3>${judge.judge_name}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                            <div>
                                <p><strong>Email:</strong> ${judge.email}</p>
                                <p><strong>Phone:</strong> ${judge.phone || 'Not provided'}</p>
                                <p><strong>Experience:</strong> ${judge.experience_years} years</p>
                            </div>
                            <div>
                                <p><strong>Competition:</strong> ${judge.competition_name || 'Not assigned'}</p>
                                <p><strong>Event Type:</strong> ${judge.type_name || 'N/A'}</p>
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
                            <button onclick="viewJudgeDetails(${judge.judge_id})" class="card-button">View Details</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            document.getElementById("judgesList").innerHTML = html;
        })
        .catch(() => showError('judgesList', 'Error loading judges'));
}

function viewJudgeDetails(id) {
    clearIntervals();
    fetchData(`${API_URL}/judge/${id}`)
        .then(judge => {
            document.getElementById("content").innerHTML = `
                <h2>Judge Details</h2>
                <div class="dashboard-card" style="text-align: left; max-width: 700px; margin: 0 auto;">
                    <h3>${judge.judge_name}</h3>
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
                            <p><strong>Event Type:</strong> ${judge.type_name || 'N/A'}</p>
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
                        <h4 style="color: #800020; border-bottom: 1px solid #800020; padding-bottom: 5px;">Credentials</h4>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            ${judge.credentials || 'No credentials provided'}
                        </div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="showViewJudges()" class="secondary">Back to Judges</button>
                </div>
            `;
        })
        .catch(() => showNotification('Error loading judge details', 'error'));
}

// Reports
function showReports() {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>Reports & Analytics</h2>
        <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>Available Reports:</strong>
            <p style="color: #1976d2; margin-top: 8px;">Generate comprehensive reports for competitions, participants, and registration status.</p>
        </div>
        <div id="reportsContent"><div class="loading">Loading report data...</div></div>
    `;

    Promise.all([
        fetchData(`${API_URL}/competitions`),
        fetchData(`${API_URL}/participants`),
        fetchData(`${API_URL}/judges`)
    ]).then(([competitions, participants, judges]) => {
        generateReports(competitions, participants, judges);
    }).catch(() => showError('reportsContent', 'Error loading report data'));
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
            <h3>Registration Status Breakdown</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
    `;
    
    Object.entries(statusGroups).forEach(([status, participants]) => {
        const statusColor = status === 'done' ? '#28a745' : status === 'ongoing' ? '#ffc107' : '#dc3545';
        const percentage = totalParticipants > 0 ? ((participants.length / totalParticipants) * 100).toFixed(1) : 0;
        
        html += `
            <div style="background: white; border: 2px solid ${statusColor}; border-radius: 8px; padding: 15px; text-align: center;">
                <h4 style="color: ${statusColor}; font-size: 1.5em;">${participants.length}</h4>
                <p style="font-weight: 600; text-transform: uppercase;">${status}</p>
                <p style="color: #666; font-size: 14px;">${percentage}% of total</p>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div class="report-section">
            <h3>Event Type Distribution</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: white; border: 2px solid #800020; border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: #800020; font-size: 2em;">${pageantParticipants}</h4>
                    <p style="font-weight: 600;">Beauty Pageant Participants</p>
                    <p style="color: #666; font-size: 14px;">${totalParticipants > 0 ? ((pageantParticipants / totalParticipants) * 100).toFixed(1) : 0}% of total</p>
                </div>
                <div style="background: white; border: 2px solid #17a2b8; border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: #17a2b8; font-size: 2em;">${regularParticipants}</h4>
                    <p style="font-weight: 600;">Performance Event Participants</p>
                    <p style="color: #666; font-size: 14px;">${totalParticipants > 0 ? ((regularParticipants / totalParticipants) * 100).toFixed(1) : 0}% of total</p>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>Competition Details</h3>
    `;
    
    competitions.forEach(competition => {
        const competitionParticipants = participantsByCompetition[competition.competition_id] || [];
        const typeColor = competition.is_pageant ? '#800020' : '#17a2b8';
        
        html += `
            <div style="background: white; border-left: 5px solid ${typeColor}; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h4 style="color: #800020;">${competition.competition_name}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 10px;">
                    <div>
                        <p><strong>Event Type:</strong> ${competition.type_name || 'N/A'}</p>
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
    
    html += `
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
    `;
    
    document.getElementById("reportsContent").innerHTML = html;
}

// Scoring Overview
function showScoringOverview() {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>Competition Scoring Overview</h2>
        <div style="margin-bottom: 30px;">
            <label for="scoringCompetition" style="font-weight: 600; color: #800020; margin-right: 10px;">Select Competition:</label>
            <select id="scoringCompetition" onchange="loadScoringOverview()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                <option value="">Choose Competition</option>
            </select>
        </div>
        <div id="scoringContent">
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>Select a Competition</h3>
                <p>Choose a competition to view scoring progress and judge assignments.</p>
            </div>
        </div>
    `;

    fetchData(`${API_URL}/competitions`).then(competitions => {
        const select = document.getElementById("scoringCompetition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.textContent = competition.competition_name;
            select.appendChild(option);
        });
    });
}

function loadScoringOverview() {
    const competitionId = document.getElementById("scoringCompetition").value;
    if (!competitionId) {
        document.getElementById("scoringContent").innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>Select a Competition</h3>
                <p>Choose a competition to view scoring progress.</p>
            </div>
        `;
        return;
    }

    document.getElementById("scoringContent").innerHTML = '<div class="loading">Loading scoring overview...</div>';

    Promise.all([
        fetchData(`${API_URL}/competition/${competitionId}`),
        fetchData(`${API_URL}/participants/${competitionId}`),
        fetchData(`${API_URL}/judges`),
        fetchData(`${API_URL}/overall-scores/${competitionId}`).catch(() => [])
    ]).then(([competition, participants, allJudges, scores]) => {
        const judges = allJudges.filter(j => j.competition_id == competitionId);
        
        const totalPossibleScores = participants.length * judges.length;
        const completedScores = scores.length;
        const progressPercentage = totalPossibleScores > 0 ? ((completedScores / totalPossibleScores) * 100).toFixed(1) : 0;
        
        let html = `
            <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                <h3>${competition.competition_name}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 15px 0;">
                    <div>
                        <p><strong>Event Type:</strong> ${competition.type_name}</p>
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
                            <div style="background: #28a745; height: 100%; width: ${progressPercentage}%; border-radius: 10px;"></div>
                        </div>
                        <p style="font-size: 14px; color: #666;">${completedScores}/${totalPossibleScores} scores (${progressPercentage}%)</p>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="dashboard-card" style="text-align: left;">
                    <h4 style="color: #800020; margin-bottom: 15px;">Participant Status</h4>
        `;
        
        if (participants.length === 0) {
            html += '<p style="color: #666;">No participants registered.</p>';
        } else {
            participants.forEach(participant => {
                const participantScores = scores.filter(s => s.participant_id === participant.participant_id);
                const judgeCount = judges.length;
                const scoredByJudges = participantScores.length;
                const statusColor = scoredByJudges === judgeCount ? '#28a745' : scoredByJudges > 0 ? '#ffc107' : '#dc3545';
                const statusText = scoredByJudges === judgeCount ? 'Complete' : scoredByJudges > 0 ? 'Partial' : 'Pending';
                
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: #f8f9fa; border-radius: 5px;">
                        <span>${participant.participant_name}</span>
                        <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${statusColor}; color: white;">
                            ${statusText} (${scoredByJudges}/${judgeCount})
                        </span>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
                <div class="dashboard-card" style="text-align: left;">
                    <h4 style="color: #800020; margin-bottom: 15px;">Judge Assignment</h4>
        `;
        
        if (judges.length === 0) {
            html += '<p style="color: #666;">No judges assigned.</p>';
        } else {
            judges.forEach(judge => {
                const judgeScores = scores.filter(s => s.judge_id === judge.judge_id);
                const participantCount = participants.length;
                const scoredParticipants = judgeScores.length;
                const statusColor = scoredParticipants === participantCount ? '#28a745' : scoredParticipants > 0 ? '#ffc107' : '#dc3545';
                const statusText = scoredParticipants === participantCount ? 'Complete' : scoredParticipants > 0 ? 'In Progress' : 'Not Started';
                
                html += `
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
        
        html += `
                </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="viewCompetitionCriteria(${competitionId}, '${escapeQuotes(competition.competition_name)}')" class="card-button">View Criteria</button>
                <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
            </div>
        `;
        
        document.getElementById("scoringContent").innerHTML = html;
    }).catch(() => showError('scoringContent', 'Error loading scoring overview'));
}

// Utility Functions
function fetchData(url) {
    return fetch(url).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    });
}

function postData(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    });
}

function putData(url, data) {
    return fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    });
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
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    notification.style.background = colors[type] || colors.info;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
}

function showError(elementId, message) {
    document.getElementById(elementId).innerHTML = `
        <div style="text-align: center; padding: 40px; background: #fff3cd; border-radius: 8px;">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function escapeQuotes(str) {
    return str.replace(/'/g, "\\'");
}

function clearIntervals() {
    if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        statusUpdateInterval = null;
    }
}

// Connection Monitor
function initializeConnectionMonitor() {
    window.addEventListener('online', () => {
        showNotification('You are back online!', 'success');
    });

    window.addEventListener('offline', () => {
        showNotification('You are offline. Some features may not work.', 'warning');
    });
}

// ADD THESE FUNCTIONS TO YOUR EXISTING staff-app.js FILE

// ==========================================
// NEW: VIEW COMPETITION RANKINGS
// ==========================================
function showCompetitionRankings() {
    clearIntervals();
    document.getElementById("content").innerHTML = `
        <h2>Competition Rankings</h2>
        <div style="margin-bottom: 30px;">
            <label for="rankingsCompetition" style="font-weight: 600; color: #800020; margin-right: 10px;">Select Competition:</label>
            <select id="rankingsCompetition" onchange="loadCompetitionRankings()" style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                <option value="">Choose Competition</option>
            </select>
            <button onclick="printRankings()" id="printBtn" style="display: none; margin-left: 15px;" class="card-button">
                🖨️ Print Rankings
            </button>
        </div>
        <div id="rankingsContent">
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>Select a Competition</h3>
                <p>Choose a competition to view the current rankings.</p>
            </div>
        </div>
    `;

    fetchData(`${API_URL}/competitions`).then(competitions => {
        const select = document.getElementById("rankingsCompetition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.setAttribute('data-is-pageant', competition.is_pageant);
            option.setAttribute('data-name', competition.competition_name);
            option.textContent = competition.competition_name;
            select.appendChild(option);
        });
    });
}

function loadCompetitionRankings() {
    const select = document.getElementById("rankingsCompetition");
    const competitionId = select.value;
    
    if (!competitionId) {
        document.getElementById("rankingsContent").innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>Select a Competition</h3>
                <p>Choose a competition to view rankings.</p>
            </div>
        `;
        document.getElementById("printBtn").style.display = 'none';
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const isPageant = selectedOption.getAttribute('data-is-pageant') === '1';
    const competitionName = selectedOption.getAttribute('data-name');

    document.getElementById("rankingsContent").innerHTML = '<div class="loading">Loading rankings...</div>';
    document.getElementById("printBtn").style.display = 'inline-block';

    // Store for printing
    window.currentCompetitionName = competitionName;
    window.currentCompetitionId = competitionId;

    const endpoint = isPageant ? 
        `${API_URL}/pageant-leaderboard/${competitionId}` : 
        `${API_URL}/overall-scores/${competitionId}`;

    fetchData(endpoint)
        .then(scores => {
            if (scores.length === 0) {
                document.getElementById("rankingsContent").innerHTML = `
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
    // Process scores for rankings
    let rankings = [];
    
    if (isPageant) {
        // Pageant scores are already averaged
        rankings = scores.map(score => ({
            participant_name: score.participant_name,
            contestant_number: score.contestant_number,
            performance_title: score.performance_title,
            average_score: parseFloat(score.average_score),
            judge_count: score.judge_count,
            segments_completed: score.segments_completed
        }));
    } else {
        // Regular competition - calculate averages per participant
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
    
    // Sort by score descending
    rankings.sort((a, b) => b.average_score - a.average_score);
    
    // Store for printing
    window.currentRankings = rankings;
    window.isPageantRankings = isPageant;
    
    // Display rankings
    let html = `
        <div id="printableRankings">
            <div class="print-header" style="display: none;">
                <h1 style="color: #800020; text-align: center; margin-bottom: 10px;">Competition Rankings</h1>
                <h2 style="text-align: center; color: #666; margin-bottom: 20px;">${competitionName}</h2>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">
                    Generated on ${new Date().toLocaleString()}
                </p>
            </div>
            
            <div style="background: #800020; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;" class="no-print">
                <h3 style="margin: 0; color: white;">${competitionName}</h3>
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
                <td style="padding: 15px; font-weight: 600;">${participant.participant_name}</td>
                ${isPageant ? `<td style="padding: 15px; text-align: center;">${participant.contestant_number || 'N/A'}</td>` : ''}
                <td style="padding: 15px;">${participant.performance_title || 'N/A'}</td>
                <td style="padding: 15px; text-align: center; font-size: 20px; font-weight: bold; color: #800020;">
                    ${participant.average_score.toFixed(2)}
                </td>
                <td style="padding: 15px; text-align: center;">${participant.judge_count}</td>
                ${isPageant ? `<td style="padding: 15px; text-align: center;">${participant.segments_completed || 'N/A'}</td>` : ''}
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;" class="no-print">
                <h4 style="color: #800020;">Ranking Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div>
                        <strong>Total Participants:</strong> ${rankings.length}
                    </div>
                    <div>
                        <strong>Highest Score:</strong> ${rankings[0]?.average_score.toFixed(2) || 'N/A'}
                    </div>
                    <div>
                        <strong>Lowest Score:</strong> ${rankings[rankings.length - 1]?.average_score.toFixed(2) || 'N/A'}
                    </div>
                    <div>
                        <strong>Average Score:</strong> ${(rankings.reduce((sum, p) => sum + p.average_score, 0) / rankings.length).toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;" class="no-print">
            <button onclick="printRankings()" class="card-button">🖨️ Print Rankings</button>
            <button onclick="exportRankingsCSV()" class="card-button">📥 Export to CSV</button>
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
    `;
    
    document.getElementById("rankingsContent").innerHTML = html;
}

// ==========================================
// PRINT FUNCTIONALITY
// ==========================================
function printRankings() {
    // Show print-specific elements
    const printHeaders = document.querySelectorAll('.print-header');
    printHeaders.forEach(header => header.style.display = 'block');
    
    // Hide no-print elements
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(element => element.style.display = 'none');
    
    // Print
    window.print();
    
    // Restore after print
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
    
    // Create CSV content
    let csv = `Competition Rankings - ${competitionName}\n`;
    csv += `Generated on ${new Date().toLocaleString()}\n\n`;
    
    // Headers
    if (isPageant) {
        csv += 'Rank,Participant Name,Contestant Number,Performance,Average Score,Judges,Segments Completed\n';
    } else {
        csv += 'Rank,Participant Name,Performance,Average Score,Judges\n';
    }
    
    // Data rows
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
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${competitionName.replace(/\s+/g, '_')}_Rankings_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Rankings exported successfully!', 'success');
}


console.log('✅ Rankings view and print functionality loaded for staff dashboard');

// Initialize
showDashboard();