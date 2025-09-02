// Enhanced Admin Dashboard JavaScript with Criteria Management

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    showDashboard(); // Show enhanced dashboard by default
});

// Check if user is authenticated and is admin
function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    // Update header to show admin info
    updateHeader(user);
}

// Update header with user info and logout button
function updateHeader(user) {
    const header = document.querySelector('header');
    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>🏆 Enhanced Judging System</h1>
                <p>Admin Dashboard - Custom Events & Criteria</p>
            </div>
            <div style="text-align: right;">
                <div>Welcome, ${user.username}</div>
                <div style="font-size: 12px;">Role: Administrator</div>
                <button onclick="logout()" style="margin-top: 10px; padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; border-radius: 5px; cursor: pointer;">
                    Logout
                </button>
            </div>
        </div>
    `;
}

// Logout function
function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Enhanced Dashboard
function showDashboard() {
    document.getElementById("content").innerHTML = `
        <h2>🏆 Enhanced Judging System Dashboard</h2>
        <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #800020;">
            <h3 style="color: #800020; margin-bottom: 15px;">✨ New Enhanced Features</h3>
            <ul style="color: #666; line-height: 1.8;">
                <li><strong>Custom Event Types:</strong> Create music, dance, pageant, or any custom event category</li>
                <li><strong>Editable Criteria:</strong> Define custom judging criteria with specific percentages</li>
                <li><strong>Pageant Support:</strong> Special fields for beauty pageants (height, measurements, talents)</li>
                <li><strong>Flexible Scoring:</strong> Multi-criteria scoring with weighted percentages</li>
            </ul>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;">
            <div class="dashboard-card">
                <h3>🎭 Event Types</h3>
                <p>Manage custom event categories</p>
                <button onclick="showEventTypes()" class="card-button">Manage Event Types</button>
            </div>
            
            <div class="dashboard-card">
                <h3>📝 Criteria Templates</h3>
                <p>Create reusable judging criteria</p>
                <button onclick="showCriteriaTemplates()" class="card-button">Manage Criteria</button>
            </div>
            
            <div class="dashboard-card">
                <h3>🏆 Competitions</h3>
                <p>Create and manage competitions</p>
                <button onclick="showCreateCompetitionForm()" class="card-button">New Competition</button>
                <button onclick="showViewCompetitions()" class="card-button">Manage All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>⚖️ Judges</h3>
                <p>Manage judge profiles and assignments</p>
                <button onclick="showAddJudgeForm()" class="card-button">Add Judge</button>
                <button onclick="showViewJudges()" class="card-button">View All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>👥 Participants</h3>
                <p>Manage participant registrations</p>
                <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                <button onclick="showViewParticipants()" class="card-button">Manage All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>📊 Scoring & Results</h3>
                <p>View detailed scoring results</p>
                <button onclick="showScoringResults()" class="card-button">View Results</button>
            </div>
        </div>
    `;
}

// ================================================
// EVENT TYPES MANAGEMENT
// ================================================

function showEventTypes() {
    document.getElementById("content").innerHTML = `
        <h2>🎭 Event Types Management</h2>
        
        <div style="margin-bottom: 30px;">
            <button onclick="showCreateEventTypeForm()" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                ➕ Add New Event Type
            </button>
        </div>
        
        <div id="eventTypesList">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading event types...</p>
            </div>
        </div>
    `;

    // Load event types
    fetch('http://localhost:3002/event-types')
    .then(response => response.json())
    .then(eventTypes => {
        let eventTypesHtml = `
            <table style="width: 100%; margin-top: 20px;">
                <tr>
                    <th>Event Type</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Actions</th>
                </tr>
        `;
        
        eventTypes.forEach(eventType => {
            eventTypesHtml += `
                <tr>
                    <td><strong>${eventType.type_name}</strong></td>
                    <td>${eventType.description || 'No description'}</td>
                    <td>
                        <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; ${eventType.is_pageant ? 'background: #ff69b4; color: white;' : 'background: #17a2b8; color: white;'}">
                            ${eventType.is_pageant ? '👑 PAGEANT' : '🎪 REGULAR'}
                        </span>
                    </td>
                    <td>
                        <button onclick="editEventType(${eventType.event_type_id})" style="margin: 2px; padding: 6px 12px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
                        <button onclick="deleteEventType(${eventType.event_type_id})" style="margin: 2px; padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                    </td>
                </tr>
            `;
        });
        
        eventTypesHtml += '</table>';
        document.getElementById("eventTypesList").innerHTML = eventTypesHtml;
    })
    .catch(error => {
        console.error('Error loading event types:', error);
        document.getElementById("eventTypesList").innerHTML = '<p class="alert alert-error">Error loading event types.</p>';
    });
}

function showCreateEventTypeForm() {
    document.getElementById("content").innerHTML = `
        <h2>➕ Create New Event Type</h2>
        
        <form id="createEventTypeForm" style="max-width: 600px;">
            <label for="type_name">Event Type Name:</label>
            <input type="text" id="type_name" name="type_name" required placeholder="e.g., Beauty Pageant, Talent Show, etc.">
            
            <label for="description">Description:</label>
            <textarea id="description" name="description" rows="3" placeholder="Describe what this event type is about..."></textarea>
            
            <label for="is_pageant">Event Category:</label>
            <select id="is_pageant" name="is_pageant" required>
                <option value="0">🎪 Regular Event (Music, Dance, Art, etc.)</option>
                <option value="1">👑 Beauty Pageant Event</option>
            </select>
            
            <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong>💡 Tips:</strong>
                <ul style="margin-top: 10px; color: #1976d2;">
                    <li>Choose "Regular Event" for music, dance, art, singing, talent shows</li>
                    <li>Choose "Beauty Pageant" for events that need special fields (height, measurements, etc.)</li>
                    <li>You can create custom criteria for any event type later</li>
                </ul>
            </div>
            
            <input type="submit" value="Create Event Type">
            <button type="button" onclick="showEventTypes()" class="secondary">Cancel</button>
        </form>
    `;

    document.getElementById("createEventTypeForm").onsubmit = function(event) {
        event.preventDefault();

        const eventTypeData = {
            type_name: document.getElementById("type_name").value,
            description: document.getElementById("description").value,
            is_pageant: document.getElementById("is_pageant").value === "1"
        };

        fetch('http://localhost:3002/create-event-type', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventTypeData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Event type created successfully!');
                showEventTypes();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating event type');
        });
    };
}

// ================================================
// CRITERIA TEMPLATES MANAGEMENT
// ================================================

function showCriteriaTemplates() {
    document.getElementById("content").innerHTML = `
        <h2>📝 Judging Criteria Templates</h2>
        
        <div style="margin-bottom: 30px;">
            <button onclick="showCreateCriteriaTemplateForm()" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                ➕ Create Criteria Template
            </button>
        </div>
        
        <div id="criteriaTemplatesList">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading criteria templates...</p>
            </div>
        </div>
    `;

    // Load criteria templates
    fetch('http://localhost:3002/criteria-templates')
    .then(response => response.json())
    .then(templates => {
        let templatesHtml = `
            <div style="display: grid; gap: 20px;">
        `;
        
        templates.forEach(template => {
            templatesHtml += `
                <div class="dashboard-card" style="text-align: left;">
                    <h3>${template.template_name}</h3>
                    <p><strong>Event Type:</strong> ${template.type_name}</p>
                    <p>${template.description || 'No description'}</p>
                    <div style="margin-top: 15px;">
                        <button onclick="viewTemplateCriteria(${template.template_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">View Criteria</button>
                        <button onclick="editCriteriaTemplate(${template.template_id})" style="margin: 2px; padding: 8px 16px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
                        <button onclick="deleteCriteriaTemplate(${template.template_id})" style="margin: 2px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                    </div>
                </div>
            `;
        });
        
        templatesHtml += '</div>';
        
        if (templates.length === 0) {
            templatesHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
                    <h3>No Criteria Templates Yet</h3>
                    <p>Create your first criteria template to get started!</p>
                    <button onclick="showCreateCriteriaTemplateForm()" class="card-button">Create Template</button>
                </div>
            `;
        }
        
        document.getElementById("criteriaTemplatesList").innerHTML = templatesHtml;
    })
    .catch(error => {
        console.error('Error loading criteria templates:', error);
        document.getElementById("criteriaTemplatesList").innerHTML = '<p class="alert alert-error">Error loading criteria templates.</p>';
    });
}

