// Enhanced Admin Dashboard JavaScript - Clean Professional Design

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
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        headerRight.innerHTML = `
            <div>Welcome, ${user.username}</div>
            <div style="font-size: 12px;">Role: Administrator</div>
            <button onclick="logout()" style="margin-top: 10px; padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; border-radius: 5px; cursor: pointer;">
                Logout
            </button>
        `;
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
        <h2>Judging System Dashboard</h2>
        
       
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;">
            <div class="dashboard-card">
                <h3>Event Types</h3>
                <p>Manage custom event categories</p>
                <button onclick="showEventTypes()" class="card-button">Manage Event Types</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Criteria Templates</h3>
                <p>Create reusable judging criteria</p>
                <button onclick="showCriteriaTemplates()" class="card-button">Manage Criteria</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Competitions</h3>
                <p>Create and manage competitions</p>
                <button onclick="showCreateCompetitionForm()" class="card-button">New Competition</button>
                <button onclick="showViewCompetitions()" class="card-button">Manage All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Judges</h3>
                <p>Manage judge profiles and assignments</p>
                <button onclick="showAddJudgeForm()" class="card-button">Add Judge</button>
                <button onclick="showViewJudges()" class="card-button">View All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Participants</h3>
                <p>Manage participant registrations</p>
                <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                <button onclick="showViewParticipants()" class="card-button">Manage All</button>
            </div>
            
            <div class="dashboard-card">
                <h3>Scoring & Results</h3>
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
        <h2>Event Types Management</h2>
        
        <div style="margin-bottom: 30px;">
            <button onclick="showCreateEventTypeForm()" class="card-button">
                Add New Event Type
            </button>
        </div>
        
        <div id="eventTypesList">
            <div class="loading">Loading event types...</div>
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
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
        `;
        
        eventTypes.forEach(eventType => {
            eventTypesHtml += `
                <tr>
                    <td><strong>${eventType.type_name}</strong></td>
                    <td>${eventType.description || 'No description'}</td>
                    <td>
                        <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; ${eventType.is_pageant ? 'background: #e91e63;' : 'background: #2196f3;'}">
                            ${eventType.is_pageant ? 'PAGEANT' : 'REGULAR'}
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
        <h2>Create New Event Type</h2>
        
        <form id="createEventTypeForm" style="max-width: 600px;">
            <label for="type_name">Event Type Name:</label>
            <input type="text" id="type_name" name="type_name" required placeholder="e.g., Beauty Pageant, Talent Show, etc.">
            
            <label for="description">Description:</label>
            <textarea id="description" name="description" rows="3" placeholder="Describe what this event type is about..."></textarea>
            
            <label for="is_pageant">Event Category:</label>
            <select id="is_pageant" name="is_pageant" required>
                <option value="0">Regular Event (Music, Dance, Art, etc.)</option>
                <option value="1">Beauty Pageant Event</option>
            </select>
            
            <div class="alert alert-info">
                <strong>Note:</strong>
                <ul style="margin-top: 10px;">
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
        <h2>Judging Criteria Templates</h2>
        
        <div style="margin-bottom: 30px;">
            <button onclick="showCreateCriteriaTemplateForm()" class="card-button">
                Create Criteria Template
            </button>
        </div>
        
        <div id="criteriaTemplatesList">
            <div class="loading">Loading criteria templates...</div>
        </div>
    `;

    // Load criteria templates
    fetch('http://localhost:3002/criteria-templates')
    .then(response => response.json())
    .then(templates => {
        let templatesHtml = `<div style="display: grid; gap: 20px;">`;
        
        templates.forEach(template => {
            templatesHtml += `
                <div class="dashboard-card" style="text-align: left;">
                    <h3>${template.template_name}</h3>
                    <p><strong>Event Type:</strong> ${template.type_name}</p>
                    <p>${template.description || 'No description'}</p>
                    <div style="margin-top: 15px;">
                        <button onclick="viewTemplateCriteria(${template.template_id})" class="card-button">View Criteria</button>
                        <button onclick="editCriteriaTemplate(${template.template_id})" style="background: #ffc107; color: #000;">Edit</button>
                        <button onclick="deleteCriteriaTemplate(${template.template_id})" style="background: #dc3545;">Delete</button>
                    </div>
                </div>
            `;
        });
        
        templatesHtml += '</div>';
        
        if (templates.length === 0) {
            templatesHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
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
        <h2>Create New Competition</h2>
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
            
            <div id="eventTypeInfo" class="alert alert-info" style="display: none;">
                <strong>Next Steps:</strong>
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
            option.textContent = `${eventType.type_name} ${eventType.is_pageant ? '(Pageant)' : '(Regular)'}`;
            eventTypeSelect.appendChild(option);
        });

        // Show info when event type is selected
        eventTypeSelect.onchange = function() {
            document.getElementById("eventTypeInfo").style.display = this.value ? "block" : "none";
        };
    });

 document.getElementById("competitionForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent default form submission

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
});

}

// Enhanced View Competitions with Criteria Management
function showViewCompetitions() {
    document.getElementById("content").innerHTML = `
        <h2>Manage Competitions</h2>
        <div style="margin-bottom: 20px;">
            <button onclick="showCreateCompetitionForm()" class="card-button">
                Add New Competition
            </button>
            ${competition.is_pageant ? 
    `<button onclick="setupFlexiblePageant(${competition.competition_id}, '${competition.competition_name}')" style="background: #e91e63; color: white; margin: 2px; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Setup Pageant Days</button>` : 
    ''
}
        </div>
        <div id="competitionsList">
            <div class="loading">Loading competitions...</div>
        </div>
    `;

    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        let competitionsHtml = `<div style="display: grid; gap: 20px;">`;
        
        competitions.forEach(competition => {
            const categoryBadge = competition.is_pageant ? 
                '<span style="background: #e91e63; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">PAGEANT</span>' :
                '<span style="background: #2196f3; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">REGULAR</span>';
            
            competitionsHtml += `
                <div class="dashboard-card" style="text-align: left;">
                    <h3>${competition.competition_name} ${categoryBadge}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
                        <div>
                            <p><strong>Event Type:</strong> ${competition.type_name}</p>
                            <p><strong>Date:</strong> ${competition.competition_date}</p>
                            <p><strong>Participants:</strong> ${competition.participant_count || 0}</p>
                        </div>
                        <div>
                            <p><strong>Judges:</strong> ${competition.judge_count || 0}</p>
                            <p><strong>Description:</strong> ${competition.event_description || 'No description'}</p>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                       <button onclick="manageCriteria(${competition.competition_id}, '${competition.competition_name}')" class="card-button">Manage Criteria</button>
