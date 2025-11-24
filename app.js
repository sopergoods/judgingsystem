// Admin Dashboard - Clean & Bug-Free Version
// Maroon & White Theme Only
// No Emojis - Professional Code

const API_URL = 'https://mseufci-judgingsystem.up.railway.app';

// ================================================
// AUTHENTICATION
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
    
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.innerHTML = `
            <div style="color: white; text-align: right;">
                <div style="font-weight: 600;">${user.username}</div>
                <div style="font-size: 12px; opacity: 0.9;">Administrator</div>
                <button onclick="logout()" style="margin-top: 10px; padding: 8px 16px; background: white; color: #800020; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    Logout
                </button>
            </div>
        `;
    }
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ================================================
// DASHBOARD
// ===============================================
// =
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animation styles
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

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
                '<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #800020; background: white; border: 2px solid #800020;">REGULAR</span>';
            
            html += `
                <tr>
                    <td><strong>${et.type_name}</strong></td>
                    <td>${et.description || '-'}</td>
                    <td>${badge}</td>
                    <td>
                        <button onclick="deleteEventType(${et.event_type_id})" style="background: #800020;">Delete</button>
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
                alert('Event type created successfully!');
                showEventTypes();
            } else {
                alert('Error: ' + data.error);
            }
        });
    };
}

function deleteEventType(id) {
  if (!confirm('Delete this event type? This action cannot be undone.')) return;

  fetch(`${API_URL}/delete-event-type/${id}`, { method: 'DELETE' })
    .then(async (res) => {
      // If not OK, try to read JSON; otherwise read text and throw
      if (!res.ok) {
        let msg = '';
        try { const j = await res.json(); msg = j.error || JSON.stringify(j); }
        catch { msg = await res.text(); }
        throw new Error(`HTTP ${res.status}: ${msg}`);
      }
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        alert('Event type deleted successfully!');
        showEventTypes();
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      alert('Delete failed: ' + String(err));
    });
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
                alert('Competition created successfully!');
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
            // Status badge
            let statusBadge = '';
            let statusText = comp.status || 'ongoing';
            
            if (statusText === 'done') {
                statusBadge = '<span style="background: #28a745; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">DONE</span>';
            } else if (statusText === 'upcoming') {
                statusBadge = '<span style="background: #007bff; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">UPCOMING</span>';
            } else {
                statusBadge = '<span style="background: #ffc107; color: #000; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">ONGOING</span>';
            }
            
            const badge = comp.is_pageant ? 
                '<span style="background: #800020; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">PAGEANT</span>' :
                '<span style="background: white; color: #800020; padding: 4px 8px; border-radius: 12px; font-size: 12px; border: 2px solid #800020;">REGULAR</span>';
            
            html += `
                <div class="dashboard-card" style="text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0;">${comp.competition_name} ${badge}</h3>
                        ${statusBadge}
                    </div>
                    
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
            `;
            
            // If DONE - show limited actions
            if (statusText === 'done') {
                html += `
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin-bottom: 15px;">
                        <strong style="color: #155724;">✓ Competition Completed</strong>
                        <p style="margin: 5px 0 0 0; color: #155724;">This competition is locked and cannot be edited.</p>
                    </div>
                    <button onclick="viewJudgeTabulation(${comp.competition_id})" style="padding: 8px 15px;">View Tabulation</button>
                `;
                
                if (comp.is_pageant) {
                    html += `<button onclick="manageSpecialAwards(${comp.competition_id})" style="padding: 8px 15px; margin-left: 5px;">View Awards</button>`;
                }
            } else {
                // Normal actions for ongoing competitions
                html += `
                    <button onclick="manageCriteria(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">Manage Criteria</button>
                `;
                
                if (comp.is_pageant) {
                    html += `
                        <button onclick="setupPageant(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">Setup Pageant</button>
                        <button onclick="viewPageantSegments(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">View Schedule</button>
                        <button onclick="manageSpecialAwards(${comp.competition_id})" style="background: #ffc107; color: #000;">Special Awards</button>
                    `;
                }
                
                html += `
                    <button onclick="viewJudgeTabulation(${comp.competition_id})" style="background: #6c757d;">Tabulation</button>
                    <br>
                    <button onclick="markCompetitionDone(${comp.competition_id})" style="background: #28a745; color: white; margin-top: 10px;">Mark as DONE</button>
                    <button onclick="deleteCompetition(${comp.competition_id})" style="background: #800020; margin-top: 10px;">Delete</button>
                `;
            }
            
            html += `
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

function displayCompetitions(competitions) {
    let html = `
        <h2>Manage Competitions</h2>
        <div style="margin-bottom: 30px;">
            <button onclick="showCreateCompetitionForm()" class="card-button">Create New Competition</button>
            <button onclick="showDashboard()" class="secondary">Back to Dashboard</button>
        </div>
    `;
    
    if (competitions.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <h3>No Competitions Found</h3>
                <p>Create your first competition to get started!</p>
                <button onclick="showCreateCompetitionForm()" class="card-button">Create Competition</button>
            </div>
        `;
    } else {
        html += '<div style="display: grid; gap: 20px;">';
        
        competitions.forEach(comp => {
            const statusBadge = comp.status === 'done' ? 
                '<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: #28a745;">DONE</span>' :
                comp.status === 'ongoing' ?
                '<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: #ffc107;">ONGOING</span>' :
                '<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: #800020;">UPCOMING</span>';
            
            const typeBadge = comp.is_pageant ? 
                '<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: #800020; margin-left: 10px;">PAGEANT</span>' :
                '<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #800020; background: white; border: 2px solid #800020; margin-left: 10px;">REGULAR</span>';
            
            html += `
                <div class="dashboard-card" style="text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <h3 style="margin: 0;">${comp.competition_name}</h3>
                            <p style="color: #666; margin: 5px 0 0 0;">${comp.type_name}</p>
                        </div>
                        <div>
                            ${statusBadge}
                            ${typeBadge}
                        </div>
                    </div>
                    
                    <div class="grid-3" style="margin: 15px 0;">
                        <div>
                            <p><strong>Date:</strong> ${new Date(comp.competition_date).toLocaleDateString()}</p>
                            <p><strong>Participants:</strong> ${comp.participant_count || 0}</p>
                        </div>
                        <div>
                            <p><strong>Judges:</strong> ${comp.judge_count || 0}</p>
                            <p><strong>Event Type:</strong> ${comp.is_pageant ? 'Multi-Day Pageant' : 'Single Event'}</p>
                        </div>
                        <div>
                            ${comp.event_description ? `<p><strong>Description:</strong> ${comp.event_description}</p>` : ''}
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                        ${comp.is_pageant ? `
                            <button onclick="viewPageantSegments(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">
                                Manage Segments
                            </button>
                            <button onclick="setupPageant(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">
                                Setup Schedule
                            </button>
                            <button onclick="manageSegmentWeights(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">
                                Set Weights
                            </button>
                            <button onclick="manageSpecialAwards(${comp.competition_id})">
                                Special Awards
                            </button>
                        ` : `
                            <button onclick="manageCriteria(${comp.competition_id}, '${comp.competition_name.replace(/'/g, "\\'")}')">
                                Manage Criteria
                            </button>
                        `}
                        <button onclick="viewJudgeTabulation(${comp.competition_id})">
                            View Tabulation
                        </button>
                        ${comp.status !== 'done' ? `
                            <button onclick="archiveCompetition(${comp.competition_id})" style="background: #28a745;">
                                Archive
                            </button>
                        ` : ''}
                        <button onclick="deleteCompetition(${comp.competition_id})" style="background: #800020;">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    document.getElementById("content").innerHTML = html;
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
            showNotification(data.message, 'success');
            showViewParticipants();
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding participant', 'error');
    });
}

