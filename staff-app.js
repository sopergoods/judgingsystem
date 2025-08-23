// Staff Dashboard JavaScript

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

// Show Dashboard
function showDashboard() {
    document.getElementById("content").innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2>Welcome to the Staff Dashboard</h2>
            <p>Manage day-to-day operations and assist with participant registration.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 30px;">
                <div class="dashboard-card">
                    <h3>🏆 Competitions</h3>
                    <p>View active competitions and details</p>
                    <button onclick="showViewCompetitions()" class="card-button">View Competitions</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>👥 Participants</h3>
                    <p>Register and manage participants</p>
                    <button onclick="showAddParticipantForm()" class="card-button">Add Participant</button>
                    <button onclick="showViewParticipants()" class="card-button">Manage All</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>⚖️ Judges</h3>
                    <p>View judge assignments and details</p>
                    <button onclick="showViewJudges()" class="card-button">View Judges</button>
                </div>
                
                <div class="dashboard-card">
                    <h3>📊 Reports</h3>
                    <p>Generate participation and status reports</p>
                    <button onclick="showReports()" class="card-button">View Reports</button>
                </div>
            </div>
        </div>
    `;
}

// Show View Competitions (Read-only for staff)
function showViewCompetitions() {
    document.getElementById("content").innerHTML = `
        <h2>View Competitions</h2>
        <table id="competitionsTable">
            <tr>
                <th>Competition Name</th>
                <th>Category</th>
                <th>Date</th>
                <th>Participants</th>
                <th>Actions</th>
            </tr>
        </table>
    `;

    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(data => {
        let tableContent = `
            <tr>
                <th>Competition Name</th>
                <th>Category</th>
                <th>Date</th>
                <th>Participants</th>
                <th>Actions</th>
            </tr>
        `;
        
        data.forEach(competition => {
            // Count participants for this competition
            fetch(`http://localhost:3002/participants/${competition.competition_id}`)
            .then(response => response.json())
            .then(participants => {
                tableContent += `
                    <tr>
                        <td>${competition.competition_name}</td>
                        <td>${competition.category}</td>
                        <td>${competition.competition_date}</td>
                        <td>${participants.length} participants</td>
                        <td>
                            <button onclick="viewCompetitionDetails(${competition.competition_id})">View Details</button>
                        </td>
                    </tr>
                `;
                document.getElementById("competitionsTable").innerHTML = tableContent;
            })
            .catch(error => {
                console.error('Error fetching participants:', error);
                tableContent += `
                    <tr>
                        <td>${competition.competition_name}</td>
                        <td>${competition.category}</td>
                        <td>${competition.competition_date}</td>
                        <td>-</td>
                        <td>
                            <button onclick="viewCompetitionDetails(${competition.competition_id})">View Details</button>
                        </td>
                    </tr>
                `;
                document.getElementById("competitionsTable").innerHTML = tableContent;
            });
        });
    })
    .catch(error => {
        console.error('Error fetching competitions:', error);
        document.getElementById("content").innerHTML += '<p class="alert alert-error">Error loading competitions.</p>';
    });
}

// View Competition Details
function viewCompetitionDetails(competitionId) {
    Promise.all([
        fetch(`http://localhost:3002/competitions`).then(r => r.json()),
        fetch(`http://localhost:3002/participants/${competitionId}`).then(r => r.json())
    ])
    .then(([competitions, participants]) => {
        const competition = competitions.find(c => c.competition_id == competitionId);
        
        let participantsList = '';
        participants.forEach(participant => {
            participantsList += `
                <tr>
                    <td>${participant.participant_name}</td>
                    <td>${participant.age}</td>
                    <td>${participant.performance_title}</td>
                    <td class="status-${participant.registration_fee}">${participant.registration_fee.toUpperCase()}</td>
                </tr>
            `;
        });

        document.getElementById("content").innerHTML = `
            <h2>Competition Details</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3>${competition.competition_name}</h3>
                <p><strong>Category:</strong> ${competition.category}</p>
                <p><strong>Date:</strong> ${competition.competition_date}</p>
                <p><strong>Total Participants:</strong> ${participants.length}</p>
            </div>
            
            <h3>Participants</h3>
            <table>
                <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Performance Title</th>
                    <th>Registration Status</th>
                </tr>
                ${participantsList}
            </table>
            
            <br>
            <button onclick="showViewCompetitions()" class="secondary">Back to Competitions</button>
        `;
    })
    .catch(error => {
        console.error('Error fetching competition details:', error);
        alert('Error loading competition details');
    });
}