${competition.is_pageant ? 
    `<button onclick="setupFlexiblePageant(${competition.competition_id}, '${competition.competition_name}')" style="background: #e91e63; color: white;">Setup Pageant Days</button>` : 
    ''
}
                        <button onclick="viewCompetitionDetails(${competition.competition_id})" style="background: #17a2b8;">View Details</button>
                        <button onclick="editCompetition(${competition.competition_id})" style="background: #ffc107; color: #000;">Edit</button>
                        <button onclick="deleteCompetition(${competition.competition_id})" style="background: #dc3545;">Delete</button>
                    </div>
                </div>
            `;
        });
        
        competitionsHtml += '</div>';
        
        if (competitions.length === 0) {
            competitionsHtml = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
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
        <h2>Manage Judging Criteria</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
       
        
        <div style="margin-bottom: 20px;">
            <button onclick="addCriterion()" class="card-button">Add Criterion</button>
            <button onclick="loadTemplateForm(${competitionId})" style="background: #6f42c1; color: white; margin-left: 10px;">Load from Template</button>
        </div>
        
        <form id="criteriaForm">
            <input type="hidden" id="competition_id" value="${competitionId}">
            
            <div id="criteriaContainer">
                <div class="loading">Loading current criteria...</div>
            </div>
            
            <div style="margin-top: 30px;">
                <button type="button" onclick="saveCriteria()" class="card-button" style="font-size: 16px; padding: 12px 30px;">
                    Save All Criteria
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
            <div class="criterion-item">
                <div style="display: grid; grid-template-columns: auto 1fr auto auto; gap: 15px; align-items: center;">
                    <div style="font-weight: bold; color: #800020;">#${criterion.order_number || index + 1}</div>
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
                        <button type="button" onclick="removeCriterion(this)" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Remove</button>
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
    newCriterion.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr auto auto; gap: 15px; align-items: center;">
            <div style="font-weight: bold; color: #800020;">#${currentCriteria + 1}</div>
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
                <button type="button" onclick="removeCriterion(this)" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Remove</button>
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
       <h2>Add New Participant</h2>
       
       <form id="addParticipantForm" style="max-width: 700px;">
           <div class="form-section">
               <h3>Basic Information</h3>
               
               <label for="participant_name">Participant Name:</label>
               <input type="text" id="participant_name" name="participant_name" required>
               
               <label for="email">Email Address:</label>
               <input type="email" id="email" name="email" required>
               
               <label for="phone">Phone Number:</label>
               <input type="tel" id="phone" name="phone">
               
               <div class="grid-3">
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
                      <label for="status">Participant Status:</label>
<select id="status" name="status" required>
    <option value="pending">Pending</option>
    <option value="ongoing">Ongoing</option>
    <option value="done">Done</option>
</select>
                   </div>
               </div>
               
               <label for="school_organization">School/Organization:</label>
               <input type="text" id="school_organization" name="school_organization">
           </div>
           
           <div class="form-section">
               <h3>Competition Details</h3>
               
               <label for="competition">Competition:</label>
               <select id="competition" name="competition" required>
                   <option value="">Select Competition</option>
               </select>
               
               <label for="performance_title">Performance/Entry Title:</label>
               <input type="text" id="performance_title" name="performance_title">
               
               <label for="performance_description">Performance Description:</label>
               <textarea id="performance_description" name="performance_description" rows="3" placeholder="Describe the performance, talent, or entry..."></textarea>
           </div>
           
           <div id="pageantFields" style="display: none;">
               <div class="form-section">
                   <h3 style="color: #e91e63;">Pageant Specific Information</h3>
                   
                   <div class="grid-2">
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
           option.textContent = `${competition.competition_name} (${competition.type_name})`;
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
           status: document.getElementById("status").value,
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

// Enhanced View Participants with Pageant Support
function showViewParticipants() {
   document.getElementById("content").innerHTML = `
       <h2>Manage Participants</h2>
       
       <div style="margin-bottom: 30px;">
           <button onclick="showAddParticipantForm()" class="card-button">
               Add New Participant
           </button>
       </div>
       
       <div style="margin-bottom: 20px;">
           <label for="filterCompetition" style="font-weight: 600; color: #800020;">Filter by Competition:</label>
           <select id="filterCompetition" onchange="filterParticipants()" style="margin-left: 10px; padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
               <option value="">All Competitions</option>
           </select>
       </div>
       
       <div id="participantsList">
           <div class="loading">Loading participants...</div>
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
           option.textContent = `${competition.competition_name}`;
           filterSelect.appendChild(option);
       });
   });

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
                   <h3>No Participants Yet</h3>
                   <p>Add your first participant to get started!</p>
                   <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
               </div>
           `;
       } else {
           participantsHtml = '<div style="display: grid; gap: 20px;">';
           
           participants.forEach(participant => {
             const statusColor = participant.status === 'done' ? '#28a745' : 
                   participant.status === 'ongoing' ? '#ffc107' : '#dc3545';
               
               participantsHtml += `
                   <div class="dashboard-card" style="text-align: left;">
                       <div style="display: flex; justify-content: between; align-items: start;">
                           <div style="flex: 1;">
                               <h3>${participant.participant_name}</h3>
                               <div class="grid-3" style="margin: 15px 0;">
                                   <div>
                                       <p><strong>Age:</strong> ${participant.age}</p>
                                       <p><strong>Gender:</strong> ${participant.gender}</p>
                                       <p><strong>Email:</strong> ${participant.email}</p>
                                   </div>
                                   <div>
                                       <p><strong>Competition:</strong> ${participant.competition_name}</p>
                                       <p><strong>Event Type:</strong> ${participant.type_name}</p>
                                       <p><strong>Performance:</strong> ${participant.performance_title || 'N/A'}</p>
                                   </div>
                                   <div>
                                       <p><strong>School/Org:</strong> ${participant.school_organization || 'N/A'}</p>
                                       <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${participant.status.toUpperCase()}</span></p>
                                       ${participant.is_pageant && participant.height ? `<p><strong>Height:</strong> ${participant.height}</p>` : ''}
                                   </div>
                               </div>
                           </div>
                       </div>
                       <div style="margin-top: 20px;">
                           <button onclick="viewParticipantDetails(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">View Details</button>
                           <button onclick="editParticipant(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
                           <button onclick="deleteParticipant(${participant.participant_id})" style="margin: 2px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
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

