// Clean Admin Dashboard JavaScript - Maroon & White Theme
// Bug-free, organized code with Year/Course instead of School Org

const API_URL = 'https://mseufci-judgingsystem.up.railway.app';

// ================================================
// AUTHENTICATION & INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    showDashboard();
});

function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('userInfo').innerHTML = `
        <div style="color: white; text-align: right;">
            <div style="font-weight: 600;">${user.username}</div>
            <div style="font-size: 12px; opacity: 0.9;">Administrator</div>
            <button onclick="logout()" style="margin-top: 10px; padding: 8px 16px; background: white; color: #800020; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                Logout
            </button>
        </div>
    `;
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ================================================
// DASHBOARD
// ================================================

function showDashboard() {
    document.getElementById("content").innerHTML = `
        <h2>Admin Dashboard</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;">
            <div class="dashboard-card">
                <h3>Event Types</h3>
                <p>Manage event categories</p>
                <button onclick="showEventTypes()" class="card-button">Manage Events</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Unlock Requests</h3>
                <p>Review judge requests</p>
                <button onclick="viewUnlockRequests()" class="card-button" id="unlockBtn">View Requests</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Competitions</h3>
                <p>Create and manage competitions</p>
                <button onclick="showCreateCompetitionForm()" class="card-button">New Competition</button>
                <button onclick="showViewCompetitions()" class="card-button">View All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Judges</h3>
                <p>Manage judges</p>
                <button onclick="showAddJudgeForm()" class="card-button">Add Judge</button>
                <button onclick="showViewJudges()" class="card-button">View All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Participants</h3>
                <p>Manage participants</p>
                <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                <button onclick="showViewParticipants()" class="card-button">View All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Results</h3>
                <p>View scoring results</p>
                <button onclick="showScoringResults()" class="card-button">View Results</button>
            </div>
        </div>
    `;
    
    setTimeout(showUnlockRequestsBadge, 500);
}

// ================================================
// EVENT TYPES
// ================================================

function showEventTypes() {
    document.getElementById("content").innerHTML = `
        <h2>Event Types Management</h2>
        
        <div style="margin-bottom: 30px;">
            <button onclick="showCreateEventTypeForm()" class="card-button">Add New Event Type</button>
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
        
        <div id="eventTypesList"><div class="loading">Loading...</div></div>
    `;

    fetch(`${API_URL}/event-types`)
    .then(response => response.json())
    .then(eventTypes => {
        let html = `<table><tr><th>Event Type</th><th>Description</th><th>Category</th><th>Actions</th></tr>`;
        
        eventTypes.forEach(et => {
            const badge = et.is_pageant ? 
                '<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: #800020;">PAGEANT</span>' :
                '<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: #666;">REGULAR</span>';
            
            html += `
                <tr>
                    <td><strong>${et.type_name}</strong></td>
                    <td>${et.description || '-'}</td>
                    <td>${badge}</td>
                    <td>
                        <button onclick="deleteEventType(${et.event_type_id})" style="background: #dc3545;">Delete</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</table>';
        document.getElementById("eventTypesList").innerHTML = html;
    })
    .catch(error => {
        document.getElementById("eventTypesList").innerHTML = '<p class="alert alert-error">Error loading event types.</p>';
    });
}

function showCreateEventTypeForm() {
    document.getElementById("content").innerHTML = `
        <h2>Create New Event Type</h2>
        
        <form id="createEventTypeForm" style="max-width: 600px;">
            <label>Event Type Name:</label>
            <input type="text" id="type_name" required>
            
            <label>Description:</label>
            <textarea id="description" rows="3"></textarea>
            
            <label>Event Category:</label>
            <select id="is_pageant" required>
                <option value="0">Regular Event</option>
                <option value="1">Pageant Event</option>
            </select>
            
            <input type="submit" value="Create Event Type">
            <button type="button" onclick="showEventTypes()" class="secondary">Cancel</button>
        </form>
    `;

    document.getElementById("createEventTypeForm").onsubmit = function(e) {
        e.preventDefault();

        fetch(`${API_URL}/create-event-type`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type_name: document.getElementById("type_name").value,
                description: document.getElementById("description").value,
                is_pageant: document.getElementById("is_pageant").value === "1"
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Event type created!');
                showEventTypes();
            } else {
                alert('Error: ' + data.error);
            }
        });
    };
}

function deleteEventType(id) {
    if (confirm('Delete this event type?')) {
        fetch(`${API_URL}/delete-event-type/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Deleted!');
                showEventTypes();
            } else {
                alert('Error: ' + data.error);
            }
        });
    }
}

// ================================================
// COMPETITIONS
// ================================================