function deleteCompetition(id) {
    if (confirm('Delete this competition? This will delete all related data including participants, scores, and criteria.')) {
        fetch(`${API_URL}/delete-competition/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Competition deleted successfully!');
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
                        <button type="button" onclick="removeCriterion(this)" style="background: #800020;">Remove</button>
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
                <button type="button" onclick="removeCriterion(this)" style="background: #800020;">Remove</button>
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
            alert('Criteria saved successfully!');
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
                
                <button type="button" class="add-segment-btn" data-day="${day}" style="background: #800020; margin-top: 10px;">
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
            
            <button type="button" class="remove-segment-btn" style="background: #800020; margin-top: 10px;">Remove</button>
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
            alert(`Pageant created with ${data.total_segments} segments successfully!`);
            showViewCompetitions();
        } else {
            alert('Error: ' + data.error);
        }
    });
}

// ================================================
// VIEW PAGEANT SEGMENTS
// ================================================

function viewPageantSegments(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>Pageant Schedule</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div style="margin-bottom: 20px;">
            <button onclick="manageSegmentWeights(${competitionId}, '${competitionName.replace(/'/g, "\\'")}');" style="background: #800020; margin-right: 10px;">
                Set Segment Weights
            </button>
            <button onclick="viewWeightedLeaderboard(${competitionId}, '${competitionName.replace(/'/g, "\\'")}');" style="background: #800020; margin-right: 10px;">
                View Grand Total
            </button>
            <button onclick="showViewCompetitions()" class="secondary">
                Back to Competitions
            </button>
        </div>
        
        <div id="segmentsDisplay"><div class="loading">Loading schedule...</div></div>
    `;
    
    fetch(`${API_URL}/pageant-segments/${competitionId}`)
    .then(response => response.json())
    .then(segments => {
        if (segments.length === 0) {
            document.getElementById("segmentsDisplay").innerHTML = `
                <div class="alert alert-warning">
                    <h3>No Pageant Schedule Set</h3>
                    <p>This pageant doesn't have a schedule yet.</p>
                    <button onclick="setupPageant(${competitionId}, '${competitionName.replace(/'/g, "\\'")}')">Setup Schedule</button>
                </div>
            `;
            return;
        }
        
        const segmentsByDay = {};
        segments.forEach(segment => {
            const day = segment.day_number || 1;
            if (!segmentsByDay[day]) {
                segmentsByDay[day] = [];
            }
            segmentsByDay[day].push(segment);
        });
        
        let html = `
            <div class="alert alert-success">
                <strong>Schedule Created!</strong>
                <p>This pageant has <strong>${Object.keys(segmentsByDay).length} days</strong> with <strong>${segments.length} segments</strong></p>
            </div>
        `;
        
        Object.keys(segmentsByDay).sort((a, b) => a - b).forEach(dayNumber => {
            const daySegments = segmentsByDay[dayNumber];
            const firstSegment = daySegments[0];
            
            html += `
                <div class="dashboard-card" style="text-align: left; margin-bottom: 20px; border-left: 5px solid #800020;">
                    <h3>Day ${dayNumber} - ${new Date(firstSegment.segment_date).toLocaleDateString()}</h3>
                    <p><strong>Time:</strong> ${firstSegment.segment_time || '18:00'}</p>
                    
                    <div style="margin-top: 20px;">
                        <h4 style="color: #800020;">Segments:</h4>
                        <div style="display: grid; gap: 10px; margin-top: 10px;">
            `;
            
            daySegments.forEach((segment, index) => {
                html += `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 3px solid #800020;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <strong>${index + 1}. ${segment.segment_name}</strong>
                                ${segment.description ? `<br><small style="color: #666;">${segment.description}</small>` : ''}
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="manageSegmentCriteria(${segment.segment_id}, '${segment.segment_name.replace(/'/g, "\\'")}', ${competitionId})" 
                                        style="background: #800020; white-space: nowrap;">
                                    Set Criteria
                                </button>
                                <button onclick="deletePageantSegment(${segment.segment_id}, ${competitionId}, '${competitionName.replace(/'/g, "\\'")}');" 
                                        style="background: #800020;">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                        </div>
                    </div>
                </div>
            `;
        });
        
        document.getElementById("segmentsDisplay").innerHTML = html;
    });
}

function deletePageantSegment(segmentId, competitionId, competitionName) {
    if (!confirm('Delete this segment? This action cannot be undone.')) {
        return;
    }
    
    fetch(`${API_URL}/delete-pageant-segment/${segmentId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Segment deleted successfully!');
            viewPageantSegments(competitionId, competitionName);
        } else {
            alert('Error: ' + data.error);
        }
    });
}

// ================================================
// SEGMENT CRITERIA
// ================================================

function manageSegmentCriteria(segmentId, segmentName, competitionId) {
    document.getElementById("content").innerHTML = `
        <h2>Assign Criteria to Segment</h2>
        <h3 style="color: #800020;">Segment: ${segmentName}</h3>
        
        <div class="alert alert-info">
            <strong>How It Works:</strong>
            <p>Select which criteria judges will use to score THIS specific segment only.</p>
            <p>Example: "Long Gown" might use Beauty, Poise, and Stage Presence, while "Q&A" uses Intelligence and Communication.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="viewPageantSegments(${competitionId}, 'Competition')" class="secondary">Back to Segments</button>
        </div>
        
        <form id="segmentCriteriaForm" style="max-width: 800px;">
            <div id="availableCriteria"><div class="loading">Loading criteria...</div></div>
            
            <div style="margin-top: 30px;">
                <button type="submit" class="card-button">Save Criteria Assignment</button>
            </div>
            
            <div id="criteriaPercentageInfo" style="margin-top: 20px; padding: 15px; background: #d1ecf1; border-radius: 8px;">
                <strong>Selected Criteria Total: <span id="selectedPercentage">0</span>%</strong>
                <p style="margin-top: 10px; font-size: 14px;">Note: The total percentage should equal 100% for proper scoring.</p>
            </div>
        </form>
    `;
    
    Promise.all([
        fetch(`${API_URL}/competition-criteria/${competitionId}`).then(r => r.json()),
        fetch(`${API_URL}/segment-criteria/${segmentId}`).then(r => r.json()).catch(() => [])
    ])
    .then(([allCriteria, assignedCriteria]) => {
        if (allCriteria.length === 0) {
            document.getElementById("availableCriteria").innerHTML = `
                <div class="alert alert-warning">
                    <h3>No Criteria Available</h3>
                    <p>Please set up competition criteria first.</p>
                    <button onclick="manageCriteria(${competitionId}, 'Competition')">Setup Criteria</button>
                </div>
            `;
            return;
        }
        
        const assignedIds = assignedCriteria.map(c => c.criteria_id);
        
        let html = `
            <h4 style="color: #800020; margin-bottom: 15px;">Select Criteria for "${segmentName}":</h4>
            <p style="color: #666; margin-bottom: 20px;">Check the criteria that judges will score for this segment:</p>
        `;
        
        allCriteria.forEach(criterion => {
            const isChecked = assignedIds.includes(criterion.criteria_id);
            html += `
                <div style="background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 2px solid ${isChecked ? '#800020' : '#ddd'};">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" 
                               name="criteria[]" 
                               value="${criterion.criteria_id}" 
                               data-percentage="${criterion.percentage}"
                               ${isChecked ? 'checked' : ''}
                               style="width: 20px; height: 20px; margin-right: 15px; cursor: pointer;"
                               onchange="updateSegmentCriteriaSelection(this)">
                        <div style="flex: 1;">
                            <strong style="color: #800020; font-size: 16px;">${criterion.criteria_name}</strong>
                            <span style="margin-left: 10px; background: #800020; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                ${criterion.percentage}%
                            </span>
                            <p style="color: #666; margin-top: 5px; font-size: 14px;">${criterion.description || 'No description'}</p>
                        </div>
                    </label>
                </div>
            `;
        });
        
        document.getElementById("availableCriteria").innerHTML = html;
        updateSegmentCriteriaTotal();
    });
    
    document.getElementById("segmentCriteriaForm").onsubmit = function(e) {
        e.preventDefault();
        
        const checkboxes = document.querySelectorAll('input[name="criteria[]"]:checked');
        const criteriaIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
        
        if (criteriaIds.length === 0) {
            alert('Please select at least one criterion for this segment.');
            return;
        }
        
        const total = parseFloat(document.getElementById('selectedPercentage').textContent);
        if (Math.abs(total - 100) > 0.1) {
            if (!confirm(`Warning: Selected criteria total is ${total.toFixed(1)}%, not 100%. Continue anyway?`)) {
                return;
            }
        }
        
        fetch(`${API_URL}/assign-segment-criteria`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                segment_id: segmentId,
                criteria_ids: criteriaIds
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`${criteriaIds.length} criteria assigned to "${segmentName}" successfully!`);
                viewPageantSegments(competitionId, 'Competition');
            } else {
                alert('Error: ' + data.error);
            }
        });
    };
}

function updateSegmentCriteriaSelection(checkbox) {
    const parent = checkbox.closest('div[style*="background: #f8f9fa"]');
    if (checkbox.checked) {
        parent.style.borderColor = '#800020';
    } else {
        parent.style.borderColor = '#ddd';
    }
    updateSegmentCriteriaTotal();
}

function updateSegmentCriteriaTotal() {
    const checkboxes = document.querySelectorAll('input[name="criteria[]"]:checked');
    let total = 0;
    checkboxes.forEach(cb => {
        total += parseFloat(cb.getAttribute('data-percentage')) || 0;
    });
    
    const span = document.getElementById('selectedPercentage');
    if (span) {
        span.textContent = total.toFixed(1);
        const container = document.getElementById('criteriaPercentageInfo');
        if (Math.abs(total - 100) < 0.1) {
            container.style.background = '#d4edda';
            container.style.border = '2px solid #28a745';
            container.style.color = '#155724';
        } else if (total > 100) {
            container.style.background = '#f8d7da';
            container.style.border = '2px solid #dc3545';
            container.style.color = '#721c24';
        } else {
            container.style.background = '#fff3cd';
            container.style.border = '2px solid #ffc107';
            container.style.color = '#856404';
        }
    }
}

// ================================================
// PARTICIPANTS (Continued...)
// ================================================

function showAddParticipantForm() {
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
                    html += `<option value="${comp.competition_id}">${comp.competition_name}</option>`;
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
            
            document.getElementById("content").innerHTML = html;
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading competitions', 'error');
        });
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
                const statusColor = p.status === 'Done' ? '#28a745' : p.status === 'Active' ? '#17a2b8' : '#800020';
                
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
                            <button onclick="deleteParticipant(${p.participant_id})" style="background: #800020;">Delete</button>
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
                            <option value="Active" ${p.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Disqualified" ${p.status === 'Disqualified' ? 'selected' : ''}>Disqualified</option>
                            <option value="Done" ${p.status === 'Done' ? 'selected' : ''}>Done</option>
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
                    alert('Participant updated successfully!');
                    showViewParticipants();
                } else {
                    alert('Error: ' + data.error);
                }
            });
        };
    });
}

function deleteParticipant(id) {
    if (confirm('Delete this participant? This action cannot be undone.')) {
        fetch(`${API_URL}/delete-participant/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Participant deleted successfully!');
                showViewParticipants();
            } else {
                alert('Error: ' + data.error);
            }
        });
    }
}

// ================================================
// JUDGES (Continued in next part due to length...)
// ================================================

function showAddJudgeForm() {
    fetch(`${API_URL}/competitions`)
        .then(response => response.json())
        .then(competitions => {
            let html = `
                <h2>Add New Judge</h2>
                <form id="judgeForm" onsubmit="submitJudge(event)" style="max-width: 600px; margin: 0 auto;">
                    
                    <label>Judge Name: *</label>
                    <input type="text" id="judge_name" required 
                           placeholder="Full Name" 
                           style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    
                    <label>Credentials:</label>
                    <textarea id="credentials" rows="4" 
                              placeholder="Qualifications, awards, certifications..." 
                              style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                    
                    <label>Assign to Competition:</label>
                    <select id="competition_id" 
                            style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">-- Select Competition (Optional) --</option>
            `;
            
            competitions.forEach(comp => {
                // Don't allow assigning to DONE competitions
                if (comp.status !== 'done') {
                    html += `<option value="${comp.competition_id}">${comp.competition_name}</option>`;
                }
            });
            
            html += `
                    </select>
                    
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                        <p style="margin: 0;"><strong>📝 Note:</strong> A username and password will be automatically generated for this judge.</p>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <button type="submit" style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                            Add Judge
                        </button>
                        <button type="button" onclick="showViewJudges()" style="background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </form>
            `;
            
            document.getElementById("content").innerHTML = html;
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading competitions', 'error');
        });
}
function submitJudge(event) {
    event.preventDefault();
    
    const judgeData = {
        judge_name: document.getElementById('judge_name').value,
        credentials: document.getElementById('credentials').value || null,
        competition_id: document.getElementById('competition_id').value || null,
        // Set optional fields as null
        email: null,
        phone: null,
        expertise: null,
        experience_years: 0
    };
    
    fetch(`${API_URL}/add-judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(judgeData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.credentials) {
            // Show credentials to admin
            const credentialsInfo = `
                Judge added successfully!
                
                LOGIN CREDENTIALS:
                Username: ${data.credentials.username}
                Password: ${data.credentials.password}
                
                Please save these credentials and provide them to the judge.
            `;
            
            alert(credentialsInfo);
            showNotification('Judge added successfully!', 'success');
            showViewJudges();
        } else {
            showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding judge', 'error');
    });
}

function showEditJudgeForm(judgeId) {
    Promise.all([
        fetch(`${API_URL}/judge/${judgeId}`).then(r => r.json()),
        fetch(`${API_URL}/competitions`).then(r => r.json())
    ])
    .then(([judge, competitions]) => {
        let html = `
            <h2>Edit Judge</h2>
            <form id="editJudgeForm" onsubmit="updateJudge(event, ${judgeId})" style="max-width: 600px; margin: 0 auto;">
                
                <label>Judge Name: *</label>
                <input type="text" id="judge_name" value="${judge.judge_name}" required 
                       style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                
                <label>Credentials:</label>
                <textarea id="credentials" rows="4" 
                          style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">${judge.credentials || ''}</textarea>
                
                <label>Assign to Competition:</label>
                <select id="competition_id" 
                        style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="">-- No Competition --</option>
        `;
        
        competitions.forEach(comp => {
            const selected = comp.competition_id === judge.competition_id ? 'selected' : '';
            html += `<option value="${comp.competition_id}" ${selected}>${comp.competition_name}</option>`;
        });
        
        html += `
                </select>
                
                <div style="margin-top: 20px;">
                    <button type="submit" style="background: #007bff; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        Update Judge
                    </button>
                    <button type="button" onclick="showViewJudges()" style="background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
            </form>
        `;
        
        document.getElementById("content").innerHTML = html;
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error loading judge', 'error');
    });
}

function updateJudge(event, judgeId) {
    event.preventDefault();
    
    const judgeData = {
        judge_name: document.getElementById('judge_name').value,
        credentials: document.getElementById('credentials').value || null,
        competition_id: document.getElementById('competition_id').value || null,
        email: null,
        phone: null,
        expertise: null,
        experience_years: 0
    };
    
    fetch(`${API_URL}/update-judge/${judgeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(judgeData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            showViewJudges();
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating judge', 'error');
    });
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
                            <button onclick="editJudge(${j.judge_id})">Edit</button>
                            <button onclick="deleteJudge(${j.judge_id})" style="background: #800020;">Delete</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        document.getElementById("judgesList").innerHTML = html;
    });
}