// Judge Management Functions
function showAddJudgeForm() {
   document.getElementById("content").innerHTML = `
       <h2>Add New Judge</h2>
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
           
           <div class="alert alert-info">
               <strong>Login Credentials:</strong>
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
           option.textContent = `${competition.competition_name} (${competition.type_name})`;
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
       <h2>Manage Judges</h2>
       <div style="margin-bottom: 30px;">
           <button onclick="showAddJudgeForm()" class="card-button">
               Add New Judge
           </button>
       </div>
       <div id="judgesList">
           <div class="loading">Loading judges...</div>
       </div>
   `;

   fetch('http://localhost:3002/judges')
   .then(response => response.json())
   .then(judges => {
       let judgesHtml = '';
       
       if (judges.length === 0) {
           judgesHtml = `
               <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
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
                       <h3>${judge.judge_name}</h3>
                       <div class="grid-3" style="margin: 15px 0;">
                           <div>
                               <p><strong>Email:</strong> ${judge.email}</p>
                               <p><strong>Phone:</strong> ${judge.phone || 'Not provided'}</p>
                               <p><strong>Username:</strong> ${judge.username || 'Not set'}</p>
                           </div>
                           <div>
                               <p><strong>Experience:</strong> ${judge.experience_years} years</p>
                               <p><strong>Competition:</strong> ${judge.competition_name || 'Not assigned'}</p>
                               <p><strong>Event Type:</strong> ${judge.type_name || 'N/A'}</p>
                           </div>
                           <div>
                               <p><strong>Expertise:</strong></p>
                               <div style="background: #f9f9f9; padding: 8px; border-radius: 4px; font-size: 14px;">
                                   ${judge.expertise || 'Not specified'}
                               </div>
                           </div>
                       </div>
                       <div style="margin-top: 20px;">
                           <button onclick="viewJudgeDetails(${judge.judge_id})" style="margin: 2px; padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">View Details</button>
                           <button onclick="editJudge(${judge.judge_id})" style="margin: 2px; padding: 8px 16px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
                           <button onclick="deleteJudge(${judge.judge_id})" style="margin: 2px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
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

// Show Scoring Results
function showScoringResults() {
   document.getElementById("content").innerHTML = `
       <h2>Scoring Results & Analytics</h2>
       
       <div style="margin-bottom: 30px;">
           <label for="resultsCompetition" style="font-weight: 600; color: #800020;">Select Competition:</label>
           <select id="resultsCompetition" onchange="loadScoringResults()" style="margin-left: 10px; padding: 8px 12px; border: 2px solid #ddd; border-radius: 5px;">
               <option value="">Select Competition to View Results</option>
           </select>
       </div>
       
       <div id="resultsContent">
           <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
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
           option.textContent = `${competition.competition_name}`;
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
               <h3>Select a Competition</h3>
               <p>Choose a competition from the dropdown above to view detailed scoring results.</p>
           </div>
       `;
       return;
   }

   document.getElementById("resultsContent").innerHTML = `
       <div class="loading">Loading scoring results...</div>
   `;

   // Load overall scores
   fetch(`http://localhost:3002/overall-scores/${competitionId}`)
   .then(response => response.json())
   .then(scores => {
       if (scores.length === 0) {
           document.getElementById("resultsContent").innerHTML = `
               <div class="alert alert-warning">
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
               <h3>Competition Rankings</h3>
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
           const rankText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;
           
           resultsHtml += `
               <tr>
                   <td style="text-align: center; font-size: 18px; color: ${rankColor}; font-weight: bold;">
                       ${rankText}
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
               <button onclick="exportResults(${competitionId})" class="card-button">
                   Export Results
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

function viewParticipantDetails(id) {
   alert('Feature coming soon: View Participant Details');
}

function editParticipant(id) {
   alert('Feature coming soon: Edit Participant');
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

function viewJudgeDetails(id) {
   alert('Feature coming soon: View Judge Details');
}

function editJudge(id) {
   alert('Feature coming soon: Edit Judge');
}

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

function editCompetition(id) {
   alert('Feature coming soon: Edit Competition');
}

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

function viewDetailedScores(participantId, competitionId) {
   alert('Feature coming soon: View Detailed Scores by Criteria');
}

function exportResults(competitionId) {
   alert('Feature coming soon: Export Results to PDF/Excel');
}
// Add this function to your admin app.js for managing pageant segments
function managePageantSegments(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>Manage Pageant Segments</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div class="alert alert-info">
            <strong>Multi-Day Pageant Support:</strong>
            <ul style="margin-top: 10px;">
                <li>Create separate segments for each event (Evening Gown, Talent, Q&A, etc.)</li>
                <li>Set different dates and times for each segment</li>
                <li>Judges can score each segment separately</li>
                <li>Final scores combine all segments</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="addPageantSegment(${competitionId})" class="card-button">Add Segment</button>
        </div>
        
        <div id="segmentsList">
            <div class="loading">Loading pageant segments...</div>
        </div>
    `;

    loadPageantSegments(competitionId);
}

function addPageantSegment(competitionId) {
    const segmentHtml = `
        <div class="dashboard-card" style="text-align: left; margin-bottom: 15px;">
            <h4>Add New Segment</h4>
            <div class="grid-2">
                <div>
                    <label>Segment Name:</label>
                    <input type="text" id="new_segment_name" placeholder="e.g., Evening Gown, Talent Show, Q&A">
                </div>
                <div>
                    <label>Date:</label>
                    <input type="date" id="new_segment_date">
                </div>
            </div>
            <div class="grid-2">
                <div>
                    <label>Time:</label>
                    <input type="time" id="new_segment_time">
                </div>
                <div>
                    <label>Order:</label>
                    <input type="number" id="new_segment_order" value="1" min="1">
                </div>
            </div>
            <label>Description:</label>
            <textarea id="new_segment_description" rows="2"></textarea>
            
            <div style="margin-top: 15px;">
                <button onclick="savePageantSegment(${competitionId})" class="card-button">Save Segment</button>
                <button onclick="managePageantSegments(${competitionId}, 'Competition')" class="secondary">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById("segmentsList").insertAdjacentHTML('afterbegin', segmentHtml);
}
// Flexible Pageant Setup - Admin Controls Everything
function setupFlexiblePageant(competitionId, competitionName) {
    document.getElementById("content").innerHTML = `
        <h2>Setup Multi-Day Pageant</h2>
        <h3 style="color: #800020;">${competitionName}</h3>
        
        <div class="alert alert-info">
            <strong>You Control Everything:</strong>
            <ul style="margin-top: 10px;">
                <li>Decide how many days (2, 3, 4, or more)</li>
                <li>Choose what happens each day</li>
                <li>Set which criteria apply to each segment</li>
                <li>Set dates and times for each day</li>
            </ul>
        </div>
        
        <form id="pageantSetupForm" style="max-width: 800px;">
            <div class="form-section">
                <h3>Basic Pageant Setup</h3>
                
                <div class="grid-2">
                    <div>
                        <label for="total_days">Total Number of Days:</label>
                        <select id="total_days" onchange="updateDayInputs()" required>
                            <option value="">Select Days</option>
                            <option value="2">2 Days</option>
                            <option value="3">3 Days</option>
                            <option value="4">4 Days</option>
                            <option value="5">5 Days</option>
                        </select>
                    </div>
                    <div>
                        <label for="start_date">Start Date:</label>
                        <input type="date" id="start_date" required>
                    </div>
                </div>
            </div>
            
            <div id="dayInputs" style="display: none;">
                <!-- Day inputs will be generated here -->
            </div>
            
            <div style="margin-top: 30px; display: none;" id="submitSection">
                <button type="submit" class="card-button" style="font-size: 16px; padding: 12px 30px;">
                    Create Pageant Schedule
                </button>
                <button type="button" onclick="showViewCompetitions()" class="secondary">Cancel</button>
            </div>
        </form>
    `;

    // Set default start date to competition date
    fetch(`http://localhost:3002/competition/${competitionId}`)
    .then(response => response.json())
    .then(competition => {
        document.getElementById('start_date').value = competition.competition_date;
    });

    window.updateDayInputs = function() {
        const totalDays = parseInt(document.getElementById('total_days').value);
        const dayInputsDiv = document.getElementById('dayInputs');
        const submitSection = document.getElementById('submitSection');
        
        if (!totalDays) {
            dayInputsDiv.style.display = 'none';
            submitSection.style.display = 'none';
            return;
        }

        let dayInputsHtml = '<div class="form-section"><h3>Setup Each Day</h3>';
        
        for (let day = 1; day <= totalDays; day++) {
            dayInputsHtml += `
                <div class="dashboard-card" style="text-align: left; margin-bottom: 20px;">
                    <h4>Day ${day} Setup</h4>
                    
                    <div class="grid-2">
                        <div>
                            <label>Day ${day} Date:</label>
                            <input type="date" id="day_${day}_date" required>
                        </div>
                        <div>
                            <label>Start Time:</label>
                            <input type="time" id="day_${day}_time" value="18:00">
                        </div>
                    </div>
                    
                    <label>Day ${day} Description:</label>
                    <input type="text" id="day_${day}_description" placeholder="e.g., Talent & Evening Gown Night" required>
                    
                    <label>Segments for Day ${day}:</label>
                    <div id="day_${day}_segments">
                        <div class="segment-input" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <div class="grid-2">
                                <div>
                                    <label>Segment Name:</label>
                                    <select class="segment-select" data-day="${day}" data-segment="1">
                                        <option value="">Choose Segment</option>
                                        <option value="Talent Competition">Talent Competition</option>
                                        <option value="Long Gown">Long Gown</option>
                                        <option value="Evening Gown">Evening Gown</option>
                                        <option value="Swimsuit">Swimsuit</option>
                                        <option value="Uniform">Uniform/Casual Wear</option>
                                        <option value="Grand Gown">Grand Gown</option>
                                        <option value="Question & Answer">Question & Answer</option>
                                        <option value="Interview">Interview</option>
                                        <option value="Production Number">Production Number</option>
                                        <option value="custom">Custom (Type Below)</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Custom Name (if selected custom):</label>
                                    <input type="text" class="custom-segment-name" placeholder="Enter custom segment name">
                                </div>
                            </div>
                            
                            <label>Segment Description:</label>
                            <textarea class="segment-description" rows="2" placeholder="Describe what happens in this segment..."></textarea>
                            
                            <div style="margin-top: 10px;">
                                <button type="button" onclick="removeSegment(this)" style="background: #dc3545; color: white; padding: 6px 12px; border: none; border-radius: 4px;">Remove Segment</button>
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" onclick="addSegmentToDay(${day})" style="background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 4px;">
                        Add Another Segment to Day ${day}
                    </button>
                </div>
            `;
        }
        
        dayInputsHtml += '</div>';
        dayInputsDiv.innerHTML = dayInputsHtml;
        dayInputsDiv.style.display = 'block';
        submitSection.style.display = 'block';
        
        // Auto-fill dates
        const startDate = new Date(document.getElementById('start_date').value);
        for (let day = 1; day <= totalDays; day++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + (day - 1));
            document.getElementById(`day_${day}_date`).value = dayDate.toISOString().split('T')[0];
        }
    };

    window.addSegmentToDay = function(day) {
        const segmentsDiv = document.getElementById(`day_${day}_segments`);
        const segmentCount = segmentsDiv.children.length + 1;
        
        const newSegment = document.createElement('div');
        newSegment.className = 'segment-input';
        newSegment.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;';
        newSegment.innerHTML = `
            <div class="grid-2">
                <div>
                    <label>Segment Name:</label>
                    <select class="segment-select" data-day="${day}" data-segment="${segmentCount}">
                        <option value="">Choose Segment</option>
                        <option value="Talent Competition">Talent Competition</option>
                        <option value="Long Gown">Long Gown</option>
                        <option value="Evening Gown">Evening Gown</option>
                        <option value="Swimsuit">Swimsuit</option>
                        <option value="Uniform">Uniform/Casual Wear</option>
                        <option value="Grand Gown">Grand Gown</option>
                        <option value="Question & Answer">Question & Answer</option>
                        <option value="Interview">Interview</option>
                        <option value="Production Number">Production Number</option>
                        <option value="custom">Custom (Type Below)</option>
                    </select>
                </div>
                <div>
                    <label>Custom Name (if selected custom):</label>
                    <input type="text" class="custom-segment-name" placeholder="Enter custom segment name">
                </div>
            </div>
            
            <label>Segment Description:</label>
            <textarea class="segment-description" rows="2" placeholder="Describe what happens in this segment..."></textarea>
            
            <div style="margin-top: 10px;">
                <button type="button" onclick="removeSegment(this)" style="background: #dc3545; color: white; padding: 6px 12px; border: none; border-radius: 4px;">Remove Segment</button>
            </div>
        `;
        
        segmentsDiv.appendChild(newSegment);
    };

    window.removeSegment = function(button) {
        button.closest('.segment-input').remove();
    };

    document.getElementById('pageantSetupForm').onsubmit = function(event) {
        event.preventDefault();
        
        const totalDays = parseInt(document.getElementById('total_days').value);
        const pageantData = {
            competition_id: competitionId,
            total_days: totalDays,
            days: []
        };
        
        // Collect data for each day
        for (let day = 1; day <= totalDays; day++) {
            const dayData = {
                day_number: day,
                date: document.getElementById(`day_${day}_date`).value,
                time: document.getElementById(`day_${day}_time`).value,
                description: document.getElementById(`day_${day}_description`).value,
                segments: []
            };
            
            // Collect segments for this day
            const segmentInputs = document.getElementById(`day_${day}_segments`).querySelectorAll('.segment-input');
            segmentInputs.forEach((segmentDiv, index) => {
                const segmentSelect = segmentDiv.querySelector('.segment-select');
                const customName = segmentDiv.querySelector('.custom-segment-name');
                const description = segmentDiv.querySelector('.segment-description');
                
                let segmentName = segmentSelect.value;
                if (segmentName === 'custom' && customName.value.trim()) {
                    segmentName = customName.value.trim();
                }
                
                if (segmentName && segmentName !== 'custom') {
                    dayData.segments.push({
                        name: segmentName,
                        description: description.value,
                        order: index + 1
                    });
                }
            });
            
            pageantData.days.push(dayData);
        }
        
        // Save to server
        fetch('http://localhost:3002/create-flexible-pageant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pageantData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`${totalDays}-day pageant created successfully with ${data.total_segments} segments!`);
                showViewCompetitions();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating pageant setup');
        });
    };
}