// Enhanced Competition Creation with Custom Event Types
function showCreateCompetitionForm() {
    document.getElementById("content").innerHTML = `
        <h2>🏆 Create New Competition</h2>
        <form id="createCompetitionForm" style="max-width: 700px;">
            <label for="competition_name">Competition Name:</label>
            <input type="text" id="competition_name" name="competition_name" required placeholder="Enter competition name">
            
            <label for="event_type_id">Event Type:</label>
            <select id="event_type_id" name="event_type_id" required>
                <option value="">Select Event Type</option>
            </select>
            
            <label for="competition_date">Competition Date:</label>
            <input type="date" id="competition_date" name="competition_date" required>
            
            <label for="event_description">Event Description:</label>
            <textarea id="event_description" name="event_description" rows="3" placeholder="Describe the competition details..."></textarea>
            
            <div id="eventTypeInfo" style="display: none; background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong>📋 Next Steps:</strong>
                <p>After creating the competition, you'll be able to customize the judging criteria and percentages.</p>
            </div>
            
            <input type="submit" value="Create Competition">
            <button type="button" onclick="showDashboard()" class="secondary">Cancel</button>
        </form>
    `;

    // Load event types
    fetch('http://localhost:3002/event-types')
    .then(response => response.json())
    .then(eventTypes => {
        const eventTypeSelect = document.getElementById("event_type_id");
        eventTypes.forEach(eventType => {
            const option = document.createElement("option");
            option.value = eventType.event_type_id;
            option.textContent = `${eventType.type_name} ${eventType.is_pageant ? '👑' : '🎪'}`;
            eventTypeSelect.appendChild(option);
        });

        // Show info when event type is selected
        eventTypeSelect.onchange = function() {
            document.getElementById("eventTypeInfo").style.display = this.value ? "block" : "none";
        };
    });

    document.getElementById("createCompetitionForm").onsubmit = function(event) {
        event.preventDefault();

        const competitionData = {
            competition_name: document.getElementById("competition_name").value,
            event_type_id: document.getElementById("event_type_id").value,
            competition_date: document.getElementById("competition_date").value,
            event_description: document.getElementById("event_description").value
        };

        fetch('http://localhost:3002/create-competition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(competitionData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Competition created successfully! You can now set up judging criteria.');
                showViewCompetitions();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating competition');
        });
    };
}