function editJudge(id) {
    fetch(`${API_URL}/judge/${id}`)
    .then(response => response.json())
    .then(j => {
        document.getElementById("content").innerHTML = `
            <h2>Edit Judge</h2>
            <form id="editJudgeForm" style="max-width: 700px;">
                <label>Judge Name:</label>
                <input type="text" id="judge_name" value="${j.judge_name}" required>
                
                <label>Email:</label>
                <input type="email" id="email" value="${j.email}" required>
                
                <label>Phone:</label>
                <input type="tel" id="phone" value="${j.phone || ''}">
                
                <label>Area of Expertise:</label>
                <textarea id="expertise" rows="2" required>${j.expertise}</textarea>
                
                <label>Years of Experience:</label>
                <input type="number" id="experience_years" value="${j.experience_years}" min="0" required>
                
                <label>Credentials:</label>
                <textarea id="credentials" rows="4">${j.credentials || ''}</textarea>
                
                <label>Assign to Competition:</label>
                <select id="competition">
                    <option value="">Select Competition (Optional)</option>
                </select>
                
                <input type="submit" value="Update Judge">
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
                if (comp.competition_id === j.competition_id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        });

        document.getElementById("editJudgeForm").onsubmit = function(e) {
            e.preventDefault();

            fetch(`${API_URL}/update-judge/${id}`, {
                method: 'PUT',
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
                    alert('Judge updated successfully!');
                    showViewJudges();
                } else {
                    alert('Error: ' + data.error);
                }
            });
        };
    });
}

function deleteJudge(id) {
    if (confirm('Delete this judge? This will also remove their user account.')) {
        fetch(`${API_URL}/delete-judge/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Judge deleted successfully!');
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

// --- REPLACE your loadScoringResults() in app.js with this ---
function loadScoringResults() {
  const competitionId = document.getElementById("resultsCompetition").value;
  if (!competitionId) return;

  const out = document.getElementById("resultsContent");
  out.innerHTML = '<div class="loading">Loading results...</div>';

  // helper to fetch JSON with good error messages
  const getJSON = (url) =>
    fetch(url).then(async (r) => {
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} on ${url}\n${text.slice(0, 200)}`);
      }
      return r.json();
    });

  getJSON(`${API_URL}/competition/${competitionId}`)
    .then((competition) => {
      const isPageant = competition.is_pageant;

      if (isPageant) {
        // ✅ Pageant: weighted grand total
        return getJSON(`${API_URL}/pageant-grand-total/${competitionId}`).then((leaderboard) => {
          if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
            out.innerHTML = `
              <div class="alert alert-warning">
                <h3>No Scores Yet</h3>
                <p>No scores submitted for this pageant competition.</p>
              </div>`;
            return;
          }
          displayPageantRankings(leaderboard, competition.competition_name);
        });
      } else {
        // ✅ Regular: overall-scores (one row per judge×participant)
        return getJSON(`${API_URL}/overall-scores/${competitionId}`).then((scores) => {
          if (!Array.isArray(scores) || scores.length === 0) {
            out.innerHTML = `
              <div class="alert alert-warning">
                <h3>No Scores Yet</h3>
                <p>No scores submitted for this competition.</p>
              </div>`;
            return;
          }
          displayRegularRankings(scores);
        });
      }
    })
    .catch((err) => {
      console.error("Error loading results:", err);
      out.innerHTML = `
        <div class="alert alert-error">
          <h3>Error Loading Rankings</h3>
          <pre style="white-space:pre-wrap">${String(err)}</pre>
        </div>`;
    });
}



function displayPageantRankings(leaderboard, competitionName) {
    let html = `
        <div class="dashboard-card" style="text-align: left;">
            <h3>Competition Rankings - ${competitionName}</h3>
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>Multi-Segment Competition Scoring:</strong>
                <p style="margin-top: 8px;">
                    Final totals are <b>weighted by segment</b> (segment average × weight%) and summed.
                </p>
            </div>
            <table style="width: 100%; margin-top: 15px;">
                <tr>
                    <th>Rank</th>
                    <th>Participant</th>
                    <th>Performance</th>
                    <th>Grand Total (Weighted)</th>
                    <th>Judges</th>
                    <th>Segments</th>
                </tr>
    `;

    leaderboard.forEach((participant, index) => {
        const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666';
        const rankText  = index === 0 ? '1st'     : index === 1 ? '2nd'     : index === 2 ? '3rd'     : `${index + 1}th`;

        html += `
            <tr>
                <td style="text-align: center; font-size: 18px; color: ${rankColor}; font-weight: bold;">${rankText}</td>
                <td><strong>${participant.participant_name}</strong></td>
                <td>${participant.performance_title || 'N/A'}</td>
                <!-- ✅ weighted_grand_total comes from /pageant-grand-total -->
                <td style="text-align: center; font-weight: bold; font-size: 18px;">
                    ${Number(participant.weighted_grand_total || 0).toFixed(2)}
                </td>
                <td style="text-align: center;">${participant.judge_count || 0}</td>
                <td style="text-align: center;">${participant.segments_completed || 0}</td>
            </tr>
        `;
    });

    html += `
            </table>
        </div>
    `;

    document.getElementById("resultsContent").innerHTML = html;
}


function displayRegularRankings(scores) {
    const participantScores = {};

    scores.forEach(score => {
        if (!participantScores[score.participant_id]) {
            participantScores[score.participant_id] = {
                participant_name: score.participant_name,
                performance_title: score.performance_title,
                scores: []
            };
        }

        const totalScore = Number(score.total_score);
        if (Number.isFinite(totalScore)) {
            participantScores[score.participant_id].scores.push(totalScore);
        }
    });

    const sortedParticipants = Object.values(participantScores).map(p => {
        const validScores = p.scores.filter(s => Number.isFinite(s));
        const sum = validScores.reduce((a, b) => a + b, 0);
        const avg = validScores.length > 0 ? sum / validScores.length : 0;

        return {
            participant_name: p.participant_name,
            performance_title: p.performance_title,
            average: avg,
            judge_count: validScores.length
        };
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
        const rankText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;

        html += `
            <tr>
                <td style="text-align: center; font-size: 18px; color: ${rankColor}; font-weight: bold;">${rankText}</td>
                <td><strong>${p.participant_name}</strong></td>
                <td>${p.performance_title || 'N/A'}</td>
                <td style="text-align: center; font-weight: bold; color: #800020; font-size: 18px;">${p.average.toFixed(2)}</td>
                <td style="text-align: center;">${p.judge_count}</td>
            </tr>
        `;
    });

    html += '</table></div>';
    document.getElementById("resultsContent").innerHTML = html;
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
                <li>Judges can edit scores for 10 seconds after submission</li>
                <li>After 10 seconds, scores are locked</li>
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
                    <h3>No Unlock Requests</h3>
                </div>
            `;
        } else {
            const pending = requests.filter(r => r.status === 'pending');
            const approved = requests.filter(r => r.status === 'approved');
            const rejected = requests.filter(r => r.status === 'rejected');
            
            if (pending.length > 0) {
                html += `<h3 style="color: #ffc107;">Pending (${pending.length})</h3><div style="display: grid; gap: 15px; margin-bottom: 30px;">`;
                pending.forEach(r => html += renderUnlockRequestCard(r, true));
                html += '</div>';
            }
            
            if (approved.length > 0) {
                html += `<h3 style="color: #28a745;">Approved (${approved.length})</h3><div style="display: grid; gap: 15px; margin-bottom: 30px;">`;
                approved.forEach(r => html += renderUnlockRequestCard(r, false));
                html += '</div>';
            }
            
            if (rejected.length > 0) {
                html += `<h3 style="color: #800020;">Rejected (${rejected.length})</h3><div style="display: grid; gap: 15px;">`;
                rejected.forEach(r => html += renderUnlockRequestCard(r, false));
                html += '</div>';
            }
        }
        
        document.getElementById("unlockRequestsList").innerHTML = html;
    });
}

function renderUnlockRequestCard(request, showActions) {
    const statusColor = request.status === 'approved' ? '#28a745' : request.status === 'rejected' ? '#800020' : '#ffc107';
    
    return `
        <div class="dashboard-card" style="text-align: left; border-left: 5px solid ${statusColor};">
            <div style="display: flex; justify-content: space-between;">
                <h4>Judge: ${request.judge_name}</h4>
                <span style="padding: 6px 12px; border-radius: 15px; background: ${statusColor}; color: white; font-size: 12px; font-weight: bold;">
                    ${request.status.toUpperCase()}
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
                        Approve
                    </button>
                    <button onclick="reviewUnlockRequest(${request.request_id}, 'reject')" style="flex: 1; background: #800020;">
                        Reject
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
                btn.innerHTML = `View Requests <span style="background: #800020; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">${pendingCount}</span>`;
            }
        }
    });
}

// ================================================
// SEGMENT WEIGHTS
// ================================================

function manageSegmentWeights(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>Manage Segment Weights</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div class="alert alert-info">
            <strong>About Segment Weights:</strong>
            <p>Assign a percentage weight to each segment to calculate the weighted grand total.</p>
            <p><strong>Example:</strong> If "Evening Gown" is weighted 40% and a contestant scores 90, 
            their contribution to the grand total is 90 x 0.40 = 36 points.</p>
            <ul style="margin-top: 10px;">
                <li>Total weights must equal <strong>100%</strong></li>
                <li>More important segments get higher weights</li>
                <li>Final score = Sum of (segment_average x segment_weight)</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="viewPageantSegments(${competitionId}, '${competitionName.replace(/'/g, "\\'")}');" class="secondary">
                Back to Segments
            </button>
        </div>
        
        <div id="weightsList"><div class="loading">Loading segments...</div></div>
        
        <div id="submitSection" style="display: none; margin-top: 30px;">
            <div id="weightTotal" style="padding: 20px; background: #fff3cd; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <strong style="font-size: 18px;">Total Weight: <span id="totalWeight">0</span>%</strong>
            </div>
            <button onclick="saveSegmentWeights(${competitionId})" class="card-button">
                Save Segment Weights
            </button>
        </div>
    `;
    
    fetch(`${API_URL}/segment-weights/${competitionId}`)
    .then(response => response.json())
    .then(data => {
        if (data.segments.length === 0) {
            document.getElementById("weightsList").innerHTML = `
                <div class="alert alert-warning">
                    <h3>No Segments Found</h3>
                    <p>Please create pageant segments first.</p>
                </div>
            `;
            return;
        }
        
        displaySegmentWeights(data.segments);
        updateWeightTotal();
        document.getElementById('submitSection').style.display = 'block';
    });
}

function displaySegmentWeights(segments) {
    const segmentsByDay = {};
    segments.forEach(seg => {
        if (!segmentsByDay[seg.day_number]) {
            segmentsByDay[seg.day_number] = [];
        }
        segmentsByDay[seg.day_number].push(seg);
    });
    
    let html = '';
    
    Object.keys(segmentsByDay).sort((a, b) => a - b).forEach(dayNumber => {
        const daySegments = segmentsByDay[dayNumber];
        
        html += `
            <div class="dashboard-card" style="text-align: left; margin-bottom: 20px; border-left: 5px solid #800020;">
                <h3>Day ${dayNumber}</h3>
                <div style="display: grid; gap: 15px; margin-top: 15px;">
        `;
        
        daySegments.forEach(segment => {
            html += `
                <div class="segment-weight-item" style="background: #f8f9fa; padding: 20px; border-radius: 8px; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center;">
                    <div>
                        <strong style="font-size: 16px; color: #800020;">${segment.segment_name}</strong>
                        <p style="margin-top: 5px; color: #666; font-size: 14px;">Segment ${segment.order_number}</p>
                    </div>
                    <div style="text-align: right;">
                        <label style="display: block; font-size: 12px; margin-bottom: 5px; font-weight: bold;">Weight %</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input 
                                type="number" 
                                class="segment-weight-input" 
                                data-segment-id="${segment.segment_id}"
                                value="${segment.segment_weight || 0}" 
                                min="0" 
                                max="100" 
                                step="0.1" 
                                style="width: 100px; text-align: center; font-size: 16px; font-weight: bold; padding: 10px;"
                                onchange="updateWeightTotal()">
                            <span style="font-size: 18px; font-weight: bold;">%</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    document.getElementById("weightsList").innerHTML = html;
}

function updateWeightTotal() {
    const inputs = document.querySelectorAll('.segment-weight-input');
    let total = 0;
    
    inputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    
    const span = document.getElementById('totalWeight');
    const container = document.getElementById('weightTotal');
    
    if (span && container) {
        span.textContent = total.toFixed(1);
        
        if (Math.abs(total - 100) < 0.1) {
            container.style.background = '#d4edda';
            container.style.border = '2px solid #28a745';
            container.innerHTML = `<strong style="font-size: 18px; color: #155724;">Total Weight: ${total.toFixed(1)}% (Perfect!)</strong>`;
        } else if (total > 100) {
            container.style.background = '#f8d7da';
            container.style.border = '2px solid #dc3545';
            container.innerHTML = `<strong style="font-size: 18px; color: #721c24;">Total Weight: ${total.toFixed(1)}% (Too High!)</strong>`;
        } else {
            container.style.background = '#fff3cd';
            container.style.border = '2px solid #ffc107';
            container.innerHTML = `<strong style="font-size: 18px; color: #856404;">Total Weight: ${total.toFixed(1)}% (Need ${(100 - total).toFixed(1)}% more)</strong>`;
        }
    }
}

function saveSegmentWeights(competitionId) {
    const inputs = document.querySelectorAll('.segment-weight-input');
    const segments = [];
    let total = 0;
    
    inputs.forEach(input => {
        const weight = parseFloat(input.value) || 0;
        total += weight;
        
        segments.push({
            segment_id: input.getAttribute('data-segment-id'),
            weight: weight
        });
    });
    
    if (Math.abs(total - 100) > 0.1) {
        alert(`Total weight must equal 100%!\n\nCurrent total: ${total.toFixed(1)}%\n\nPlease adjust the weights so they add up to exactly 100%.`);
        return;
    }
    
    if (!confirm(`Save these segment weights?\n\nTotal: ${total.toFixed(1)}%\n\nThis will affect how the grand total is calculated.`)) {
        return;
    }
    
    fetch(`${API_URL}/update-segment-weights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            competition_id: competitionId,
            segments: segments
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Segment weights saved successfully!\n\nGrand totals will now be calculated using these weights.');
            showViewCompetitions();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        alert('Error saving weights: ' + error.message);
    });
}

function viewWeightedLeaderboard(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>Weighted Grand Total Leaderboard</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div class="alert alert-info">
            <strong>How It Works:</strong>
            <p>Each segment's average score is multiplied by its weight percentage to calculate the weighted grand total.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="showViewCompetitions()" class="secondary">Back to Competitions</button>
        </div>
        
        <div id="leaderboardDisplay"><div class="loading">Calculating weighted scores...</div></div>
    `;
    
    fetch(`${API_URL}/pageant-grand-total/${competitionId}`)
    .then(response => response.json())
    .then(leaderboard => {
        if (leaderboard.length === 0) {
            document.getElementById("leaderboardDisplay").innerHTML = `
                <div class="alert alert-warning">
                    <h3>No Scores Yet</h3>
                    <p>No scores have been submitted for this competition.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        leaderboard.forEach((contestant, index) => {
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666';
            const rankText = index === 0 ? '1st Place' : index === 1 ? '2nd Place' : index === 2 ? '3rd Place' : `${index + 1}th Place`;
            
            html += `
                <div class="dashboard-card" style="text-align: left; margin-bottom: 20px; border-left: 5px solid ${rankColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <h3 style="margin: 0;">${contestant.participant_name}</h3>
                            <p style="margin: 5px 0 0 0; color: #666;">Contestant #${contestant.contestant_number || 'N/A'}</p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 32px; font-weight: bold; color: ${rankColor};">${contestant.weighted_grand_total}</div>
                            <div style="font-size: 14px; color: #666;">${rankText}</div>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <h4 style="margin-top: 0; color: #800020;">Segment Breakdown:</h4>
                        <div style="display: grid; gap: 10px;">
            `;
            
            contestant.segments.forEach(seg => {
                html += `
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; align-items: center; padding: 10px; background: white; border-radius: 5px;">
                        <div><strong>${seg.name}</strong></div>
                        <div style="text-align: center;">Avg: <strong>${seg.average_score}</strong></div>
                        <div style="text-align: center;">Weight: <strong>${seg.weight}%</strong></div>
                        <div style="text-align: right; color: #800020; font-weight: bold;">= ${seg.weighted_contribution}</div>
                    </div>
                `;
            });
            
            html += `
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; font-size: 14px; color: #666;">
                        <strong>Judges:</strong> ${contestant.judge_count} | 
                        <strong>Segments Completed:</strong> ${contestant.segments_completed}
                    </div>
                </div>
            `;
        });
        
        document.getElementById("leaderboardDisplay").innerHTML = html;
    })
    .catch(error => {
        document.getElementById("leaderboardDisplay").innerHTML = `
            <div class="alert alert-error">
                <strong>Error loading leaderboard:</strong> ${error.message}
            </div>
        `;
    });
}
function displayCompetitions(competitions) {
    let html = `
        <h2>Manage Competitions</h2>
        <button onclick="showCreateCompetitionForm()" style="margin-bottom: 20px; background: #28a745; color: white;">
            + Create New Competition
        </button>
    `;
    
    if (competitions.length === 0) {
        html += '<p>No competitions created yet.</p>';
    } else {
        html += '<table><thead><tr>';
        html += '<th>Status</th><th>Competition Name</th><th>Event Type</th><th>Date</th>';
        html += '<th>Participants</th><th>Judges</th><th>Actions</th>';
        html += '</tr></thead><tbody>';
        
        competitions.forEach(comp => {
            // Status badge with color
            let statusBadge = '';
            let statusColor = '#ffc107'; // yellow for ongoing
            let statusText = comp.status || 'ongoing';
            
            if (statusText === 'done') {
                statusColor = '#28a745'; // green
                statusBadge = '<span style="background: #28a745; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">DONE</span>';
            } else if (statusText === 'upcoming') {
                statusColor = '#007bff'; // blue
                statusBadge = '<span style="background: #007bff; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">UPCOMING</span>';
            } else {
                statusBadge = '<span style="background: #ffc107; color: #000; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">ONGOING</span>';
            }
            
            html += '<tr>';
            html += `<td style="text-align: center;">${statusBadge}</td>`;
            html += `<td><strong>${comp.competition_name}</strong></td>`;
            html += `<td>${comp.type_name}${comp.is_pageant ? ' <span style="background: #e7f3ff; color: #0066cc; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">PAGEANT</span>' : ''}</td>`;
            html += `<td>${comp.competition_date}</td>`;
            html += `<td style="text-align: center;">${comp.participant_count || 0}</td>`;
            html += `<td style="text-align: center;">${comp.judge_count || 0}</td>`;
            html += '<td style="text-align: center;">';
            
            // If DONE, show limited actions
            if (comp.status === 'done') {
                html += `<span style="color: #28a745; font-weight: bold;">✓ Completed</span><br>`;
                html += `<button onclick="viewJudgeTabulation(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px;">View Tabulation</button>`;
                if (comp.is_pageant) {
                    html += `<button onclick="manageSpecialAwards(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px;">View Awards</button>`;
                }
            } else {
                // Normal actions for ongoing competitions
                html += `<button onclick="showEditCompetitionForm(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px;">Edit</button>`;
                html += `<button onclick="manageCriteria(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px;">Criteria</button>`;
                
                if (comp.is_pageant) {
                    html += `<button onclick="managePageantSegments(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px; background: #17a2b8;">Segments</button>`;
                    html += `<button onclick="manageSpecialAwards(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px; background: #ffc107; color: #000;">Special Awards</button>`;
                }
                
                html += `<button onclick="viewJudgeTabulation(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px; background: #6c757d;">Judge Tabulation</button>`;
                html += `<br>`;
                html += `<button onclick="markCompetitionDone(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px; background: #28a745; color: white;">Mark as DONE</button>`;
                html += `<button onclick="deleteCompetition(${comp.competition_id})" style="padding: 5px 10px; font-size: 12px; margin: 2px; background: #dc3545; color: white;">Delete</button>`;
            }
            
            html += '</td></tr>';
        });
        
        html += '</tbody></table>';
    }
    
    document.getElementById("content").innerHTML = html;
}
function markCompetitionDone(competitionId) {
    if (!confirm('Mark this competition as DONE?\n\nThis will:\n- Lock the competition from further editing\n- Move it to event history\n- Prevent new participants/judges from being added\n\nThis action cannot be easily undone.')) {
        return;
    }
    
    // Ask if they want to select a winner
    const selectWinner = confirm('Do you want to select a winner for this competition?');
    
    if (selectWinner) {
        // Load participants to select winner
        fetch(`${API_URL}/participants/${competitionId}`)
            .then(response => response.json())
            .then(participants => {
                if (participants.length === 0) {
                    showNotification('No participants in this competition', 'warning');
                    finalizeCompetitionDone(competitionId, null);
                    return;
                }
                
                let html = `
                    <h2>Select Winner</h2>
                    <p>Choose the winner for this competition:</p>
                    <div style="max-width: 600px; margin: 0 auto;">
                `;
                
                participants.forEach(p => {
                    html += `
                        <div style="background: white; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; cursor: pointer;" 
                             onclick="finalizeCompetitionDone(${competitionId}, ${p.participant_id})">
                            <strong>${p.contestant_number ? `#${p.contestant_number} - ` : ''}${p.participant_name}</strong>
                            <p style="margin: 5px 0; color: #666;">Age: ${p.age}, Year: ${p.year_level || 'N/A'}</p>
                        </div>
                    `;
                });
                
                html += `
                        <button onclick="finalizeCompetitionDone(${competitionId}, null)" style="margin-top: 20px; background: #6c757d; color: white;">
                            Skip - No Winner
                        </button>
                        <button onclick="showViewCompetitions()" style="margin-top: 20px; margin-left: 10px;">
                            Cancel
                        </button>
                    </div>
                `;
                
                document.getElementById("content").innerHTML = html;
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error loading participants', 'error');
            });
    } else {
        finalizeCompetitionDone(competitionId, null);
    }
}
function finalizeCompetitionDone(competitionId, winnerId) {
    const notes = prompt('Add notes about this event (optional):');
    
    // First update status to DONE
    fetch(`${API_URL}/update-competition-status/${competitionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' })
    })
    .then(response => response.json())
    .then(data => {
        // Then archive it
        return fetch(`${API_URL}/archive-competition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                competition_id: competitionId,
                winner_participant_id: winnerId,
                notes: notes
            })
        });
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Competition marked as DONE and archived!', 'success');
            showViewCompetitions();
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error marking competition as done', 'error');
    });
}
function showEditCompetitionForm(competitionId) {
    // Check if competition is done
    fetch(`${API_URL}/check-competition-status/${competitionId}`)
        .then(response => response.json())
        .then(statusData => {
            if (statusData.is_done) {
                showNotification('Cannot edit: This competition is marked as DONE', 'error');
                return;
            }
            
            // Load competition for editing
            fetch(`${API_URL}/competition/${competitionId}`)
                .then(response => response.json())
                .then(competition => {
                    fetch(`${API_URL}/event-types`)
                        .then(response => response.json())
                        .then(eventTypes => {
                            displayEditCompetitionForm(competition, eventTypes);
                        });
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Error loading competition', 'error');
                });
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error checking competition status', 'error');
        });
}

function displayEditCompetitionForm(competition, eventTypes) {
    let html = `
        <h2>Edit Competition</h2>
        <form id="editCompetitionForm" onsubmit="updateCompetition(event, ${competition.competition_id})" style="max-width: 600px; margin: 0 auto;">
            
            <label>Competition Name: *</label>
            <input type="text" id="competition_name" value="${competition.competition_name}" required 
                   style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
            
            <label>Event Type: *</label>
            <select id="event_type_id" required 
                    style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
    `;
    
    eventTypes.forEach(type => {
        const selected = type.event_type_id === competition.event_type_id ? 'selected' : '';
        html += `<option value="${type.event_type_id}" ${selected}>${type.type_name}</option>`;
    });
    
    html += `
            </select>
            
            <label>Competition Date: *</label>
            <input type="date" id="competition_date" value="${competition.competition_date}" required 
                   style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
            
            <label>Event Description:</label>
            <textarea id="event_description" rows="4" 
                      style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">${competition.event_description || ''}</textarea>
            
            <div style="margin-top: 20px;">
                <button type="submit" style="background: #007bff; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    Update Competition
                </button>
                <button type="button" onclick="showViewCompetitions()" style="background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </form>
    `;
    
    document.getElementById("content").innerHTML = html;
}

function updateCompetition(event, competitionId) {
    event.preventDefault();
    
    const competitionData = {
        competition_name: document.getElementById('competition_name').value,
        event_type_id: document.getElementById('event_type_id').value,
        competition_date: document.getElementById('competition_date').value,
        event_description: document.getElementById('event_description').value
    };
    
    fetch(`${API_URL}/update-competition/${competitionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            showViewCompetitions();
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating competition', 'error');
    });
}

// ================================================
// ADD THESE FUNCTIONS TO YOUR app.js FILE
// ================================================

// ================================================
// EVENT HISTORY FUNCTIONS
// ================================================

function showEventHistory() {
    document.getElementById("content").innerHTML = `
        <h2>Event History</h2>
        <p>View all completed and archived events</p>
        <div class="loading">Loading event history...</div>
    `;
    
    fetch(`${API_URL}/event-history`)
        .then(response => response.json())
        .then(history => {
            displayEventHistory(history);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading event history', 'error');
        });
}

function displayEventHistory(history) {
    let html = `
        <h2>Event History</h2>
        <div style="margin-bottom: 20px;">
            <p>Completed and archived events</p>
        </div>
    `;
    
    if (history.length === 0) {
        html += '<p>No archived events yet.</p>';
    } else {
        html += '<div style="display: grid; gap: 15px;">';
        
        history.forEach(event => {
            html += `
                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; border-left: 4px solid #800020;">
                    <div style="display: flex; justify-content: between; align-items: start;">
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 10px 0; color: #800020;">${event.competition_name}</h3>
                            <p style="margin: 5px 0;"><strong>Event Type:</strong> ${event.event_type_name}</p>
                            <p style="margin: 5px 0;"><strong>Event Date:</strong> ${event.competition_date}</p>
                            <p style="margin: 5px 0;"><strong>Completed:</strong> ${new Date(event.completion_date).toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Participants:</strong> ${event.total_participants} | <strong>Judges:</strong> ${event.total_judges}</p>
                            ${event.winner_name ? `<p style="margin: 5px 0;"><strong>Winner:</strong> ${event.winner_name}</p>` : ''}
                            ${event.total_awards > 0 ? `<p style="margin: 5px 0;"><strong>Special Awards:</strong> ${event.total_awards}</p>` : ''}
                        </div>
                        <span style="background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                            ${event.event_status.toUpperCase()}
                        </span>
                    </div>
                    ${event.notes ? `
                        <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                            <strong>Notes:</strong> ${event.notes}
                        </div>
                    ` : ''}
                    <div style="margin-top: 15px;">
                        <button onclick="viewEventHistoryDetails(${event.history_id})" style="padding: 8px 20px;">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    document.getElementById("content").innerHTML = html;
}

function viewEventHistoryDetails(historyId) {
    fetch(`${API_URL}/event-history/${historyId}`)
        .then(response => response.json())
        .then(event => {
            document.getElementById("content").innerHTML = `
                <h2>Event History Details</h2>
                <button onclick="showEventHistory()" style="margin-bottom: 20px;">Back to History</button>
                
                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 30px; max-width: 800px; margin: 0 auto;">
                    <h3 style="color: #800020; margin-bottom: 20px;">${event.competition_name}</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <p><strong>Event Type:</strong> ${event.event_type_name}</p>
                            <p><strong>Event Date:</strong> ${event.competition_date}</p>
                            <p><strong>Completed Date:</strong> ${new Date(event.completion_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p><strong>Total Participants:</strong> ${event.total_participants}</p>
                            <p><strong>Total Judges:</strong> ${event.total_judges}</p>
                            <p><strong>Status:</strong> ${event.event_status}</p>
                        </div>
                    </div>
                    
                    ${event.winner_name ? `
                        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                            <strong style="font-size: 18px;">🏆 Winner: ${event.winner_name}</strong>
                        </div>
                    ` : ''}
                    
                    ${event.notes ? `
                        <div style="margin-top: 20px;">
                            <strong>Notes:</strong>
                            <p style="padding: 15px; background: #f8f9fa; border-radius: 5px; margin-top: 10px;">
                                ${event.notes}
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading event details', 'error');
        });
}

function archiveCompetition(competitionId) {
    if (!confirm('Archive this competition? It will be marked as DONE and moved to history.')) {
        return;
    }
    
    const winnerId = prompt('Enter winner participant ID (or leave blank):');
    const notes = prompt('Add notes about this event (optional):');
    
    fetch(`${API_URL}/archive-competition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            competition_id: competitionId,
            winner_participant_id: winnerId || null,
            notes: notes || null
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            showViewCompetitions();
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error archiving competition', 'error');
    });
}

// ================================================
// SPECIAL AWARDS FUNCTIONS
// ================================================

function manageSpecialAwards(competitionId) {
    Promise.all([
        fetch(`${API_URL}/competition/${competitionId}`).then(r => r.json()),
        fetch(`${API_URL}/pageant-segments/${competitionId}`).then(r => r.json()),
        fetch(`${API_URL}/special-awards/${competitionId}`).then(r => r.json()),
        fetch(`${API_URL}/participants/${competitionId}`).then(r => r.json())
    ])
    .then(([competition, segments, awards, participants]) => {
        displaySpecialAwardsManagement(competition, segments, awards, participants);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error loading special awards', 'error');
    });
}

function displaySpecialAwardsManagement(competition, segments, awards, participants) {
    let html = `
        <h2>Manage Special Awards - ${competition.competition_name}</h2>
        <button onclick="showViewCompetitions()" style="margin-bottom: 20px;">Back to Competitions</button>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066cc;">
            <strong>💡 How Special Awards Work:</strong>
            <p>Each segment can have special awards. Awards are given to participants who excel in specific categories within each segment.</p>
        </div>
    `;
    
    if (segments.length === 0) {
        html += '<p>This competition has no segments. Special awards are only available for multi-day pageant competitions.</p>';
    } else {
        html += '<h3>Current Special Awards</h3>';
        
        if (awards.length === 0) {
            html += '<p>No special awards created yet.</p>';
        } else {
            html += '<div style="display: grid; gap: 10px; margin-bottom: 30px;">';
            
            awards.forEach(award => {
                html += `
                    <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #800020;">${award.award_name}</strong>
                            <p style="margin: 5px 0; color: #666;">Segment: ${award.segment_name} (Day ${award.day_number})</p>
                            <p style="margin: 5px 0;">Winner: <strong>${award.participant_name}</strong> ${award.contestant_number ? `(#${award.contestant_number})` : ''}</p>
                            ${award.awarded_by ? `<p style="margin: 5px 0; font-size: 12px;">Awarded by: ${award.awarded_by}</p>` : ''}
                        </div>
                        <button onclick="deleteSpecialAward(${award.award_id})" style="background: #dc3545; color: white; padding: 8px 15px;">
                            Delete
                        </button>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        html += `
            <h3>Create New Special Award</h3>
            <form id="specialAwardForm" onsubmit="submitSpecialAward(event, ${competition.competition_id})" style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; max-width: 600px;">
                <label>Segment:</label>
                <select id="segment_id" required style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="">-- Select Segment --</option>
        `;
        
        segments.forEach(segment => {
            html += `<option value="${segment.segment_id}">${segment.segment_name} (Day ${segment.day_number})</option>`;
        });
        
        html += `
                </select>
                
                <label>Award Name:</label>
                <input type="text" id="award_name" placeholder="e.g., Best in Swimsuit, Best Talent" required 
                       style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                
                <label>Winner:</label>
                <select id="participant_id" required style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="">-- Select Winner --</option>
        `;
        
        participants.forEach(participant => {
            html += `<option value="${participant.participant_id}">${participant.participant_name} ${participant.contestant_number ? `(#${participant.contestant_number})` : ''}</option>`;
        });
        
        html += `
                </select>
                
                <label>Notes (optional):</label>
                <textarea id="award_notes" rows="3" placeholder="Reason for award..." 
                          style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                
                <button type="submit" style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">
                    Create Special Award
                </button>
            </form>
        `;
    }
    
    document.getElementById("content").innerHTML = html;
}

function submitSpecialAward(event, competitionId) {
    event.preventDefault();
    
    const awardData = {
        competition_id: competitionId,
        segment_id: document.getElementById('segment_id').value,
        award_name: document.getElementById('award_name').value,
        participant_id: document.getElementById('participant_id').value,
        notes: document.getElementById('award_notes').value || null
    };
    
    fetch(`${API_URL}/create-special-award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(awardData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            manageSpecialAwards(competitionId);
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error creating special award', 'error');
    });
}

function deleteSpecialAward(awardId) {
    if (!confirm('Delete this special award?')) {
        return;
    }
    
    fetch(`${API_URL}/delete-special-award/${awardId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            location.reload();
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting special award', 'error');
    });
}

// ================================================
// JUDGE TABULATION FUNCTION
// ================================================

function viewJudgeTabulation(competitionId) {
    fetch(`${API_URL}/judge-tabulation/${competitionId}`)
        .then(response => response.json())
        .then(data => {
            displayJudgeTabulation(data, competitionId);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading judge tabulation', 'error');
        });
}

function displayJudgeTabulation(participants, competitionId) {
    let html = `
        <h2>Judge Tabulation - Score Breakdown</h2>
        <button onclick="showViewCompetitions()" style="margin-bottom: 20px;">Back to Competitions</button>
        
        <p>View how each judge scored each participant</p>
    `;
    
    if (participants.length === 0) {
        html += '<p>No scores submitted yet.</p>';
    } else {
        html += '<table><thead><tr><th>Contestant #</th><th>Participant</th>';
        
        // Get unique judges from first participant
        const judges = participants[0].judge_scores;
        judges.forEach(judge => {
            html += `<th>${judge.judge_name}</th>`;
        });
        html += '<th>Average</th></tr></thead><tbody>';
        
        participants.forEach(participant => {
            html += `<tr><td style="text-align: center; font-weight: bold;">${participant.contestant_number || 'N/A'}</td>`;
            html += `<td><strong>${participant.participant_name}</strong></td>`;
            
            let total = 0;
            let count = 0;
            
            participant.judge_scores.forEach(score => {
                const scoreValue = score.total_score !== null ? parseFloat(score.total_score).toFixed(2) : '-';
                const lockIcon = score.is_locked ? '🔒' : '';
                html += `<td style="text-align: center;">${scoreValue} ${lockIcon}</td>`;
                
                if (score.total_score !== null) {
                    total += parseFloat(score.total_score);
                    count++;
                }
            });
            
            const average = count > 0 ? (total / count).toFixed(2) : '-';
            html += `<td style="text-align: center; font-weight: bold; background: #f8f9fa;">${average}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
    }
    
    document.getElementById("content").innerHTML = html;
}
function markCompetitionDone(competitionId) {
    if (!confirm('Mark this competition as DONE?\n\nThis will:\n- Lock the competition (judges cannot score)\n- Move it to event history\n- Prevent new participants/judges from being added\n\nThis action cannot be easily undone.')) {
        return;
    }
    
    const selectWinner = confirm('Do you want to select a winner for this competition?');
    
    if (selectWinner) {
        fetch(`${API_URL}/participants/${competitionId}`)
            .then(response => response.json())
            .then(participants => {
                if (participants.length === 0) {
                    alert('No participants in this competition');
                    finalizeCompetitionDone(competitionId, null);
                    return;
                }
                
                let html = `
                    <h2>Select Winner</h2>
                    <p>Choose the winner for this competition:</p>
                    <div style="max-width: 600px; margin: 0 auto;">
                `;
                
                participants.forEach(p => {
                    html += `
                        <div style="background: white; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; cursor: pointer; border-left: 4px solid #800020;" 
                             onclick="finalizeCompetitionDone(${competitionId}, ${p.participant_id})"
                             onmouseover="this.style.background='#f8f9fa'" 
                             onmouseout="this.style.background='white'">
                            <strong>${p.contestant_number ? `#${p.contestant_number} - ` : ''}${p.participant_name}</strong>
                            <p style="margin: 5px 0; color: #666;">Age: ${p.age}, Year: ${p.year_level || 'N/A'}</p>
                        </div>
                    `;
                });
                
                html += `
                        <button onclick="finalizeCompetitionDone(${competitionId}, null)" style="margin-top: 20px; background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">
                            Skip - No Winner
                        </button>
                        <button onclick="showViewCompetitions()" style="margin-top: 20px; margin-left: 10px; padding: 12px 30px;">
                            Cancel
                        </button>
                    </div>
                `;
                
                document.getElementById("content").innerHTML = html;
            });
    } else {
        finalizeCompetitionDone(competitionId, null);
    }
}

function finalizeCompetitionDone(competitionId, winnerId) {
    const notes = prompt('Add notes about this event (optional):');
    
    fetch(`${API_URL}/update-competition-status/${competitionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' })
    })
    .then(response => response.json())
    .then(data => {
        return fetch(`${API_URL}/archive-competition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                competition_id: competitionId,
                winner_participant_id: winnerId,
                notes: notes
            })
        });
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Competition marked as DONE and archived!\n\nJudges can no longer score for this competition.');
            showViewCompetitions();
        } else {
            alert('Error: ' + data.error);
        }
    });
}


console.log('✅ Event History, Special Awards, and Judge Tabulation functions loaded');

console.log('Clean Admin Dashboard Loaded - Maroon & White Theme');