// Show Add Participant Form
function showAddParticipantForm() {
    document.getElementById("content").innerHTML = `
        <h2>Add Participant</h2>
        <form id="addParticipantForm">
            <label for="participant_name">Participant Name:</label>
            <input type="text" id="participant_name" name="participant_name" required>
            
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
            
            <label for="phone">Phone Number:</label>
            <input type="tel" id="phone" name="phone">
            
            <label for="age">Age:</label>
            <input type="number" id="age" name="age" min="1" max="120" required>
            
            <label for="gender">Gender:</label>
            <select id="gender" name="gender" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select>
            
            <label for="school_organization">School/Organization:</label>
            <input type="text" id="school_organization" name="school_organization">
            
            <label for="performance_title">Performance Title:</label>
            <input type="text" id="performance_title" name="performance_title" required>
            
            <label for="performance_description">Performance Description:</label>
            <textarea id="performance_description" name="performance_description" rows="4" placeholder="Describe the performance..."></textarea>
            
            <label for="competition">Competition:</label>
            <select id="competition" name="competition" required>
                <option value="">Select Competition</option>
            </select>
            
            <label for="registration_fee">Registration Fee Status:</label>
            <select id="registration_fee" name="registration_fee" required>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
            </select>
            
            <input type="submit" value="Add Participant">
            <button type="button" onclick="showViewParticipants()" class="secondary">Cancel</button>
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
            option.textContent = `${competition.competition_name} (${competition.category})`;
            competitionSelect.appendChild(option);
        });
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
            registration_fee: document.getElementById("registration_fee").value
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

// Show View Participants
function showViewParticipants() {
    document.getElementById("content").innerHTML = `
        <h2>Manage Participants</h2>
        <div style="margin-bottom: 20px;">
            <button onclick="showAddParticipantForm()">Add New Participant</button>
        </div>
        <table id="participantsTable">
            <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Performance Title</th>
                <th>Competition</th>
                <th>Registration Status</th>
                <th>Actions</th>
            </tr>
        </table>
    `;

    fetch('http://localhost:3002/participants')
    .then(response => response.json())
    .then(data => {
        let tableContent = `
            <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Performance Title</th>
                <th>Competition</th>
                <th>Registration Status</th>
                <th>Actions</th>
            </tr>
        `;
        
        data.forEach(participant => {
            tableContent += `
                <tr>
                    <td>${participant.participant_name}</td>
                    <td>${participant.age}</td>
                    <td>${participant.performance_title}</td>
                    <td>${participant.competition_name || 'Not assigned'}</td>
                    <td class="status-${participant.registration_fee}">${participant.registration_fee.toUpperCase()}</td>
                    <td>
                        <button onclick="viewParticipantDetails(${participant.participant_id})">View Details</button>
                        <button onclick="editParticipant(${participant.participant_id})">Edit</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById("participantsTable").innerHTML = tableContent;
    })
    .catch(error => {
        console.error('Error fetching participants:', error);
        document.getElementById("content").innerHTML += '<p class="alert alert-error">Error loading participants.</p>';
    });
}