// Enhanced View Competitions with Criteria Management
function showViewCompetitions() {
    document.getElementById("content").innerHTML = `
        <h2>🏆 Manage Competitions</h2>
        <div style="margin-bottom: 20px;">
            <button onclick="showCreateCompetitionForm()" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                ➕ Add New Competition
            </button>
        </div>
        <div id="competitionsList">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 24px;">⏳</div>
                <p>Loading competitions...</p>
            </div>
        </div>
    `;

    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        let competitionsHtml = `
            <div style="display: grid; gap: 20px;">
        `;
        
        competitions.forEach(competition => {
            competitionsHtml += `
                <div class="dashboard-card" style="text-align: left;">
                    <h3>${competition.competition_name}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
                        <div>
                            <p><strong>Event Type:</strong> ${competition.type_name} ${competition.is_pageant ? '👑' : '🎪'}</p>
                            <p><strong>Date:</strong> ${competition.competition_date}</p>
                            <p><strong>Participants:</strong> ${competition.participant_count || 0}</p>
                        </div>
                        <div>
                            <p><strong>Judges:</strong> ${competition.judge_count || 0}</p>
                            <p><strong>Description:</strong> ${competition.event_description || 'No description'}</p>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <button onclick="manageCriteria(${competition.competition_id}, '${competition.competition_name}')" style="margin: 2px; padding: 8px 16px; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">⚙️ Manage Criteria</button>
                        <button onclick="viewCompetitionDetails(${competition.competition_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ View Details</button>
                        <button onclick="editCompetition(${competition.competition_id})" style="margin: 2px; padding: 8px 16px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">✏️ Edit</button>
                        <button onclick="deleteCompetition(${competition.competition_id})" style="margin: 2px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });
        
        competitionsHtml += '</div>';
        
        if (competitions.length === 0) {
            competitionsHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
                    <h3>No Competitions Yet</h3>
                    <p>Create your first competition to get started!</p>
                    <button onclick="showCreateCompetitionForm()" class="card-button">Create Competition</button>
                </div>
            `;
        }
        
        document.getElementById("competitionsList").innerHTML = competitionsHtml;
    })
    .catch(error => {
        console.error('Error loading competitions:', error);
        document.getElementById("competitionsList").innerHTML = '<p class="alert alert-error">Error loading competitions.</p>';
    });
}

