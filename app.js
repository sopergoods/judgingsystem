// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
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
                <h1>Automated Judging System</h1>
                <p>Admin Dashboard</p>
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

// Show Create Competition Form
function showCreateCompetitionForm() {
    console.log('Create Competition form is being displayed'); // Debugging log

    document.getElementById("content").innerHTML = `
        <h2>Create Competition</h2>
        <form id="createCompetitionForm">
            <label for="competition_name">Competition Name:</label>
            <input type="text" id="competition_name" name="competition_name" required><br><br>
            
            <label for="category">Category:</label>
            <select id="category" name="category" required>
                <option value="music">Music</option>
                <option value="dance">Dance</option>
                <option value="art">Art</option>
                <option value="singing">Singing</option>
            </select><br><br>
            
            <label for="competition_date">Competition Date:</label>
            <input type="date" id="competition_date" name="competition_date" required><br><br>
            
            <input type="submit" value="Create Competition">
        </form>
    `;

    document.getElementById("createCompetitionForm").onsubmit = function(event) {
        event.preventDefault();

        const competition_name = document.getElementById("competition_name").value;
        const category = document.getElementById("category").value;
        const competition_date = document.getElementById("competition_date").value;

        console.log('Form data:', competition_name, category, competition_date); // Debugging log

        // Send data to Node.js back-end
        fetch('http://localhost:3002/create-competition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                competition_name: competition_name,
                category: category,
                competition_date: competition_date
            })
        })
        .then(response => response.text())
        .then(data => {
            alert(data); // Display success or error message
            showViewCompetitions(); // Reload competition list
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };
}