// View Participant Details
function viewParticipantDetails(id) {
    fetch(`http://localhost:3002/participant/${id}`)
    .then(response => response.json())
    .then(participant => {
        document.getElementById("content").innerHTML = `
            <h2>Participant Details</h2>
            <div class="dashboard-card" style="text-align: left; max-width: 600px; margin: 0 auto;">
                <h3>${participant.participant_name}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                    <div>
                        <p><strong>Email:</strong> ${participant.email}</p>
                        <p><strong>Phone:</strong> ${participant.phone || 'Not provided'}</p>
                        <p><strong>Age:</strong> ${participant.age}</p>
                        <p><strong>Gender:</strong> ${participant.gender}</p>
                    </div>
                    <div>
                        <p><strong>School/Organization:</strong> ${participant.school_organization || 'Not specified'}</p>
                        <p><strong>Competition:</strong> ${participant.competition_name || 'Not assigned'}</p>
                        <p><strong>Registration Status:</strong> <span class="status-${participant.registration_fee}">${participant.registration_fee.toUpperCase()}</span></p>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <p><strong>Performance Title:</strong> ${participant.performance_title}</p>
                    <p><strong>Performance Description:</strong></p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        ${participant.performance_description || 'No description provided'}
                    </div>
                </div>
            </div>
            <br>
            <button onclick="showViewParticipants()">Back to Participants</button>
            <button onclick="editParticipant(${participant.participant_id})">Edit Participant</button>
        `;
    })
    .catch(error => {
        console.error('Error fetching participant details:', error);
        alert('Error loading participant details');
    });
}

// Edit Participant (similar to admin but staff-specific)
function editParticipant(id) {
    fetch(`http://localhost:3002/participant/${id}`)
    .then(response => response.json())
    .then(participant => {
        document.getElementById("content").innerHTML = `
            <h2>Edit Participant</h2>
            <form id="editParticipantForm">
                <input type="hidden" id="participant_id" value="${participant.participant_id}">
                
                <label for="participant_name">Participant Name:</label>
                <input type="text" id="participant_name" name="participant_name" value="${participant.participant_name}" required>
                
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="${participant.email}" required>
                
                <label for="phone">Phone Number:</label>
                <input type="tel" id="phone" name="phone" value="${participant.phone || ''}">
                
                <label for="age">Age:</label>
                <input type="number" id="age" name="age" value="${participant.age}" min="1" max="120" required>
                
                <label for="gender">Gender:</label>
                <select id="gender" name="gender" required>
                    <option value="male" ${participant.gender === 'male' ? 'selected' : ''}>Male</option>
                    <option value="female" ${participant.gender === 'female' ? 'selected' : ''}>Female</option>
                    <option value="other" ${participant.gender === 'other' ? 'selected' : ''}>Other</option>
                </select>
                
                <label for="school_organization">School/Organization:</label>
                <input type="text" id="school_organization" name="school_organization" value="${participant.school_organization || ''}">
                
                <label for="performance_title">Performance Title:</label>
                <input type="text" id="performance_title" name="performance_title" value="${participant.performance_title}" required>
                
                <label for="performance_description">Performance Description:</label>
                <textarea id="performance_description" name="performance_description" rows="4">${participant.performance_description || ''}</textarea>
                
                <label for="competition">Competition:</label>
                <select id="competition" name="competition" required>
                    <option value="">Select Competition</option>
                </select>
                
                <label for="registration_fee">Registration Fee Status:</label>
                <select id="registration_fee" name="registration_fee" required>
                    <option value="paid" ${participant.registration_fee === 'paid' ? 'selected' : ''}>Paid</option>
                    <option value="pending" ${participant.registration_fee === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="waived" ${participant.registration_fee === 'waived' ? 'selected' : ''}>Waived</option>
                </select>
                
                <input type="submit" value="Update Participant">
                <button type="button" onclick="showViewParticipants()" class="secondary">Cancel</button>
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
                option.textContent = `${competition.competition_name} (${competition.category})`;
                if (participant.competition_id == competition.competition_id) {
                    option.selected = true;
                }
                competitionSelect.appendChild(option);
            });
        });

        document.getElementById("editParticipantForm").onsubmit = function(event) {
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
                registration_fee: document.getElementById("registration_fee").value
            };

            fetch(`http://localhost:3002/update-participant/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(participantData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Participant updated successfully!');
                    showViewParticipants();
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error updating participant');
            });
        };
    })
    .catch(error => {
        console.error('Error fetching participant:', error);
        alert('Error loading participant data');
    });
}