function showCreateCompetitionForm() {
    document.getElementById("content").innerHTML = `
        <h2>Create New Competition</h2>
        <form id="createCompetitionForm" style="max-width: 700px;">
            <label>Competition Name:</label>
            <input type="text" id="competition_name" required>
            
            <label>Event Type:</label>
            <select id="event_type_id" required>
                <option value="">Select Event Type</option>
            </select>
            
            <label>Competition Date:</label>
            <input type="date" id="competition_date" required>
            
            <label>Description:</label>
            <textarea id="event_description" rows="3"></textarea>
            
            <input type="submit" value="Create Competition">
            <button type="button" onclick="showDashboard()" class="secondary">Cancel</button>
        </form>
    `;

    fetch(`${API_URL}/event-types`)
    .then(response => response.json())
    .then(eventTypes => {
        const select = document.getElementById("event_type_id");
        eventTypes.forEach(et => {
            const option = document.createElement("option");
            option.value = et.event_type_id;
            option.textContent = `${et.type_name} ${et.is_pageant ? '(Pageant)' : '(Regular)'}`;
            select.appendChild(option);
        });
    });

    document.getElementById("createCompetitionForm").onsubmit = function(e) {
        e.preventDefault();

        fetch(`${API_URL}/create-competition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                competition_name: document.getElementById("competition_name").value,
                event_type_id: document.getElementById("event_type_id").value,
                competition_date: document.getElementById("competition_date").value,
                event_description: document.getElementById("event_description").value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Competition created!');
                showViewCompetitions();
            } else {
                alert('Error: ' + data.error);
            }
        });
    };
}

function showViewCompetitions() {
    document.getElementById("content").innerHTML = `
        <h2>Manage Competitions</h2>
        <div style="margin-bottom: 20px;">
            <button onclick="showCreateCompetitionForm()" class="card-button">Add New Competition</button>
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
        <div id="competitionsList"><div class="loading">Loading...</div></div>
    `;

    fetch(`${API_URL}/competitions`)
    .then(response => response.json())
    .then(competitions => {
        let html = '<div style="display: grid; gap: 20px;">';
        
        competitions.forEach(comp => {
            const badge = comp.is_pageant ? 
                '<span style="background: #800020; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">PAGEANT</span>' :
                '<span style="background: #666; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">REGULAR</span>';
            
            html += `
                <div class="dashboard-card" style="text-align: left;">
                    <h3>${comp.competition_name} ${badge}</h3>
                    <div class="grid-2" style="margin: 15px 0;">
                        <div>
                            <p><strong>Event Type:</strong> ${comp.type_name}</p>
                            <p><strong>Date:</strong> ${comp.competition_date}</p>
                        </div>
                        <div>
                            <p><strong>Participants:</strong> ${comp.participant_count || 0}</p>
                            <p><strong>Judges:</strong> ${comp.judge_count || 0}</p>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <button onclick="manageCriteria(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">Manage Criteria</button>
                        ${comp.is_pageant ? `<button onclick="setupPageant(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">Setup Pageant</button>` : ''}
                        <button onclick="deleteCompetition(${comp.competition_id})" style="background: #dc3545;">Delete</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (competitions.length === 0) {
            html = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <h3>No Competitions Yet</h3>
                    <button onclick="showCreateCompetitionForm()" class="card-button">Create Competition</button>
                </div>
            `;
        }
        
        document.getElementById("competitionsList").innerHTML = html;
    });
}

function deleteCompetition(id) {
    if (confirm('Delete this competition? This will delete all related data.')) {
        fetch(`${API_URL}/delete-competition/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Competition deleted!');
                showViewCompetitions();
            } else {
                alert('Error: ' + data.error);
            }
        });
    }
}

// ================================================
// CRITERIA MANAGEMENT
// ================================================

function manageCriteria(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>Manage Judging Criteria</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div style="margin-bottom: 20px;">
            <button onclick="addCriterion()" class="card-button">Add Criterion</button>
            <button onclick="showViewCompetitions()" class="secondary">Back</button>
        </div>
        
        <form id="criteriaForm">
            <input type="hidden" id="competition_id" value="${competitionId}">
            
            <div id="criteriaContainer"><div class="loading">Loading criteria...</div></div>
            
            <div style="margin-top: 30px;">
                <button type="button" onclick="saveCriteria()" class="card-button">Save All Criteria</button>
            </div>
            
            <div id="percentageTotal" style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; text-align: center;">
                <strong>Total Percentage: <span id="totalPercentage">0</span>%</strong>
            </div>
        </form>
    `;

    fetch(`${API_URL}/competition-criteria/${competitionId}`)
    .then(response => response.json())
    .then(criteria => {
        if (criteria.length === 0) {
            document.getElementById("criteriaContainer").innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>No Criteria Set</h3>
                    <p>Add your first criterion to get started!</p>
                </div>
            `;
        } else {
            displayCriteria(criteria);
        }
        updatePercentageTotal();
    });
}