// Manage Competition Criteria
function manageCriteria(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>⚙️ Manage Judging Criteria</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>📊 Important:</strong>
            <ul style="margin-top: 10px; color: #856404;">
                <li>All criteria percentages must add up to exactly <strong>100%</strong></li>
                <li>Judges will score each criterion separately</li>
                <li>Final scores will be calculated using weighted averages</li>
                <li>You can reorder criteria by changing the order numbers</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="addCriterion()" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                ➕ Add Criterion
            </button>
            <button onclick="loadTemplateForm(${competitionId})" style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-left: 10px;">
                📋 Load from Template
            </button>
        </div>
        
        <form id="criteriaForm">
            <input type="hidden" id="competition_id" value="${competitionId}">
            
            <div id="criteriaContainer">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 24px;">⏳</div>
                    <p>Loading current criteria...</p>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <button type="button" onclick="saveCriteria()" style="background: linear-gradient(135deg, #800020 0%, #a0002a 100%); color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px;">
                    💾 Save All Criteria
                </button>
                <button type="button" onclick="showViewCompetitions()" class="secondary" style="margin-left: 10px;">Cancel</button>
            </div>
            
            <div id="percentageTotal" style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px; text-align: center;">
                <strong>Total Percentage: <span id="totalPercentage">0</span>%</strong>
            </div>
        </form>
    `;

    // Load existing criteria
    fetch(`http://localhost:3002/competition-criteria/${competitionId}`)
    .then(response => response.json())
    .then(criteria => {
        if (criteria.length === 0) {
            // No criteria yet, show default empty form
            document.getElementById("criteriaContainer").innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
                    <h3>No Criteria Set Yet</h3>
                    <p>Add your first judging criterion to get started!</p>
                </div>
            `;
        } else {
            displayCriteria(criteria);
        }
        updatePercentageTotal();
    })
    .catch(error => {
        console.error('Error loading criteria:', error);
        document.getElementById("criteriaContainer").innerHTML = '<p class="alert alert-error">Error loading criteria.</p>';
    });
}

function displayCriteria(criteria) {
    let criteriaHtml = '';
    criteria.forEach((criterion, index) => {
        criteriaHtml += `
            <div class="criterion-item" style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <div style="display: grid; grid-template-columns: auto 1fr auto auto; gap: 15px; align-items: center;">
                    <div style="font-weight: bold; color: #800020;">#{criterion.order_number || index + 1}</div>
                    <div style="display: grid; gap: 10px;">
                        <input type="text" class="criteria-name" value="${criterion.criteria_name}" placeholder="Criterion Name (e.g., Technical Skill)" style="font-weight: 600; font-size: 16px;">
                        <textarea class="criteria-description" placeholder="Description of what judges should evaluate..." rows="2">${criterion.description || ''}</textarea>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Percentage:</label>
                        <input type="number" class="criteria-percentage" value="${criterion.percentage}" min="0" max="100" step="0.1" style="width: 80px; text-align: center; font-weight: bold;" onchange="updatePercentageTotal()">
                        <span style="font-size: 12px; color: #666;">%</span>
                    </div>
                    <div>
                        <button type="button" onclick="removeCriterion(this)" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById("criteriaContainer").innerHTML = criteriaHtml;
}

function addCriterion() {
    const container = document.getElementById("criteriaContainer");
    const currentCriteria = container.querySelectorAll('.criterion-item').length;
    
    const newCriterion = document.createElement('div');
    newCriterion.className = 'criterion-item';
    newCriterion.style = 'background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 15px;';
    newCriterion.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr auto auto; gap: 15px; align-items: center;">
            <div style="font-weight: bold; color: #800020;">#{currentCriteria + 1}</div>
            <div style="display: grid; gap: 10px;">
                <input type="text" class="criteria-name" placeholder="Criterion Name (e.g., Technical Skill)" style="font-weight: 600; font-size: 16px;">
                <textarea class="criteria-description" placeholder="Description of what judges should evaluate..." rows="2"></textarea>
            </div>
            <div>
                <label style="font-size: 12px; color: #666;">Percentage:</label>
                <input type="number" class="criteria-percentage" value="0" min="0" max="100" step="0.1" style="width: 80px; text-align: center; font-weight: bold;" onchange="updatePercentageTotal()">
                <span style="font-size: 12px; color: #666;">%</span>
            </div>
            <div>
                <button type="button" onclick="removeCriterion(this)" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">🗑️</button>
            </div>
        </div>
    `;
    
    // If container is empty (showing placeholder), clear it first
    if (container.innerHTML.includes('No Criteria Set Yet')) {
        container.innerHTML = '';
    }
    
    container.appendChild(newCriterion);
    updatePercentageTotal();
}

function removeCriterion(button) {
    button.closest('.criterion-item').remove();
    updatePercentageTotal();
    
    // Update order numbers
    const criteria = document.querySelectorAll('.criterion-item');
    criteria.forEach((item, index) => {
        const orderSpan = item.querySelector('div[style*="font-weight: bold"]');
        orderSpan.textContent = `#${index + 1}`;
    });
}

function updatePercentageTotal() {
    const percentageInputs = document.querySelectorAll('.criteria-percentage');
    let total = 0;
    percentageInputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    
    const totalSpan = document.getElementById('totalPercentage');
    if (totalSpan) {
        totalSpan.textContent = total.toFixed(1);
        
        // Color coding
        const container = document.getElementById('percentageTotal');
        if (Math.abs(total - 100) < 0.1) {
            container.style.background = '#d4edda';
            container.style.border = '2px solid #28a745';
            container.style.color = '#155724';
        } else {
            container.style.background = '#fff3cd';
            container.style.border = '2px solid #ffc107';
            container.style.color = '#856404';
        }
    }
}

function saveCriteria() {
    const competitionId = document.getElementById('competition_id').value;
    const criteriaItems = document.querySelectorAll('.criterion-item');
    
    if (criteriaItems.length === 0) {
        alert('Please add at least one criterion before saving.');
        return;
    }
    
    const criteria = [];
    let totalPercentage = 0;
    
    criteriaItems.forEach((item, index) => {
        const name = item.querySelector('.criteria-name').value.trim();
        const description = item.querySelector('.criteria-description').value.trim();
        const percentage = parseFloat(item.querySelector('.criteria-percentage').value) || 0;
        
        if (!name) {
            alert(`Please enter a name for criterion #${index + 1}`);
            return;
        }
        
        criteria.push({
            criteria_name: name,
            description: description,
            percentage: percentage,
            max_score: 100,
            order_number: index + 1
        });
        
        totalPercentage += percentage;
    });
    
    if (Math.abs(totalPercentage - 100) > 0.1) {
        alert(`Total percentage must equal 100%. Current total: ${totalPercentage.toFixed(1)}%`);
        return;
    }
    
    if (criteria.length === 0) return;
    
    fetch('http://localhost:3002/save-competition-criteria', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            competition_id: competitionId,
            criteria: criteria
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Criteria saved successfully! Judges can now score participants using these criteria.');
            showViewCompetitions();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving criteria');
    });
}