// Show View Judges (Read-only for staff)
function showViewJudges() {
    document.getElementById("content").innerHTML = `
        <h2>View Judges</h2>
        <table id="judgesTable">
            <tr>
                <th>Judge Name</th>
                <th>Email</th>
                <th>Expertise</th>
                <th>Experience</th>
                <th>Competition</th>
                <th>Actions</th>
            </tr>
        </table>
    `;

    fetch('http://localhost:3002/judges')
    .then(response => response.json())
    .then(data => {
        let tableContent = `
            <tr>
                <th>Judge Name</th>
                <th>Email</th>
                <th>Expertise</th>
                <th>Experience</th>
                <th>Competition</th>
                <th>Actions</th>
            </tr>
        `;
        
        data.forEach(judge => {
            tableContent += `
                <tr>
                    <td>${judge.judge_name}</td>
                    <td>${judge.email}</td>
                    <td>${judge.expertise}</td>
                    <td>${judge.experience_years} years</td>
                    <td>${judge.competition_name || 'Not assigned'}</td>
                    <td>
                        <button onclick="viewJudgeDetails(${judge.judge_id})">View Details</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById("judgesTable").innerHTML = tableContent;
    })
    .catch(error => {
        console.error('Error fetching judges:', error);
        document.getElementById("content").innerHTML += '<p class="alert alert-error">Error loading judges.</p>';
    });
}

// View Judge Details
function viewJudgeDetails(id) {
    fetch(`http://localhost:3002/judge/${id}`)
    .then(response => response.json())
    .then(judge => {
        document.getElementById("content").innerHTML = `
            <h2>Judge Details</h2>
            <div class="dashboard-card" style="text-align: left; max-width: 600px; margin: 0 auto;">
                <h3>${judge.judge_name}</h3>
                <p><strong>Email:</strong> ${judge.email}</p>
                <p><strong>Phone:</strong> ${judge.phone || 'Not provided'}</p>
                <p><strong>Area of Expertise:</strong> ${judge.expertise}</p>
                <p><strong>Years of Experience:</strong> ${judge.experience_years}</p>
                <p><strong>Assigned Competition:</strong> ${judge.competition_name || 'Not assigned'}</p>
                <p><strong>Username:</strong> ${judge.username || 'Not set'}</p>
                <div style="margin-top: 20px;">
                    <strong>Credentials & Qualifications:</strong>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        ${judge.credentials || 'No credentials provided'}
                    </div>
                </div>
            </div>
            <br>
            <button onclick="showViewJudges()">Back to Judges List</button>
        `;
    })
    .catch(error => {
        console.error('Error fetching judge details:', error);
        alert('Error loading judge details');
    });
}

// Show Reports
function showReports() {
    document.getElementById("content").innerHTML = `
        <h2>Reports</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div class="dashboard-card">
                <h3>📊 Participant Summary</h3>
                <p>Overview of all registered participants</p>
                <button onclick="generateParticipantReport()" class="card-button">Generate Report</button>
            </div>
            
            <div class="dashboard-card">
                <h3>💰 Payment Status Report</h3>
                <p>Registration fee payment status</p>
                <button onclick="generatePaymentReport()" class="card-button">Generate Report</button>
            </div>
            
            <div class="dashboard-card">
                <h3>🏆 Competition Summary</h3>
                <p>Overview of all competitions</p>
                <button onclick="generateCompetitionReport()" class="card-button">Generate Report</button>
            </div>
        </div>
        
        <div id="reportContent" style="margin-top: 30px;"></div>
    `;
}

// Generate Participant Report
function generateParticipantReport() {
    fetch('http://localhost:3002/participants')
    .then(response => response.json())
    .then(participants => {
        const totalParticipants = participants.length;
        const genderStats = participants.reduce((acc, p) => {
            acc[p.gender] = (acc[p.gender] || 0) + 1;
            return acc;
        }, {});
        
        const competitionStats = participants.reduce((acc, p) => {
            const comp = p.competition_name || 'Unassigned';
            acc[comp] = (acc[comp] || 0) + 1;
            return acc;
        }, {});

        let reportHtml = `
            <div class="dashboard-card" style="text-align: left;">
                <h3>📊 Participant Summary Report</h3>
                <p><strong>Total Participants:</strong> ${totalParticipants}</p>
                
                <h4 style="margin-top: 20px; color: #800020;">Gender Distribution:</h4>
                <ul>
        `;
        
        Object.entries(genderStats).forEach(([gender, count]) => {
            reportHtml += `<li>${gender}: ${count} (${((count/totalParticipants)*100).toFixed(1)}%)</li>`;
        });
        
        reportHtml += `
                </ul>
                
                <h4 style="margin-top: 20px; color: #800020;">Participants by Competition:</h4>
                <ul>
        `;
        
        Object.entries(competitionStats).forEach(([comp, count]) => {
            reportHtml += `<li>${comp}: ${count} participants</li>`;
        });
        
        reportHtml += `
                </ul>
            </div>
        `;
        
        document.getElementById("reportContent").innerHTML = reportHtml;
    })
    .catch(error => {
        console.error('Error generating report:', error);
        document.getElementById("reportContent").innerHTML = '<p class="alert alert-error">Error generating report.</p>';
    });
}

// Generate Payment Report
function generatePaymentReport() {
    fetch('http://localhost:3002/participants')
    .then(response => response.json())
    .then(participants => {
        const paymentStats = participants.reduce((acc, p) => {
            acc[p.registration_fee] = (acc[p.registration_fee] || 0) + 1;
            return acc;
        }, {});
        
        const totalParticipants = participants.length;

        let reportHtml = `
            <div class="dashboard-card" style="text-align: left;">
                <h3>💰 Payment Status Report</h3>
                <p><strong>Total Registrations:</strong> ${totalParticipants}</p>
                
                <h4 style="margin-top: 20px; color: #800020;">Payment Status:</h4>
                <ul>
        `;
        
        Object.entries(paymentStats).forEach(([status, count]) => {
            const percentage = ((count/totalParticipants)*100).toFixed(1);
            reportHtml += `<li class="status-${status}">${status.toUpperCase()}: ${count} (${percentage}%)</li>`;
        });
        
        reportHtml += `
                </ul>
                
                <h4 style="margin-top: 20px; color: #800020;">Action Required:</h4>
                <ul>
        `;
        
        if (paymentStats.pending) {
            reportHtml += `<li>Follow up with ${paymentStats.pending} pending payments</li>`;
        }
        
        reportHtml += `
                </ul>
            </div>
        `;
        
        document.getElementById("reportContent").innerHTML = reportHtml;
    })
    .catch(error => {
        console.error('Error generating payment report:', error);
        document.getElementById("reportContent").innerHTML = '<p class="alert alert-error">Error generating payment report.</p>';
    });
}

// Generate Competition Report
function generateCompetitionReport() {
    Promise.all([
        fetch('http://localhost:3002/competitions').then(r => r.json()),
        fetch('http://localhost:3002/participants').then(r => r.json()),
        fetch('http://localhost:3002/judges').then(r => r.json())
    ])
    .then(([competitions, participants, judges]) => {
        let reportHtml = `
            <div class="dashboard-card" style="text-align: left;">
                <h3>🏆 Competition Summary Report</h3>
                <p><strong>Total Competitions:</strong> ${competitions.length}</p>
                
                <h4 style="margin-top: 20px; color: #800020;">Competition Details:</h4>
                <table style="width: 100%; margin-top: 10px;">
                    <tr>
                        <th>Competition</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Participants</th>
                        <th>Judges</th>
                    </tr>
        `;
        
        competitions.forEach(comp => {
            const participantCount = participants.filter(p => p.competition_id === comp.competition_id).length;
            const judgeCount = judges.filter(j => j.competition_id === comp.competition_id).length;
            
            reportHtml += `
                <tr>
                    <td>${comp.competition_name}</td>
                    <td>${comp.category}</td>
                    <td>${comp.competition_date}</td>
                    <td>${participantCount}</td>
                    <td>${judgeCount}</td>
                </tr>
            `;
        });
        
        reportHtml += `
                </table>
            </div>
        `;
        
        document.getElementById("reportContent").innerHTML = reportHtml;
    })
    .catch(error => {
        console.error('Error generating competition report:', error);
        document.getElementById("reportContent").innerHTML = '<p class="alert alert-error">Error generating competition report.</p>';
    });
}