function displayCriteria(criteria) {
    let html = '';
    criteria.forEach((c, index) => {
        html += `
            <div class="criterion-item">
                <div style="display: grid; grid-template-columns: auto 1fr auto auto; gap: 15px; align-items: center;">
                    <div style="font-weight: bold; color: #800020;">#${c.order_number || index + 1}</div>
                    <div style="display: grid; gap: 10px;">
                        <input type="text" class="criteria-name" value="${c.criteria_name}" placeholder="Criterion Name" style="font-weight: 600;">
                        <textarea class="criteria-description" placeholder="Description" rows="2">${c.description || ''}</textarea>
                    </div>
                    <div>
                        <label style="font-size: 12px;">Percentage:</label>
                        <input type="number" class="criteria-percentage" value="${c.percentage}" min="0" max="100" step="0.1" style="width: 80px; text-align: center;" onchange="updatePercentageTotal()">
                        <span>%</span>
                    </div>
                    <div>
                        <button type="button" onclick="removeCriterion(this)" style="background: #dc3545;">Remove</button>
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById("criteriaContainer").innerHTML = html;
}

function addCriterion() {
    const container = document.getElementById("criteriaContainer");
    const count = container.querySelectorAll('.criterion-item').length;
    
    const div = document.createElement('div');
    div.className = 'criterion-item';
    div.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr auto auto; gap: 15px; align-items: center;">
            <div style="font-weight: bold; color: #800020;">#${count + 1}</div>
            <div style="display: grid; gap: 10px;">
                <input type="text" class="criteria-name" placeholder="Criterion Name" style="font-weight: 600;">
                <textarea class="criteria-description" placeholder="Description" rows="2"></textarea>
            </div>
            <div>
                <label style="font-size: 12px;">Percentage:</label>
                <input type="number" class="criteria-percentage" value="0" min="0" max="100" step="0.1" style="width: 80px; text-align: center;" onchange="updatePercentageTotal()">
                <span>%</span>
            </div>
            <div>
                <button type="button" onclick="removeCriterion(this)" style="background: #dc3545;">Remove</button>
            </div>
        </div>
    `;
    
    if (container.innerHTML.includes('No Criteria Set')) {
        container.innerHTML = '';
    }
    
    container.appendChild(div);
    updatePercentageTotal();
}

function removeCriterion(button) {
    button.closest('.criterion-item').remove();
    updatePercentageTotal();
    
    const criteria = document.querySelectorAll('.criterion-item');
    criteria.forEach((item, index) => {
        item.querySelector('div[style*="font-weight: bold"]').textContent = `#${index + 1}`;
    });
}

function updatePercentageTotal() {
    const inputs = document.querySelectorAll('.criteria-percentage');
    let total = 0;
    inputs.forEach(input => total += parseFloat(input.value) || 0);
    
    const span = document.getElementById('totalPercentage');
    if (span) {
        span.textContent = total.toFixed(1);
        const container = document.getElementById('percentageTotal');
        if (Math.abs(total - 100) < 0.1) {
            container.style.background = '#d4edda';
            container.style.border = '2px solid #28a745';
        } else {
            container.style.background = '#fff3cd';
            container.style.border = '2px solid #ffc107';
        }
    }
}

function saveCriteria() {
    const competitionId = document.getElementById('competition_id').value;
    const items = document.querySelectorAll('.criterion-item');
    
    if (items.length === 0) {
        alert('Add at least one criterion.');
        return;
    }
    
    const criteria = [];
    let total = 0;
    
    items.forEach((item, index) => {
        const name = item.querySelector('.criteria-name').value.trim();
        const description = item.querySelector('.criteria-description').value.trim();
        const percentage = parseFloat(item.querySelector('.criteria-percentage').value) || 0;
        
        if (!name) {
            alert(`Enter a name for criterion #${index + 1}`);
            return;
        }
        
        criteria.push({
            criteria_name: name,
            description: description,
            percentage: percentage,
            max_score: 100,
            order_number: index + 1
        });
        
        total += percentage;
    });
    
    if (Math.abs(total - 100) > 0.1) {
        alert(`Total must equal 100%. Current: ${total.toFixed(1)}%`);
        return;
    }
    
    if (criteria.length === 0) return;
    
    fetch(`${API_URL}/save-competition-criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competition_id: competitionId, criteria: criteria })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Criteria saved!');
            showViewCompetitions();
        } else {
            alert('Error: ' + data.error);
        }
    });
}

// ================================================
// PAGEANT SETUP
// ================================================

function setupPageant(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>Setup Multi-Day Pageant</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <form id="pageantSetupForm" style="max-width: 800px;">
            <label>Total Number of Days:</label>
            <select id="total_days" required>
                <option value="">Select Days</option>
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="4">4 Days</option>
                <option value="5">5 Days</option>
            </select>
            
            <label>Start Date:</label>
            <input type="date" id="start_date" required>
            
            <div id="dayInputs" style="display: none;"></div>
            
            <div id="submitSection" style="display: none; margin-top: 30px;">
                <button type="submit" class="card-button">Create Pageant Schedule</button>
                <button type="button" onclick="showViewCompetitions()" class="secondary">Cancel</button>
            </div>
        </form>
    `;

    fetch(`${API_URL}/competition/${competitionId}`)
    .then(response => response.json())
    .then(competition => {
        document.getElementById('start_date').value = competition.competition_date;
    });

    document.getElementById('total_days').addEventListener('change', function() {
        generateDayInputs(competitionId);
    });
}

function generateDayInputs(competitionId) {
    const totalDays = parseInt(document.getElementById('total_days').value);
    const startDate = document.getElementById('start_date').value;
    const dayInputsDiv = document.getElementById('dayInputs');
    const submitSection = document.getElementById('submitSection');
    
    if (!totalDays || !startDate) {
        dayInputsDiv.style.display = 'none';
        submitSection.style.display = 'none';
        return;
    }

    let html = '<h3>Setup Each Day</h3>';
    
    for (let day = 1; day <= totalDays; day++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + (day - 1));
        const formattedDate = dayDate.toISOString().split('T')[0];
        
        html += `
            <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                <h4>Day ${day} Setup</h4>
                
                <div class="grid-2">
                    <div>
                        <label>Date:</label>
                        <input type="date" id="day_${day}_date" value="${formattedDate}" required>
                    </div>
                    <div>
                        <label>Start Time:</label>
                        <input type="time" id="day_${day}_time" value="18:00">
                    </div>
                </div>
                
                <label>Description:</label>
                <input type="text" id="day_${day}_description" placeholder="e.g., Talent & Evening Gown Night" required>
                
                <label>Segments:</label>
                <div id="day_${day}_segments">
                    ${createSegmentInput(day, 1)}
                </div>
                
                <button type="button" class="add-segment-btn" data-day="${day}" style="background: #28a745; margin-top: 10px;">
                    Add Segment
                </button>
            </div>
        `;
    }
    
    dayInputsDiv.innerHTML = html;
    dayInputsDiv.style.display = 'block';
    submitSection.style.display = 'block';
    
    attachSegmentEventListeners();
    
    document.getElementById('pageantSetupForm').onsubmit = function(e) {
        e.preventDefault();
        submitPageantSetup(competitionId, totalDays);
    };
}

function createSegmentInput(day, segmentNum) {
    return `
        <div class="segment-input" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <div class="grid-2">
                <div>
                    <label>Segment Name:</label>
                    <select class="segment-select">
                        <option value="">Choose Segment</option>
                        <option value="Talent Competition">Talent Competition</option>
                        <option value="Long Gown">Long Gown</option>
                        <option value="Evening Gown">Evening Gown</option>
                        <option value="Swimsuit">Swimsuit</option>
                        <option value="Uniform">Uniform/Casual Wear</option>
                        <option value="Question & Answer">Question & Answer</option>
                        <option value="Interview">Interview</option>
                        <option value="custom">Custom (Type Below)</option>
                    </select>
                </div>
                <div>
                    <label>Custom Name:</label>
                    <input type="text" class="custom-segment-name" placeholder="If custom">
                </div>
            </div>
            
            <label>Description:</label>
            <textarea class="segment-description" rows="2"></textarea>
            
            <button type="button" class="remove-segment-btn" style="background: #dc3545; margin-top: 10px;">Remove</button>
        </div>
    `;
}

function attachSegmentEventListeners() {
    document.querySelectorAll('.add-segment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const segmentsDiv = document.getElementById(`day_${day}_segments`);
            const count = segmentsDiv.querySelectorAll('.segment-input').length + 1;
            segmentsDiv.insertAdjacentHTML('beforeend', createSegmentInput(day, count));
            attachRemoveListeners();
        });
    });
    
    attachRemoveListeners();
}