// Enhanced Participant Form with Pageant Support
function showAddParticipantForm() {
    document.getElementById("content").innerHTML = `
        <h2>👥 Add New Participant</h2>
        
        <form id="addParticipantForm" style="max-width: 700px;">
            <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px;">Basic Information</h3>
            
            <label for="participant_name">Participant Name:</label>
            <input type="text" id="participant_name" name="participant_name" required>
            
            <label for="email">Email Address:</label>
            <input type="email" id="email" name="email" required>
            
            <label for="phone">Phone Number:</label>
            <input type="tel" id="phone" name="phone">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
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
                <div>
                    <label for="registration_fee">Registration Status:</label>
                    <select id="registration_fee" name="registration_fee" required>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="waived">Waived</option>
                    </select>
                </div>
            </div>
            
            <label for="school_organization">School/Organization:</label>
            <input type="text" id="school_organization" name="school_organization">
            
            <h3 style="color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; margin-top: 30px;">Competition Details</h3>
            
            <label for="competition">Competition:</label>
            <select id="competition" name="competition" required>
                <option value="">Select Competition</option>
            </select>
            
            <label for="performance_title">Performance/Entry Title:</label>
            <input type="text" id="performance_title" name="performance_title">
            
            <label for="performance_description">Performance Description:</label>
            <textarea id="performance_description" name="performance_description" rows="3" placeholder="Describe the performance, talent, or entry..."></textarea>
            
            <div id="pageantFields" style="display: none;">
                <h3 style="color: #ff69b4; border-bottom: 2px solid #ff69b4; padding-bottom: 10px; margin-top: 30px;">👑 Pageant Specific Information</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label for="height">Height:</label>
                        <input type="text" id="height" name="height" placeholder="e.g., 5'6&quot;">
                    </div>
                    <div>
                        <label for="measurements">Measurements:</label>
                        <input type="text" id="measurements" name="measurements" placeholder="e.g., 34-24-36">
                    </div>
                </div>
                
                <label for="talents">Special Talents:</label>
                <textarea id="talents" name="talents" rows="2" placeholder="List special talents, skills, or abilities..."></textarea>
                
                <label for="special_awards">Awards & Achievements:</label>
                <textarea id="special_awards" name="special_awards" rows="2" placeholder="List awards, honors, achievements, positions held..."></textarea>
            </div>
            
            <div style="margin-top: 30px;">
                <input type="submit" value="Add Participant" style="padding: 15px 30px; font-size: 16px;">
                <button type="button" onclick="showViewParticipants()" class="secondary" style="margin-left: 10px;">Cancel</button>
            </div>
        </form>
    `;

    // Load competitions and show pageant fields when needed
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        const competitionSelect = document.getElementById("competition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.setAttribute('data-is-pageant', competition.is_pageant);
            option.textContent = `${competition.competition_name} (${competition.type_name}) ${competition.is_pageant ? '👑' : '🎪'}`;
            competitionSelect.appendChild(option);
        });

        // Show/hide pageant fields based on competition type
        competitionSelect.onchange = function() {
            const selectedOption = this.options[this.selectedIndex];
            const isPageant = selectedOption.getAttribute('data-is-pageant') === '1';
            document.getElementById("pageantFields").style.display = isPageant ? "block" : "none";
        };
    })
    .catch(error => {
        console.error('Error fetching competitions:', error);
    });

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
                alert('Participant added successfully!');
                showViewParticipants();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding participant');
        });
    };
}

// Original functions with enhancements...
// [Continue with original functions but enhanced for new features]