function showViewCompetitions() {
    console.log('Fetching competitions...');  // Debugging log

    document.getElementById("content").innerHTML = `
        <h2>View Competitions</h2>
        <table>
            <tr>
                <th>Competition Name</th>
                <th>Category</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
        </table>
    `;

    // Fetch competitions from Node.js back-end
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(data => {
        console.log('Competitions fetched:', data);  // Debugging log
        let tableContent = '';
        data.forEach(competition => {
            tableContent += `
                <tr>
                    <td>${competition.competition_name}</td>
                    <td>${competition.category}</td>
                    <td>${competition.competition_date}</td>
                    <td>
                        <button onclick="editCompetition(${competition.competition_id})">Edit</button>
                        <button onclick="deleteCompetition(${competition.competition_id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        document.querySelector("table").innerHTML += tableContent;
    })
    .catch(error => {
        console.error('Error fetching competitions:', error);
    });
}

// Edit Competition
function editCompetition(id) {
    console.log('Edit competition with ID:', id); // Debugging log
    
    // Fetch competition data first
    fetch(`http://localhost:3002/competition/${id}`)
    .then(response => response.json())
    .then(competition => {
        document.getElementById("content").innerHTML = `
            <h2>Edit Competition</h2>
            <form id="editCompetitionForm">
                <input type="hidden" id="competition_id" value="${competition.competition_id}">
                
                <label for="competition_name">Competition Name:</label>
                <input type="text" id="competition_name" name="competition_name" value="${competition.competition_name}" required><br><br>
                
                <label for="category">Category:</label>
                <select id="category" name="category" required>
                    <option value="music" ${competition.category === 'music' ? 'selected' : ''}>Music</option>
                    <option value="dance" ${competition.category === 'dance' ? 'selected' : ''}>Dance</option>
                    <option value="art" ${competition.category === 'art' ? 'selected' : ''}>Art</option>
                    <option value="singing" ${competition.category === 'singing' ? 'selected' : ''}>Singing</option>
                </select><br><br>
                
                <label for="competition_date">Competition Date:</label>
                <input type="date" id="competition_date" name="competition_date" value="${competition.competition_date}" required><br><br>
                
                <input type="submit" value="Update Competition">
                <button type="button" onclick="showViewCompetitions()">Cancel</button>
            </form>
        `;

        document.getElementById("editCompetitionForm").onsubmit = function(event) {
            event.preventDefault();
            
            const competition_id = document.getElementById("competition_id").value;
            const competition_name = document.getElementById("competition_name").value;
            const category = document.getElementById("category").value;
            const competition_date = document.getElementById("competition_date").value;

            fetch(`http://localhost:3002/update-competition/${competition_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    competition_name: competition_name,
                    category: category,
                    competition_date: competition_date
                })
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
                showViewCompetitions();
            })
            .catch(error => {
                console.error('Error:', error);
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
    console.log('Delete competition with ID:', id); // Debugging log
    
    if (confirm('Are you sure you want to delete this competition?')) {
        fetch(`http://localhost:3002/delete-competition/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            showViewCompetitions(); // Reload competition list
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Show Add Judge Form with Credential Display
function showAddJudgeForm() {
    document.getElementById("content").innerHTML = `
        <h2>Add Judge</h2>
        <form id="addJudgeForm">
            <label for="judge_name">Judge Name:</label>
            <input type="text" id="judge_name" name="judge_name" required><br><br>
            
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required><br><br>
            
            <label for="phone">Phone Number:</label>
            <input type="tel" id="phone" name="phone"><br><br>
            
            <label for="expertise">Area of Expertise:</label>
            <select id="expertise" name="expertise" required>
                <option value="music">Music</option>
                <option value="dance">Dance</option>
                <option value="art">Art</option>
                <option value="singing">Singing</option>
            </select><br><br>
            
            <label for="experience_years">Years of Experience:</label>
            <input type="number" id="experience_years" name="experience_years" min="0" required><br><br>
            
            <label for="credentials">Credentials/Qualifications:</label>
            <textarea id="credentials" name="credentials" rows="4" cols="50" placeholder="Enter judge's credentials, certifications, and qualifications..."></textarea><br><br>
            
            <label for="competition">Assign to Competition:</label>
            <select id="competition" name="competition" required>
                <option value="">Select Competition</option>
                <!-- Dynamically populate this dropdown -->
            </select><br><br>
            
            <input type="submit" value="Add Judge">
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

    document.getElementById("addJudgeForm").onsubmit = function(event) {
        event.preventDefault();

        const judgeData = {
            judge_name: document.getElementById("judge_name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            expertise: document.getElementById("expertise").value,
            experience_years: document.getElementById("experience_years").value,
            credentials: document.getElementById("credentials").value,
            competition_id: document.getElementById("competition").value
        };

        console.log('Judge data:', judgeData); // Debugging log

        fetch('http://localhost:3002/add-judge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(judgeData)
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            showViewJudges(); // Redirect to view judges
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };
}

// Show View Judges
function showViewJudges() {
    console.log('Fetching judges...');

    document.getElementById("content").innerHTML = `
        <h2>View Judges</h2>
        <table>
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
        console.log('Judges fetched:', data);
        let tableContent = '';
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
                        <button onclick="editJudge(${judge.judge_id})">Edit</button>
                        <button onclick="deleteJudge(${judge.judge_id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        document.querySelector("table").innerHTML = tableContent;
    })
    .catch(error => {
        console.error('Error fetching judges:', error);
    });
}

// View Judge Details
function viewJudgeDetails(id) {
    fetch(`http://localhost:3002/judge/${id}`)
    .then(response => response.json())
    .then(judge => {
        document.getElementById("content").innerHTML = `
            <h2>Judge Details</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                <h3>${judge.judge_name}</h3>
                <p><strong>Email:</strong> ${judge.email}</p>
                <p><strong>Phone:</strong> ${judge.phone || 'Not provided'}</p>
                <p><strong>Area of Expertise:</strong> ${judge.expertise}</p>
                <p><strong>Years of Experience:</strong> ${judge.experience_years}</p>
                <p><strong>Assigned Competition:</strong> ${judge.competition_name || 'Not assigned'}</p>
                <div>
                    <strong>Credentials & Qualifications:</strong>
                    <div style="background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        ${judge.credentials || 'No credentials provided'}
                    </div>
                </div>
            </div>
            <br>
            <button onclick="showViewJudges()">Back to Judges List</button>
            <button onclick="editJudge(${judge.judge_id})">Edit Judge</button>
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
            <h2>Edit Judge</h2>
            <form id="editJudgeForm">
                <input type="hidden" id="judge_id" value="${judge.judge_id}">
                
                <label for="judge_name">Judge Name:</label>
                <input type="text" id="judge_name" name="judge_name" value="${judge.judge_name}" required><br><br>
                
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="${judge.email}" required><br><br>
                
                <label for="phone">Phone Number:</label>
                <input type="tel" id="phone" name="phone" value="${judge.phone || ''}"><br><br>
                
                <label for="expertise">Area of Expertise:</label>
                <select id="expertise" name="expertise" required>
                    <option value="music" ${judge.expertise === 'music' ? 'selected' : ''}>Music</option>
                    <option value="dance" ${judge.expertise === 'dance' ? 'selected' : ''}>Dance</option>
                    <option value="art" ${judge.expertise === 'art' ? 'selected' : ''}>Art</option>
                    <option value="singing" ${judge.expertise === 'singing' ? 'selected' : ''}>Singing</option>
                </select><br><br>
                
                <label for="experience_years">Years of Experience:</label>
                <input type="number" id="experience_years" name="experience_years" value="${judge.experience_years}" min="0" required><br><br>
                
                <label for="credentials">Credentials/Qualifications:</label>
                <textarea id="credentials" name="credentials" rows="4" cols="50">${judge.credentials || ''}</textarea><br><br>
                
                <label for="competition">Assign to Competition:</label>
                <select id="competition" name="competition">
                    <option value="">Select Competition</option>
                </select><br><br>
                
                <input type="submit" value="Update Judge">
                <button type="button" onclick="showViewJudges()">Cancel</button>
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
                competition_id: document.getElementById("competition").value
            };

            fetch(`http://localhost:3002/update-judge/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(judgeData)
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
                showViewJudges();
            })
            .catch(error => {
                console.error('Error:', error);
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
    if (confirm('Are you sure you want to delete this judge?')) {
        fetch(`http://localhost:3002/delete-judge/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            showViewJudges();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Show Add Participant Form
function showAddParticipantForm() {
    document.getElementById("content").innerHTML = `
        <h2>Add Participant</h2>
        <form id="addParticipantForm">
            <label for="participant_name">Participant Name:</label>
            <input type="text" id="participant_name" name="participant_name" required><br><br>
            
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required><br><br>
            
            <label for="phone">Phone Number:</label>
            <input type="tel" id="phone" name="phone"><br><br>
            
            <label for="age">Age:</label>
            <input type="number" id="age" name="age" min="1" max="120" required><br><br>
            
            <label for="gender">Gender:</label>
            <select id="gender" name="gender" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select><br><br>
            
            <label for="school_organization">School/Organization:</label>
            <input type="text" id="school_organization" name="school_organization"><br><br>
            
            <label for="performance_title">Performance Title:</label>
            <input type="text" id="performance_title" name="performance_title" required><br><br>
            
            <label for="performance_description">Performance Description:</label>
            <textarea id="performance_description" name="performance_description" rows="4" cols="50" placeholder="Describe the performance..."></textarea><br><br>
            
            <label for="competition">Competition:</label>
            <select id="competition" name="competition" required>
                <option value="">Select Competition</option>
                <!-- Dynamically populate this dropdown -->
            </select><br><br>
            
            <label for="registration_fee">Registration Fee Paid:</label>
            <select id="registration_fee" name="registration_fee" required>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="waived">Waived</option>
            </select><br><br>
            
            <input type="submit" value="Add Participant">
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

        console.log('Participant data:', participantData);

        fetch('http://localhost:3002/add-participant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(participantData)
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            showViewParticipants();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };
}

// Show View Participants
function showViewParticipants() {
    console.log('Fetching participants...');

    document.getElementById("content").innerHTML = `
        <h2>View Participants</h2>
        <div style="margin-bottom: 20px;">
            <label for="filterCompetition">Filter by Competition:</label>
            <select id="filterCompetition" onchange="filterParticipants()">
                <option value="">All Competitions</option>
            </select>
        </div>
        <table>
            <tr>
                <th>Participant Name</th>
                <th>Age</th>
                <th>Performance Title</th>
                <th>Competition</th>
                <th>Registration Status</th>
                <th>Actions</th>
            </tr>
        </table>
    `;

    // Populate competition filter dropdown
    fetch('http://localhost:3002/competitions')
    .then(response => response.json())
    .then(competitions => {
        const filterSelect = document.getElementById("filterCompetition");
        competitions.forEach(competition => {
            const option = document.createElement("option");
            option.value = competition.competition_id;
            option.textContent = `${competition.competition_name} (${competition.category})`;
            filterSelect.appendChild(option);
        });
    });

    // Fetch and display participants
    loadParticipants();
}

function loadParticipants(competitionId = '') {
    const url = competitionId ? 
        `http://localhost:3002/participants?competition_id=${competitionId}` : 
        'http://localhost:3002/participants';

    fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log('Participants fetched:', data);
        let tableContent = `
            <tr>
                <th>Participant Name</th>
                <th>Age</th>
                <th>Performance Title</th>
                <th>Competition</th>
                <th>Registration Status</th>
                <th>Actions</th>
            </tr>
        `;
        
        data.forEach(participant => {
            const statusColor = participant.registration_fee === 'paid' ? 'green' : 
                               participant.registration_fee === 'pending' ? 'orange' : 'blue';
            
            tableContent += `
                <tr>
                    <td>${participant.participant_name}</td>
                    <td>${participant.age}</td>
                    <td>${participant.performance_title}</td>
                    <td>${participant.competition_name || 'Not assigned'}</td>
                    <td style="color: ${statusColor}; font-weight: bold;">${participant.registration_fee.toUpperCase()}</td>
                    <td>
                        <button onclick="viewParticipantDetails(${participant.participant_id})">View Details</button>
                        <button onclick="editParticipant(${participant.participant_id})">Edit</button>
                        <button onclick="deleteParticipant(${participant.participant_id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        document.querySelector("table").innerHTML = tableContent;
    })
    .catch(error => {
        console.error('Error fetching participants:', error);
    });
}

function filterParticipants() {
    const competitionId = document.getElementById("filterCompetition").value;
    loadParticipants(competitionId);
}

// View Participant Details
function viewParticipantDetails(id) {
    fetch(`http://localhost:3002/participant/${id}`)
    .then(response => response.json())
    .then(participant => {
        const statusColor = participant.registration_fee === 'paid' ? 'green' : 
                           participant.registration_fee === 'pending' ? 'orange' : 'blue';
        
        document.getElementById("content").innerHTML = `
            <h2>Participant Details</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                <h3>${participant.participant_name}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <p><strong>Email:</strong> ${participant.email}</p>
                        <p><strong>Phone:</strong> ${participant.phone || 'Not provided'}</p>
                        <p><strong>Age:</strong> ${participant.age}</p>
                        <p><strong>Gender:</strong> ${participant.gender}</p>
                        <p><strong>School/Organization:</strong> ${participant.school_organization || 'Not specified'}</p>
                    </div>
                    <div>
                        <p><strong>Performance Title:</strong> ${participant.performance_title}</p>
                        <p><strong>Competition:</strong> ${participant.competition_name || 'Not assigned'}</p>
                        <p><strong>Registration Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${participant.registration_fee.toUpperCase()}</span></p>
                        <p><strong>Registration Date:</strong> ${participant.registration_date ? new Date(participant.registration_date).toLocaleDateString() : 'Not recorded'}</p>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <strong>Performance Description:</strong>
                    <div style="background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        ${participant.performance_description || 'No description provided'}
                    </div>
                </div>
            </div>
            <br>
            <button onclick="showViewParticipants()">Back to Participants List</button>
            <button onclick="editParticipant(${participant.participant_id})">Edit Participant</button>
        `;
    })
    .catch(error => {
        console.error('Error fetching participant details:', error);
        alert('Error loading participant details');
    });
}

// Edit Participant
function editParticipant(id) {
    fetch(`http://localhost:3002/participant/${id}`)
    .then(response => response.json())
    .then(participant => {
        document.getElementById("content").innerHTML = `
            <h2>Edit Participant</h2>
            <form id="editParticipantForm">
                <input type="hidden" id="participant_id" value="${participant.participant_id}">
                
                <label for="participant_name">Participant Name:</label>
                <input type="text" id="participant_name" name="participant_name" value="${participant.participant_name}" required><br><br>
                
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="${participant.email}" required><br><br>
                
                <label for="phone">Phone Number:</label>
                <input type="tel" id="phone" name="phone" value="${participant.phone || ''}"><br><br>
                
                <label for="age">Age:</label>
                <input type="number" id="age" name="age" value="${participant.age}" min="1" max="120" required><br><br>
                
                <label for="gender">Gender:</label>
                <select id="gender" name="gender" required>
                    <option value="male" ${participant.gender === 'male' ? 'selected' : ''}>Male</option>
                    <option value="female" ${participant.gender === 'female' ? 'selected' : ''}>Female</option>
                    <option value="other" ${participant.gender === 'other' ? 'selected' : ''}>Other</option>
                </select><br><br>
                
                <label for="school_organization">School/Organization:</label>
                <input type="text" id="school_organization" name="school_organization" value="${participant.school_organization || ''}"><br><br>
                
                <label for="performance_title">Performance Title:</label>
                <input type="text" id="performance_title" name="performance_title" value="${participant.performance_title}" required><br><br>
                
                <label for="performance_description">Performance Description:</label>
                <textarea id="performance_description" name="performance_description" rows="4" cols="50">${participant.performance_description || ''}</textarea><br><br>
                
                <label for="competition">Competition:</label>
                <select id="competition" name="competition" required>
                    <option value="">Select Competition</option>
                </select><br><br>
                
                <label for="registration_fee">Registration Fee Status:</label>
                <select id="registration_fee" name="registration_fee" required>
                    <option value="paid" ${participant.registration_fee === 'paid' ? 'selected' : ''}>Paid</option>
                    <option value="pending" ${participant.registration_fee === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="waived" ${participant.registration_fee === 'waived' ? 'selected' : ''}>Waived</option>
                </select><br><br>
                
                <input type="submit" value="Update Participant">
                <button type="button" onclick="showViewParticipants()">Cancel</button>
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
            .then(response => response.text())
            .then(data => {
                alert(data);
                showViewParticipants();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        };
    })
    .catch(error => {
        console.error('Error fetching participant:', error);
        alert('Error loading participant data');
    });
}

// Delete Participant
function deleteParticipant(id) {
    if (confirm('Are you sure you want to delete this participant?')) {
        fetch(`http://localhost:3002/delete-participant/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            showViewParticipants();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Show Dashboard/Home
function showDashboard() {
    document.getElementById("content").innerHTML = `
        <h2>Admin Dashboard</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>Competitions</h3>
                <p>Manage competitions and events</p>
                <button onclick="showViewCompetitions()" style="background: white; color: #667eea; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">View All</button>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>Judges</h3>
                <p>Manage judge profiles and assignments</p>
                <button onclick="showViewJudges()" style="background: white; color: #f5576c; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">View All</button>
            </div>
            <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>Participants</h3>
                <p>Manage participant registrations</p>
                <button onclick="showViewParticipants()" style="background: white; color: #43e97b; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">View All</button>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>Quick Actions</h3>
                <p>Common administrative tasks</p>
                <button onclick="showCreateCompetitionForm()" style="background: white; color: #4facfe; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin: 2px;">New Competition</button>
                <button onclick="showAddJudgeForm()" style="background: white; color: #4facfe; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin: 2px;">Add Judge</button>
                <button onclick="showAddParticipantForm()" style="background: white; color: #4facfe; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin: 2px;">Add Participant</button>
            </div>
        </div>
    `;
}