function attachRemoveListeners() {
    document.querySelectorAll('.remove-segment-btn').forEach(btn => {
        btn.onclick = function() {
            const segmentInput = this.closest('.segment-input');
            const segmentsDiv = segmentInput.parentElement;
            
            if (segmentsDiv.querySelectorAll('.segment-input').length > 1) {
                segmentInput.remove();
            } else {
                alert('Each day must have at least one segment.');
            }
        };
    });
}

function submitPageantSetup(competitionId, totalDays) {
    const pageantData = {
        competition_id: competitionId,
        total_days: totalDays,
        days: []
    };
    
    for (let day = 1; day <= totalDays; day++) {
        const dayDate = document.getElementById(`day_${day}_date`).value;
        const dayTime = document.getElementById(`day_${day}_time`).value;
        const dayDescription = document.getElementById(`day_${day}_description`).value.trim();
        
        if (!dayDate || !dayDescription) {
            alert(`Complete all fields for Day ${day}`);
            return;
        }
        
        const dayData = {
            day_number: day,
            date: dayDate.split('T')[0],
            time: dayTime,
            description: dayDescription,
            segments: []
        };
        
        const segmentsContainer = document.getElementById(`day_${day}_segments`);
        const segmentInputs = segmentsContainer.querySelectorAll('.segment-input');
        
        segmentInputs.forEach((segmentDiv, index) => {
            const segmentSelect = segmentDiv.querySelector('.segment-select');
            const customName = segmentDiv.querySelector('.custom-segment-name');
            const description = segmentDiv.querySelector('.segment-description');
            
            let segmentName = segmentSelect.value;
            
            if (segmentName === 'custom') {
                segmentName = customName.value.trim();
            }
            
            if (segmentName && segmentName !== '' && segmentName !== 'custom') {
                dayData.segments.push({
                    name: segmentName,
                    description: description.value.trim(),
                    order: index + 1
                });
            }
        });
        
        if (dayData.segments.length === 0) {
            alert(`Day ${day} needs at least one segment`);
            return;
        }
        
        pageantData.days.push(dayData);
    }
    
    fetch(`${API_URL}/create-flexible-pageant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageantData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Pageant created with ${data.total_segments} segments!`);
            showViewCompetitions();
        } else {
            alert('Error: ' + data.error);
        }
    });
}

// ================================================
// PARTICIPANTS - WITH YEAR & COURSE
// ================================================