// Enhanced Edit Competition
function editCompetition(id) {
    fetch(`http://localhost:3002/competition/${id}`)
    .then(response => response.json())
    .then(competition => {
        document.getElementById("content").innerHTML = `
            <h2>✏️ Edit Competition</h2>
            <form id="editCompetitionForm" style="max-width: 700px;">
                <input type="hidden" id="competition_id" value="${competition.competition_id}">
                
                <label for="competition_name">Competition Name:</label>
                <input type="text" id="competition_name" name="competition_name" value="${competition.competition_name}" required>
                
                <label for="event_type_id">Event Type:</label>
                <select id="event_type_id" name="event_type_id" required>
                    <option value="">Select Event Type</option>
                </select>
                
                <label for="competition_date">Competition Date:</label>
                <input type="date" id="competition_date" name="competition_date" value="${competition.competition_date}" required>
                
                <label for="event_description">Event Description:</label>
                <textarea id="event_description" name="event_description" rows="3">${competition.event_description || ''}</textarea>
                
                <div style="margin-top: 30px;">
                    <input type="submit" value="Update Competition" style="padding: 15px 30px; font-size: 16px;">
                    <button type="button" onclick="showViewCompetitions()" class="secondary" style="margin-left: 10px;">Cancel</button>
                </div>
            </form>
        `;

        // Load event types and set current value
        fetch('http://localhost:3002/event-types')
        .then(response => response.json())
        .then(eventTypes => {
            const eventTypeSelect = document.getElementById("event_type_id");
            eventTypes.forEach(eventType => {
                const option = document.createElement("option");
                option.value = eventType.event_type_id;
                option.textContent = `${eventType.type_name} ${eventType.is_pageant ? '👑' : '🎪'}`;
                if (competition.event_type_id == eventType.event_type_id) {
                    option.selected = true;
                }
                eventTypeSelect.appendChild(option);
            });
        });

        document.getElementById("editCompetitionForm").onsubmit = function(event) {
            event.preventDefault();
            
            const competitionData = {
                competition_name: document.getElementById("competition_name").value,
                event_type_id: document.getElementById("event_type_id").value,
                competition_date: document.getElementById("competition_date").value,
                event_description: document.getElementById("event_description").value
            };

            fetch(`http://localhost:3002/update-competition/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(competitionData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Competition updated successfully!');
                    showViewCompetitions();
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error updating competition');
            });
        };
    })
    .catch(error => {
        console.error('Error fetching competition:', error);
        alert('Error loading competition data');
    });
}

// Delete Competition
function deleteCompetition(id) {
    if (confirm('Are you sure you want to delete this competition? This will also delete all participants, judges, and scores associated with it.')) {
        fetch(`http://localhost:3002/delete-competition/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Competition deleted successfully!');
                showViewCompetitions();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting competition');
        });
    }
}

// Enhanced View Participants with Pageant Support
function showViewParticipants() {
    document.getElementById("content").innerHTML = `
        <h2>👥 Manage Participants</h2>
        
        <div style="margin-bottom: 30px;">
            <button onclick="showAddParticipantForm()" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                ➕ Add New Participant
            </button>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label for="filterCompetition" style="font-weight: 600; color: #800020;">Filter by Competition:</label>
            <select id="filterCompetition" onchange="filterParticipants()" style="margin-left: 10px; padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                <option value="">All Competitions</option>
            </select>
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

function loadParticipants(competitionId = '') {
    const url = competitionId ? 
        `http://localhost:3002/participants/${competitionId}` : 
        'http://localhost:3002/participants';

    fetch(url)
    .then(response => response.json())
    .then(participants => {
        let participantsHtml = '';
        
        if (participants.length === 0) {
            participantsHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
                    <h3>No Participants Yet</h3>
                    <p>Add your first participant to get started!</p>
                    <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                </div>
            `;
        } else {
            participantsHtml = '<div style="display: grid; gap: 20px;">';
            
            participants.forEach(participant => {
                const statusColor = participant.registration_fee === 'paid' ? '#28a745' : 
                                   participant.registration_fee === 'pending' ? '#ffc107' : '#17a2b8';
                
                participantsHtml += `
                    <div class="dashboard-card" style="text-align: left;">
                        <div style="display: flex; justify-content: between; align-items: start;">
                            <div style="flex: 1;">
                                <h3>${participant.participant_name} ${participant.is_pageant ? '👑' : ''}</h3>
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                                    <div>
                                        <p><strong>Age:</strong> ${participant.age}</p>
                                        <p><strong>Gender:</strong> ${participant.gender}</p>
                                        <p><strong>Email:</strong> ${participant.email}</p>
                                    </div>
                                    <div>
                                        <p><strong>Competition:</strong> ${participant.competition_name}</p>
                                        <p><strong>Event Type:</strong> ${participant.type_name} ${participant.is_pageant ? '👑' : '🎪'}</p>
                                        <p><strong>Performance:</strong> ${participant.performance_title || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p><strong>School/Org:</strong> ${participant.school_organization || 'N/A'}</p>
                                        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${participant.registration_fee.toUpperCase()}</span></p>
                                        ${participant.is_pageant && participant.height ? `<p><strong>Height:</strong> ${participant.height}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <button onclick="viewParticipantDetails(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ View Details</button>
                            <button onclick="editParticipant(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">✏️ Edit</button>
                            <button onclick="deleteParticipant(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Delete</button>
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
    loadParticipants(competitionId);
}

// Enhanced View Participant Details
function viewParticipantDetails(id) {
    fetch(`http://localhost:3002/participant/${id}`)
    .then(response => response.json())
    .then(participant => {
        const statusColor = participant.registration_fee === 'paid' ? '#28a745' : 
                           participant.registration_fee === 'pending' ? '#ffc107' : '#17a2b8';
        
        let detailsHtml = `
            <h2>👁️ Participant Details</h2>
            <div class="dashboard-card" style="text-align: left; max-width: 800px; margin: 0 auto;">
                <h3>${participant.participant_name} ${participant.is_pageant ? '👑' : ''}</h3>
                
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
                        <p><strong>Event Type:</strong> ${participant.type_name} ${participant.is_pageant ? '👑' : '🎪'}</p>
                        <p><strong>Registration Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${participant.registration_fee.toUpperCase()}</span></p>
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
            </div>
        `;
        
        document.getElementById("content").innerHTML = detailsHtml;
    })
    .catch(error => {
        console.error('Error fetching participant details:', error);
        alert('Error loading participant details');
    });
}

// Show Scoring Results
function showScoringResults() {
    document.getElementById("content").innerHTML = `
        <h2>📊 Scoring Results & Analytics</h2>
        
        <div style="margin-bottom: 30px;">
            <label for="resultsCompetition" style="font-weight: 600; color: #800020;">Select Competition:</label>
            <select id="resultsCompetition" onchange="loadScoringResults()" style="margin-left: 10px; padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
                <option value="">Select Competition to View Results</option>
            </select>
        </div>
        
        <div id="resultsContent">
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
                <h3>Select a Competition</h3>
                <p>Choose a competition from the dropdown above to view detailed scoring results and analytics.</p>
            </div>
        </div>
    `;

    // Load competitions for dropdown
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        const select = document.getElementById("resultsCompetition");
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

function loadScoringResults() {
    const competitionId = document.getElementById("resultsCompetition").value;
    if (!competitionId) {
        document.getElementById("resultsContent").innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
                <h3>Select a Competition</h3>
                <p>Choose a competition from the dropdown above to view detailed scoring results.</p>
            </div>
        `;
        return;
    }

    document.getElementById("resultsContent").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 24px;">⏳</div>
            <p>Loading scoring results...</p>
        </div>
    `;

    // Load overall scores
    fetch(`http://localhost:3002/overall-scores/${competitionId}`)
    .then(response => response.json())
    .then(scores => {
        if (scores.length === 0) {
            document.getElementById("resultsContent").innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
                    <h3>No Scores Yet</h3>
                    <p>No scores have been submitted for this competition yet. Judges need to complete their scoring first.</p>
                </div>
            `;
            return;
        }

        // Group scores by participant
        const participantScores = {};
        scores.forEach(score => {
            if (!participantScores[score.participant_id]) {
                participantScores[score.participant_id] = {
                    participant_name: score.participant_name,
                    performance_title: score.performance_title,
                    scores: [],
                    average: 0,
                    total_scores: 0
                };
            }
            participantScores[score.participant_id].scores.push({
                judge_name: score.judge_name,
                total_score: score.total_score
            });
        });

        // Calculate averages and sort
        const sortedParticipants = Object.values(participantScores).map(participant => {
            participant.total_scores = participant.scores.length;
            participant.average = participant.scores.reduce((sum, score) => sum + score.total_score, 0) / participant.scores.length;
            return participant;
        }).sort((a, b) => b.average - a.average);

        let resultsHtml = `
            <div class="dashboard-card" style="text-align: left;">
                <h3>🏆 Competition Rankings</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; margin-top: 15px;">
                        <tr>
                            <th>Rank</th>
                            <th>Participant</th>
                            <th>Performance</th>
                            <th>Average Score</th>
                            <th>Judges Scored</th>
                            <th>Details</th>
                        </tr>
        `;

        sortedParticipants.forEach((participant, index) => {
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666';
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            
            resultsHtml += `
                <tr>
                    <td style="text-align: center; font-size: 18px; color: ${rankColor}; font-weight: bold;">
                        ${rankIcon}
                    </td>
                    <td><strong>${participant.participant_name}</strong></td>
                    <td>${participant.performance_title || 'N/A'}</td>
                    <td style="text-align: center; font-weight: bold; color: #800020;">
                        ${participant.average.toFixed(2)}
                    </td>
                    <td style="text-align: center;">${participant.total_scores}</td>
                    <td style="text-align: center;">
                        <button onclick="viewDetailedScores(${Object.keys(participantScores).find(id => participantScores[id] === participant)}, ${competitionId})" 
                                style="padding: 4px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        });

        resultsHtml += `
                    </table>
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="exportResults(${competitionId})" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    📊 Export Results
                </button>
            </div>
        `;

        document.getElementById("resultsContent").innerHTML = resultsHtml;
    })
    .catch(error => {
        console.error('Error loading scoring results:', error);
        document.getElementById("resultsContent").innerHTML = '<p class="alert alert-error">Error loading scoring results.</p>';
    });
}

// Placeholder functions for remaining features
function deleteEventType(id) {
    if (confirm('Are you sure you want to delete this event type? This may affect existing competitions.')) {
        alert('Feature coming soon: Delete Event Type');
    }
}

function editEventType(id) {
    alert('Feature coming soon: Edit Event Type');
}

function showCreateCriteriaTemplateForm() {
    alert('Feature coming soon: Create Criteria Template');
}

function viewTemplateCriteria(id) {
    alert('Feature coming soon: View Template Criteria');
}

function editCriteriaTemplate(id) {
    alert('Feature coming soon: Edit Criteria Template');
}

function deleteCriteriaTemplate(id) {
    alert('Feature coming soon: Delete Criteria Template');
}

function loadTemplateForm(competitionId) {
    alert('Feature coming soon: Load from Template');
}

function viewCompetitionDetails(id) {
    alert('Feature coming soon: View Competition Details');
}

function editParticipant(id) {
    alert('Feature coming soon: Edit Participant (enhanced with pageant fields)');
}

function deleteParticipant(id) {
    if (confirm('Are you sure you want to delete this participant?')) {
        fetch(`http://localhost:3002/delete-participant/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Participant deleted successfully!');
                showViewParticipants();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting participant');
        });
    }
}

function viewDetailedScores(participantId, competitionId) {
    alert('Feature coming soon: View Detailed Scores by Criteria');
}

function exportResults(competitionId) {
    alert('Feature coming soon: Export Results to PDF/Excel');
}

// Enhanced Judge Management
function showAddJudgeForm() {
    document.getElementById("content").innerHTML = `
        <h2>⚖️ Add New Judge</h2>
        <form id="addJudgeForm" style="max-width: 700px;">
            <label for="judge_name">Judge Name:</label>
            <input type="text" id="judge_name" name="judge_name" required>
            
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
            
            <label for="phone">Phone Number:</label>
            <input type="tel" id="phone" name="phone">
            
            <label for="expertise">Area of Expertise:</label>
            <textarea id="expertise" name="expertise" rows="2" placeholder="Describe judge's areas of expertise..." required></textarea>
            
            <label for="experience_years">Years of Experience:</label>
            <input type="number" id="experience_years" name="experience_years" min="0" required>
            
            <label for="credentials">Credentials/Qualifications:</label>
            <textarea id="credentials" name="credentials" rows="4" placeholder="Enter judge's credentials, certifications, and qualifications..."></textarea>
            
            <label for="competition">Assign to Competition:</label>
            <select id="competition" name="competition">
                <option value="">Select Competition (Optional)</option>
            </select>
            
            <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong>🔐 Login Credentials:</strong>
                <p>A username and password will be automatically generated for the judge and displayed after creation.</p>
            </div>
            
            <input type="submit" value="Add Judge">
            <button type="button" onclick="showViewJudges()" class="secondary">Cancel</button>
        </form>
    `;

    // Populate competition dropdown
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        const competitionSelect = document.getElementById("competition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.textContent = `${competition.competition_name} (${competition.type_name}) ${competition.is_pageant ? '👑' : '🎪'}`;
            competitionSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching competitions:', error);
    });

    document.getElementById("addJudgeForm").onsubmit = function(event) {
        event.preventDefault();

        const judgeData = {
            judge_name: document.getElementById("judge_name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            expertise: document.getElementById("expertise").value,
            experience_years: document.getElementById("experience_years").value,
            credentials: document.getElementById("credentials").value,
            competition_id: document.getElementById("competition").value || null
        };

        fetch('http://localhost:3002/add-judge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(judgeData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Judge added successfully!\n\nLogin Credentials:\nUsername: ${data.credentials.username}\nPassword: ${data.credentials.password}\n\nPlease provide these credentials to the judge.`);
                showViewJudges();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding judge');
        });
    };
}

function showViewJudges() {
    document.getElementById("content").innerHTML = `
        <h2>⚖️ Manage Judges</h2>
        <div style="margin-bottom: 30px;">
            <button onclick="showAddJudgeForm()" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                ➕ Add New Judge
            </button>
        </div>
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
                    <h3>No Judges Yet</h3>
                    <p>Add your first judge to get started!</p>
                    <button onclick="showAddJudgeForm()" class="card-button">Add Judge</button>
                </div>
            `;
        } else {
            judgesHtml = '<div style="display: grid; gap: 20px;">';
            
            judges.forEach(judge => {
                judgesHtml += `
                    <div class="dashboard-card" style="text-align: left;">
                        <h3>⚖️ ${judge.judge_name}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                            <div>
                                <p><strong>Email:</strong> ${judge.email}</p>
                                <p><strong>Phone:</strong> ${judge.phone || 'Not provided'}</p>
                                <p><strong>Username<p><strong>Username:</strong> ${judge.username || 'Not set'}</p>
                            </div>
                            <div>
                                <p><strong>Experience:</strong> ${judge.experience_years} years</p>
                                <p><strong>Competition:</strong> ${judge.competition_name || 'Not assigned'}</p>
                                <p><strong>Event Type:</strong> ${judge.type_name ? `${judge.type_name} ${judge.is_pageant ? '👑' : '🎪'}` : 'N/A'}</p>
                            </div>
                            <div>
                                <p><strong>Expertise:</strong></p>
                                <div style="background: #f9f9f9; padding: 8px; border-radius: 4px; font-size: 14px;">
                                    ${judge.expertise || 'Not specified'}
                                </div>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <button onclick="viewJudgeDetails(${judge.judge_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ View Details</button>
                            <button onclick="editJudge(${judge.judge_id})" style="margin: 2px; padding: 8px 16px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">✏️ Edit</button>
                            <button onclick="deleteJudge(${judge.judge_id})" style="margin: 2px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Delete</button>
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
                        <p><strong>Event Type:</strong> ${judge.type_name ? `${judge.type_name} ${judge.is_pageant ? '👑' : '🎪'}` : 'N/A'}</p>
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
                <button onclick="showViewJudges()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">← Back to Judges</button>
                <button onclick="editJudge(${judge.judge_id})" class="card-button">✏️ Edit Judge</button>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error fetching judge details:', error);
        alert('Error loading judge details');
    });
}

// Edit Judge
function editJudge(id) {
    fetch(`http://localhost:3002/judge/${id}`)
    .then(response => response.json())
    .then(judge => {
        document.getElementById("content").innerHTML = `
            <h2>✏️ Edit Judge</h2>
            <form id="editJudgeForm" style="max-width: 700px;">
                <input type="hidden" id="judge_id" value="${judge.judge_id}">
                
                <label for="judge_name">Judge Name:</label>
                <input type="text" id="judge_name" name="judge_name" value="${judge.judge_name}" required>
                
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="${judge.email}" required>
                
                <label for="phone">Phone Number:</label>
                <input type="tel" id="phone" name="phone" value="${judge.phone || ''}">
                
                <label for="expertise">Area of Expertise:</label>
                <textarea id="expertise" name="expertise" rows="2" required>${judge.expertise || ''}</textarea>
                
                <label for="experience_years">Years of Experience:</label>
                <input type="number" id="experience_years" name="experience_years" value="${judge.experience_years}" min="0" required>
                
                <label for="credentials">Credentials/Qualifications:</label>
                <textarea id="credentials" name="credentials" rows="4">${judge.credentials || ''}</textarea>
                
                <label for="competition">Assign to Competition:</label>
                <select id="competition" name="competition">
                    <option value="">Select Competition (Optional)</option>
                </select>
                
                <div style="margin-top: 30px;">
                    <input type="submit" value="Update Judge" style="padding: 15px 30px; font-size: 16px;">
                    <button type="button" onclick="showViewJudges()" class="secondary" style="margin-left: 10px;">Cancel</button>
                </div>
            </form>
        `;

        // Populate competition dropdown
        fetch('http://localhost:3002/competitions')
        .then(response => response.json())
        .then(competitions => {
            const competitionSelect = document.getElementById("competition");
            competitions.forEach(competition => {
                const option = document.createElement("option");
                option.value = competition.competition_id;
                option.textContent = `${competition.competition_name} (${competition.type_name}) ${competition.is_pageant ? '👑' : '🎪'}`;
                if (judge.competition_id == competition.competition_id) {
                    option.selected = true;
                }
                competitionSelect.appendChild(option);
            });
        });

        document.getElementById("editJudgeForm").onsubmit = function(event) {
            event.preventDefault();
            
            const judgeData = {
                judge_name: document.getElementById("judge_name").value,
                email: document.getElementById("email").value,
                phone: document.getElementById("phone").value,
                expertise: document.getElementById("expertise").value,
                experience_years: document.getElementById("experience_years").value,
                credentials: document.getElementById("credentials").value,
                competition_id: document.getElementById("competition").value || null
            };

            fetch(`http://localhost:3002/update-judge/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(judgeData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Judge updated successfully!');
                    showViewJudges();
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error updating judge');
            });
        };
    })
    .catch(error => {
        console.error('Error fetching judge:', error);
        alert('Error loading judge data');
    });
}

// Delete Judge
function deleteJudge(id) {
    if (confirm('Are you sure you want to delete this judge? This will also remove their user account.')) {
        fetch(`http://localhost:3002/delete-judge/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Judge deleted successfully!');
                showViewJudges();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting judge');
        });
    }
}