function showAddParticipantForm() {
    document.getElementById("content").innerHTML = `
        <h2>Add New Participant</h2>
        
        <form id="addParticipantForm" style="max-width: 700px;">
            <h3>Basic Information</h3>
            
            <label>Participant Name:</label>
            <input type="text" id="participant_name" required>
            
            <label>Email:</label>
            <input type="email" id="email" required>
            
            <label>Phone:</label>
            <input type="tel" id="phone">
            
            <div class="grid-3">
                <div>
                    <label>Age:</label>
                    <input type="number" id="age" min="1" required>
                </div>
                <div>
                    <label>Gender:</label>
                    <select id="gender" required>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label>Status:</label>
                    <select id="status" required>
                        <option value="pending">Pending</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="done">Done</option>
                    </select>
                </div>
            </div>
            
            <label>Year & Course:</label>
            <input type="text" id="school_organization" placeholder="e.g., 3rd Year - BS Computer Science">
            
            <h3>Competition Details</h3>
            
            <label>Competition:</label>
            <select id="competition" required>
                <option value="">Select Competition</option>
            </select>
            
            <label>Performance Title:</label>
            <input type="text" id="performance_title">
            
            <label>Performance Description:</label>
            <textarea id="performance_description" rows="3"></textarea>
            
            <h3>Contestant Information</h3>
            
            <label>Contestant Number: <span style="color: #800020;">*</span></label>
            <input type="text" id="contestant_number" required>
            
            <label>Photo URL: <span style="color: #800020;">*</span></label>
            <input type="url" id="photo_url" required>
            <small style="color: #666; display: block; margin-top: 5px;">
                Upload photo to Imgur or similar, then paste URL here
            </small>
            
            <label>Talents & Skills:</label>
            <textarea id="talents" rows="3"></textarea>
            
            <label>Awards & Achievements:</label>
            <textarea id="special_awards" rows="3"></textarea>
            
            <div style="margin-top: 30px;">
                <input type="submit" value="Add Participant">
                <button type="button" onclick="showViewParticipants()" class="secondary">Cancel</button>
            </div>
        </form>
    `;

    fetch(`${API_URL}/competitions`)
    .then(response => response.json())
    .then(competitions => {
        const select = document.getElementById("competition");
        competitions.forEach(comp => {
            const option = document.createElement("option");
            option.value = comp.competition_id;
            option.textContent = `${comp.competition_name} (${comp.type_name})`;
            select.appendChild(option);
        });
    });

    document.getElementById("addParticipantForm").onsubmit = function(e) {
        e.preventDefault();

        fetch(`${API_URL}/add-participant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participant_name: document.getElementById("participant_name").value,
                contestant_number: document.getElementById("contestant_number").value,
                photo_url: document.getElementById("photo_url").value,
                email: document.getElementById("email").value,
                phone: document.getElementById("phone").value,
                age: document.getElementById("age").value,
                gender: document.getElementById("gender").value,
                school_organization: document.getElementById("school_organization").value,
                performance_title: document.getElementById("performance_title").value,
                performance_description: document.getElementById("performance_description").value,
                competition_id: document.getElementById("competition").value,
                status: document.getElementById("status").value,
                height: null,
                measurements: null,
                talents: document.getElementById("talents").value || null,
                special_awards: document.getElementById("special_awards").value || null
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Participant added!');
                showViewParticipants();
            } else {
                alert('Error: ' + data.error);
            }
        });
    };
}

function showViewParticipants() {
    document.getElementById("content").innerHTML = `
        <h2>Manage Participants</h2>
        
        <div style="margin-bottom: 30px;">
            <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
        
        <div id="participantsList"><div class="loading">Loading...</div></div>
    `;

    fetch(`${API_URL}/participants`)
    .then(response => response.json())
    .then(participants => {
        let html = '';
        
        if (participants.length === 0) {
            html = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <h3>No Participants</h3>
                    <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                </div>
            `;
        } else {
            html = '<div style="display: grid; gap: 20px;">';
            
            participants.forEach(p => {
                const statusColor = p.status === 'done' ? '#28a745' : p.status === 'ongoing' ? '#ffc107' : '#dc3545';
                
                html += `
                    <div class="dashboard-card" style="text-align: left;">
                        <h3>${p.participant_name}</h3>
                        <div class="grid-3" style="margin: 15px 0;">
                            <div>
                                <p><strong>Age:</strong> ${p.age}</p>
                                <p><strong>Gender:</strong> ${p.gender}</p>
                                <p><strong>Email:</strong> ${p.email}</p>
                            </div>
                            <div>
                                <p><strong>Competition:</strong> ${p.competition_name}</p>
                                <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${p.status.toUpperCase()}</span></p>
                            </div>
                            <div>
                                <p><strong>Year & Course:</strong> ${p.school_organization || 'N/A'}</p>
                                <p><strong>Contestant #:</strong> ${p.contestant_number || 'N/A'}</p>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <button onclick="editParticipant(${p.participant_id})">Edit</button>
                            <button onclick="deleteParticipant(${p.participant_id})" style="background: #dc3545;">Delete</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        document.getElementById("participantsList").innerHTML = html;
    });
}

function editParticipant(id) {
    fetch(`${API_URL}/participant/${id}`)
    .then(response => response.json())
    .then(p => {
        document.getElementById("content").innerHTML = `
            <h2>Edit Participant</h2>
            
            <form id="editParticipantForm" style="max-width: 700px;">
                <h3>Basic Information</h3>
                
                <label>Participant Name:</label>
                <input type="text" id="participant_name" value="${p.participant_name}" required>
                
                <label>Email:</label>
                <input type="email" id="email" value="${p.email}" required>
                
                <label>Phone:</label>
                <input type="tel" id="phone" value="${p.phone || ''}">
                
                <div class="grid-3">
                    <div>
                        <label>Age:</label>
                        <input type="number" id="age" value="${p.age}" required>
                    </div>
                    <div>
                        <label>Gender:</label>
                        <select id="gender" required>
                            <option value="male" ${p.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${p.gender === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div>
                        <label>Status:</label>
                        <select id="status" required>
                            <option value="pending" ${p.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="ongoing" ${p.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                            <option value="done" ${p.status === 'done' ? 'selected' : ''}>Done</option>
                        </select>
                    </div>
                </div>
                
                <label>Year & Course:</label>
                <input type="text" id="school_organization" value="${p.school_organization || ''}">
                
                <h3>Competition Details</h3>
                
                <label>Competition:</label>
                <select id="competition" required>
                    <option value="">Select Competition</option>
                </select>
                
                <label>Performance Title:</label>
                <input type="text" id="performance_title" value="${p.performance_title || ''}">
                
                <label>Contestant Number:</label>
                <input type="text" id="contestant_number" value="${p.contestant_number || ''}" required>
                
                <label>Photo URL:</label>
                <input type="url" id="photo_url" value="${p.photo_url || ''}" required>
                
                <label>Talents:</label>
                <textarea id="talents" rows="3">${p.talents || ''}</textarea>
                
                <label>Awards:</label>
                <textarea id="special_awards" rows="3">${p.special_awards || ''}</textarea>
                
                <div style="margin-top: 30px;">
                    <input type="submit" value="Update Participant">
                    <button type="button" onclick="showViewParticipants()" class="secondary">Cancel</button>
                </div>
            </form>
        `;

        fetch(`${API_URL}/competitions`)
        .then(response => response.json())
        .then(competitions => {
            const select = document.getElementById("competition");
            competitions.forEach(comp => {
                const option = document.createElement("option");
                option.value = comp.competition_id;
                option.textContent = `${comp.competition_name}`;
                if (comp.competition_id === p.competition_id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        });

        document.getElementById("editParticipantForm").onsubmit = function(e) {
            e.preventDefault();

            fetch(`${API_URL}/update-participant/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participant_name: document.getElementById("participant_name").value,
                    contestant_number: document.getElementById("contestant_number").value,
                    photo_url: document.getElementById("photo_url").value,
                    email: document.getElementById("email").value,
                    phone: document.getElementById("phone").value,
                    age: document.getElementById("age").value,
                    gender: document.getElementById("gender").value,
                    school_organization: document.getElementById("school_organization").value,
                    performance_title: document.getElementById("performance_title").value,
                    performance_description: '',
                    competition_id: document.getElementById("competition").value,
                    status: document.getElementById("status").value,
                    height: null,
                    measurements: null,
                    talents: document.getElementById("talents").value || null,
                    special_awards: document.getElementById("special_awards").value || null
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Participant updated!');
                    showViewParticipants();
                } else {
                    alert('Error: ' + data.error);
                }
            });
        };
    });
}

function deleteParticipant(id) {
    if (confirm('Delete this participant?')) {
        fetch(`${API_URL}/delete-participant/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Participant deleted!');
                showViewParticipants();
            } else {
                alert('Error: ' + data.error);
            }
        });
    }
}

// ================================================
// JUDGES
// ================================================

function showAddJudgeForm() {
    document.getElementById("content").innerHTML = `
        <h2>Add New Judge</h2>
        <form id="addJudgeForm" style="max-width: 700px;">
            <label>Judge Name:</label>
            <input type="text" id="judge_name" required>
            
            <label>Email:</label>
            <input type="email" id="email" required>
            
            <label>Phone:</label>
            <input type="tel" id="phone">
            
            <label>Area of Expertise:</label>
            <textarea id="expertise" rows="2" required></textarea>
            
            <label>Years of Experience:</label>
            <input type="number" id="experience_years" min="0" required>
            
            <label>Credentials:</label>
            <textarea id="credentials" rows="4"></textarea>
            
            <label>Assign to Competition:</label>
            <select id="competition">
                <option value="">Select Competition (Optional)</option>
            </select>
            
            <div class="alert alert-info">
                <strong>Login Credentials:</strong>
                <p>Username and password will be auto-generated and displayed after creation.</p>
            </div>
            
            <input type="submit" value="Add Judge">
            <button type="button" onclick="showViewJudges()" class="secondary">Cancel</button>
        </form>
    `;

    fetch(`${API_URL}/competitions`)
    .then(response => response.json())
    .then(competitions => {
        const select = document.getElementById("competition");
        competitions.forEach(comp => {
            const option = document.createElement("option");
            option.value = comp.competition_id;
            option.textContent = `${comp.competition_name}`;
            select.appendChild(option);
        });
    });

    document.getElementById("addJudgeForm").onsubmit = function(e) {
        e.preventDefault();

        fetch(`${API_URL}/add-judge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                judge_name: document.getElementById("judge_name").value,
                email: document.getElementById("email").value,
                phone: document.getElementById("phone").value,
                expertise: document.getElementById("expertise").value,
                experience_years: document.getElementById("experience_years").value,
                credentials: document.getElementById("credentials").value,
                competition_id: document.getElementById("competition").value || null
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Judge added!\n\nUsername: ${data.credentials.username}\nPassword: ${data.credentials.password}`);
                showViewJudges();
            } else {
                alert('Error: ' + data.error);
            }
        });
    };
}

function showViewJudges() {
    document.getElementById("content").innerHTML = `
        <h2>Manage Judges</h2>
        <div style="margin-bottom: 30px;">
            <button onclick="showAddJudgeForm()" class="card-button">Add Judge</button>
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
        <div id="judgesList"><div class="loading">Loading...</div></div>
    `;

    fetch(`${API_URL}/judges`)
    .then(response => response.json())
    .then(judges => {
        let html = '';
        
        if (judges.length === 0) {
            html = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <h3>No Judges</h3>
                    <button onclick="showAddJudgeForm()" class="card-button">Add Judge</button>
                </div>
            `;
        } else {
            html = '<div style="display: grid; gap: 20px;">';
            
            judges.forEach(j => {
                html += `
                    <div class="dashboard-card" style="text-align: left;">
                        <h3>${j.judge_name}</h3>
                        <div class="grid-3" style="margin: 15px 0;">
                            <div>
                                <p><strong>Email:</strong> ${j.email}</p>
                                <p><strong>Phone:</strong> ${j.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p><strong>Experience:</strong> ${j.experience_years} years</p>
                                <p><strong>Competition:</strong> ${j.competition_name || 'Not assigned'}</p>
                            </div>
                            <div>
                                <p><strong>Expertise:</strong> ${j.expertise}</p>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <button onclick="deleteJudge(${j.judge_id})" style="background: #dc3545;">Delete</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        document.getElementById("judgesList").innerHTML = html;
    });
}

function deleteJudge(id) {
    if (confirm('Delete this judge? This will also remove their user account.')) {
        fetch(`${API_URL}/delete-judge/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Judge deleted!');
                showViewJudges();
            } else {
                alert('Error: ' + data.error);
            }
        });
    }
}

// ================================================
// RESULTS
// ================================================

function showScoringResults() {
    document.getElementById("content").innerHTML = `
        <h2>Scoring Results</h2>
        
        <div style="margin-bottom: 30px;">
            <label style="font-weight: 600;">Select Competition:</label>
            <select id="resultsCompetition" onchange="loadScoringResults()" style="margin-left: 10px; padding: 8px 12px;">
                <option value="">Select Competition</option>
            </select>
            <button onclick="showDashboard()" class="secondary" style="margin-left: 10px;">Back</button>
        </div>
        
        <div id="resultsContent">
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>Select a Competition</h3>
                <p>Choose a competition to view results.</p>
            </div>
        </div>
    `;

    fetch(`${API_URL}/competitions`)
    .then(response => response.json())
    .then(competitions => {
        const select = document.getElementById("resultsCompetition");
        competitions.forEach(comp => {
            const option = document.createElement("option");
            option.value = comp.competition_id;
            option.textContent = comp.competition_name;
            select.appendChild(option);
        });
    });
}

function loadScoringResults() {
    const competitionId = document.getElementById("resultsCompetition").value;
    if (!competitionId) return;

    document.getElementById("resultsContent").innerHTML = '<div class="loading">Loading results...</div>';

    fetch(`${API_URL}/overall-scores/${competitionId}`)
    .then(response => response.json())
    .then(scores => {
        if (scores.length === 0) {
            document.getElementById("resultsContent").innerHTML = `
                <div class="alert alert-warning">
                    <h3>No Scores Yet</h3>
                    <p>No scores submitted for this competition.</p>
                </div>
            `;
            return;
        }

        const participantScores = {};
        scores.forEach(score => {
            if (!participantScores[score.participant_id]) {
                participantScores[score.participant_id] = {
                    participant_name: score.participant_name,
                    performance_title: score.performance_title,
                    scores: [],
                    average: 0
                };
            }
            
            const totalScore = parseFloat(score.total_score);
            if (!isNaN(totalScore)) {
                participantScores[score.participant_id].scores.push({
                    judge_name: score.judge_name,
                    total_score: totalScore
                });
            }
        });

        const sortedParticipants = Object.values(participantScores).map(p => {
            if (p.scores.length > 0) {
                const sum = p.scores.reduce((total, s) => total + s.total_score, 0);
                p.average = sum / p.scores.length;
            }
            return p;
        }).sort((a, b) => b.average - a.average);

        let html = `
            <div class="dashboard-card" style="text-align: left;">
                <h3>Competition Rankings</h3>
                <table style="width: 100%; margin-top: 15px;">
                    <tr>
                        <th>Rank</th>
                        <th>Participant</th>
                        <th>Performance</th>
                        <th>Average Score</th>
                        <th>Judges</th>
                    </tr>
        `;

        sortedParticipants.forEach((p, index) => {
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666';
            const rankText = index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `${index + 1}th`;
            
            html += `
                <tr>
                    <td style="text-align: center; font-size: 18px; color: ${rankColor}; font-weight: bold;">${rankText}</td>
                    <td><strong>${p.participant_name}</strong></td>
                    <td>${p.performance_title || 'N/A'}</td>
                    <td style="text-align: center; font-weight: bold; color: #800020;">${p.average.toFixed(2)}</td>
                    <td style="text-align: center;">${p.scores.length}</td>
                </tr>
            `;
        });

        html += `</table></div>`;

        document.getElementById("resultsContent").innerHTML = html;
    });
}

// ================================================
// UNLOCK REQUESTS
// ================================================

function viewUnlockRequests() {
    document.getElementById("content").innerHTML = `
        <h2>Unlock Requests Management</h2>
        
        <div class="alert alert-info">
            <strong>About Unlock Requests:</strong>
            <ul style="margin-top: 10px;">
                <li>Judges can edit scores for 45 seconds after submission</li>
                <li>After 45 seconds, scores are locked</li>
                <li>Judges must request unlock permission</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
        
        <div id="unlockRequestsList"><div class="loading">Loading...</div></div>
    `;
    
    loadUnlockRequests();
}

function loadUnlockRequests() {
    fetch(`${API_URL}/unlock-requests`)
    .then(response => response.json())
    .then(requests => {
        let html = '';
        
        if (requests.length === 0) {
            html = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <h3>✅ No Unlock Requests</h3>
                </div>
            `;
        } else {
            const pending = requests.filter(r => r.status === 'pending');
            const approved = requests.filter(r => r.status === 'approved');
            const rejected = requests.filter(r => r.status === 'rejected');
            
            if (pending.length > 0) {
                html += `<h3 style="color: #ffc107;">⏳ Pending (${pending.length})</h3><div style="display: grid; gap: 15px; margin-bottom: 30px;">`;
                pending.forEach(r => html += renderUnlockRequestCard(r, true));
                html += '</div>';
            }
            
            if (approved.length > 0) {
                html += `<h3 style="color: #28a745;">✅ Approved (${approved.length})</h3><div style="display: grid; gap: 15px; margin-bottom: 30px;">`;
                approved.forEach(r => html += renderUnlockRequestCard(r, false));
                html += '</div>';
            }
            
            if (rejected.length > 0) {
                html += `<h3 style="color: #dc3545;">❌ Rejected (${rejected.length})</h3><div style="display: grid; gap: 15px;">`;
                rejected.forEach(r => html += renderUnlockRequestCard(r, false));
                html += '</div>';
            }
        }
        
        document.getElementById("unlockRequestsList").innerHTML = html;
    });
}

function renderUnlockRequestCard(request, showActions) {
    const statusColor = request.status === 'approved' ? '#28a745' : request.status === 'rejected' ? '#dc3545' : '#ffc107';
    const statusIcon = request.status === 'approved' ? '✅' : request.status === 'rejected' ? '❌' : '⏳';
    
    return `
        <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${statusColor};">
            <div style="display: flex; justify-content: space-between;">
                <h4>Judge: ${request.judge_name}</h4>
                <span style="padding: 6px 12px; border-radius: 15px; background: ${statusColor}; color: white; font-size: 12px; font-weight: bold;">
                    ${statusIcon} ${request.status.toUpperCase()}
                </span>
            </div>
            
            <div class="grid-2" style="margin: 15px 0;">
                <div>
                    <p><strong>Participant:</strong> ${request.participant_name}</p>
                    <p><strong>Competition:</strong> ${request.competition_name}</p>
                </div>
                <div>
                    <p><strong>Requested:</strong> ${new Date(request.requested_at).toLocaleString()}</p>
                    <p><strong>Waiting:</strong> ${request.hours_pending} hours</p>
                </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <strong>Reason:</strong>
                <p style="margin-top: 8px;">${request.reason}</p>
            </div>
            
            ${showActions ? `
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="reviewUnlockRequest(${request.request_id}, 'approve')" style="flex: 1; background: #28a745;">
                        ✅ Approve
                    </button>
                    <button onclick="reviewUnlockRequest(${request.request_id}, 'reject')" style="flex: 1; background: #dc3545;">
                        ❌ Reject
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function reviewUnlockRequest(requestId, action) {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    
    if (!confirm(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} this unlock request?`)) {
        return;
    }
    
    const adminNotes = prompt(`Optional notes for the judge:`);
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    
    fetch(`${API_URL}/review-unlock-request/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: action,
            admin_notes: adminNotes || null,
            admin_user_id: user ? user.user_id : null
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            loadUnlockRequests();
        } else {
            alert('Error: ' + data.error);
        }
    });
}

function showUnlockRequestsBadge() {
    fetch(`${API_URL}/unlock-requests`)
    .then(response => response.json())
    .then(requests => {
        const pendingCount = requests.filter(r => r.status === 'pending').length;
        
        if (pendingCount > 0) {
            const btn = document.getElementById('unlockBtn');
            if (btn) {
                btn.innerHTML = `View Requests <span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">${pendingCount}</span>`;
            }
        }
    });
}

console.log('✅ Clean Admin Dashboard Loaded - Maroon & White Theme');