// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  
  if (getUserType() !== 'municipality') {
    window.location.href = '/';
  }

  loadMunicipalityProfile();
  loadDashboardStats();
  setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
  // Sidebar menu
  document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      showView(view);
      
      document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  // Profile edit form
  document.getElementById('profileEditForm').addEventListener('submit', handleProfileUpdate);

  // Image uploads
  setupImageUpload('profileUploadArea', 'profileImageInput', null);
}

// Show specific view
function showView(viewName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`${viewName}-view`).classList.add('active');

  // Load data based on view
  if (viewName === 'new') {
    loadNewComplaints();
  } else if (viewName === 'unsolved') {
    loadUnsolvedComplaints();
  } else if (viewName === 'processing') {
    loadProcessingComplaints();
  } else if (viewName === 'history') {
    loadCompletedComplaints();
  } else if (viewName === 'blocked') {
    loadBlockedUsers();
  }
}

// Load municipality profile
async function loadMunicipalityProfile() {
  try {
    const municipality = await apiRequest('/municipality/profile');
    document.getElementById('munWelcome').textContent = `Welcome, ${municipality.name}`;

    // Update profile pictures
    if (municipality.profilePicture) {
      const profilePic = `/uploads/${municipality.profilePicture}`;
      // Small profile pic
      const smallPic = document.getElementById('profilePicSmall');
      smallPic.innerHTML = `<img src="${profilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      // Large profile pic
      const largePic = document.getElementById('profilePicLarge');
      largePic.innerHTML = `<img src="${profilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    }

    // Display current profile info
    displayProfileInfo(municipality);

    // Pre-fill edit form
    document.getElementById('editName').value = municipality.name;
    document.getElementById('editLocation').value = municipality.location;
    document.getElementById('editRegNumber').value = municipality.regNumber;
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Display profile info
function displayProfileInfo(municipality) {
  const profileInfo = document.getElementById('profileInfo');
  profileInfo.innerHTML = `
    <div style="background: #fef5e7; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
      <p><strong>Name:</strong> ${municipality.name}</p>
      <p><strong>Email:</strong> ${municipality.email}</p>
      <p><strong>Location:</strong> ${municipality.location}</p>
      <p><strong>Registration Number:</strong> ${municipality.regNumber}</p>
      <p style="font-size: 0.85rem; color: #666; margin-top: 1rem;">Status: <span style="color: #27ae60;">✅ Active</span></p>
    </div>
  `;
}

// Load dashboard stats
async function loadDashboardStats() {
  try {
    const newComplaints = await apiRequest('/complaint/new-complaints');
    const unsolvedComplaints = await apiRequest('/complaint/unsolved-complaints');
    const completedComplaints = await apiRequest('/complaint/history');
    const blockedUsers = await apiRequest('/municipality/blocked-users');

    document.getElementById('todayCount').textContent = newComplaints.length;
    document.getElementById('unsolvedCount').textContent = unsolvedComplaints.length;
    document.getElementById('completedCount').textContent = completedComplaints.length;
    document.getElementById('blockedCount').textContent = blockedUsers.length;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load new complaints
async function loadNewComplaints() {
  try {
    const complaints = await apiRequest('/complaint/new-complaints');
    const list = document.getElementById('newComplaintsList');
    
    if (complaints.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">No new complaints today.</p>';
      loadDashboardStats();
      return;
    }

    list.innerHTML = complaints.map(complaint => createComplaintCard(complaint)).join('');
    attachComplaintEventListeners();
  } catch (error) {
    showAlert('Error loading new complaints', 'danger');
    console.error(error);
  }
}

// Load unsolved complaints
async function loadUnsolvedComplaints() {
  try {
    const complaints = await apiRequest('/complaint/unsolved-complaints');
    const list = document.getElementById('unsolvedComplaintsList');
    
    if (complaints.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">No unsolved complaints older than 24 hours.</p>';
      loadDashboardStats();
      return;
    }

    list.innerHTML = complaints.map(complaint => createComplaintCard(complaint)).join('');
    attachComplaintEventListeners();
  } catch (error) {
    showAlert('Error loading unsolved complaints', 'danger');
    console.error(error);
  }
}

// Load completed complaints
async function loadCompletedComplaints() {
  try {
    const complaints = await apiRequest('/complaint/history');
    const list = document.getElementById('historyComplaintsList');
    
    if (complaints.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">No completed complaints yet.</p>';
      loadDashboardStats();
      return;
    }

    list.innerHTML = complaints.map(complaint => `
      <div class="complaint-card" style="border-left-color: #27ae60;">
        <div class="complaint-header">
          <div class="complaint-header-left">
            <h3>✓ Complaint #${complaint._id.slice(-6)}</h3>
            <p class="complaint-date">Reported: ${formatDate(complaint.createdAt)}</p>
          </div>
          <span class="badge badge-success">Completed</span>
        </div>
        <div class="complaint-details">
          <p><strong>Reported by:</strong> ${complaint.userId.name}</p>
          <p><strong>Contact:</strong> ${complaint.userId.phone} | ${complaint.userId.email}</p>
        </div>
        <p><strong>Description:</strong> ${complaint.description}</p>
        ${complaint.image ? `<img src="/uploads/${complaint.image}" alt="Complaint">` : ''}
        <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">
          📍 <a href="${getMapLink(complaint.latitude, complaint.longitude)}" target="_blank">View Location</a>
        </p>
      </div>
    `).join('');
    loadDashboardStats();
  } catch (error) {
    showAlert('Error loading completed complaints', 'danger');
    console.error(error);
  }
}

// Load processing complaints
async function loadProcessingComplaints() {
  try {
    const complaints = await apiRequest('/complaint/processing-complaints');
    const list = document.getElementById('processingComplaintsList');

    if (complaints.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">No processing complaints at the moment.</p>';
      loadDashboardStats();
      return;
    }

    list.innerHTML = complaints.map(complaint => `
      <div class="complaint-card" id="complaint-${complaint._id}">
        <div class="complaint-header">
          <div class="complaint-header-left">
            <h3>Complaint #${complaint._id.slice(-6)}</h3>
            <p class="complaint-date">Reported: ${formatDate(complaint.createdAt)}</p>
          </div>
          <span class="badge badge-processing">Processing</span>
        </div>

        <div class="complaint-details">
          <p><strong>Reported by:</strong> ${complaint.userId.name}</p>
          <p><strong>Phone:</strong> ${complaint.userId.phone}</p>
          <p><strong>Email:</strong> ${complaint.userId.email}</p>
          <p><strong>Address:</strong> ${complaint.userId.address}</p>
        </div>

        <p><strong>Description:</strong> ${complaint.description}</p>
        ${complaint.image ? `<img src="/uploads/${complaint.image}" alt="Complaint">` : ''}

        <p style="font-size: 0.9rem; color: #666; margin: 1rem 0;">
          📍 <a href="${getMapLink(complaint.latitude, complaint.longitude)}" target="_blank">View Location</a>
        </p>

        <div class="complaint-actions">
          <button class="btn btn-primary" onclick="markComplaintCompleted('${complaint._id}')">✅ Mark Completed</button>
          <button class="btn btn-danger" onclick="blockUser('${complaint.userId._id}', '${complaint.userId.name}')">🚫 Block User</button>
        </div>
      </div>
    `).join('');

    attachComplaintEventListeners();
  } catch (error) {
    showAlert('Error loading processing complaints', 'danger');
    console.error(error);
  }
}

// Mark complaint completed helper
async function markComplaintCompleted(complaintId) {
  if (!confirm('Mark this complaint as completed?')) return;

  try {
    await apiRequest(`/complaint/update-status/${complaintId}`, 'PUT', { status: 'Completed' });
    showAlert('Complaint marked as completed', 'success');
    // Refresh processing and stats
    loadProcessingComplaints();
    loadDashboardStats();
    // Also refresh completed history view if open
    const activeView = document.querySelector('.menu-link.active').dataset.view;
    if (activeView === 'history') loadCompletedComplaints();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

// Load blocked users
async function loadBlockedUsers() {
  try {
    const blockedUsers = await apiRequest('/municipality/blocked-users');
    const list = document.getElementById('blockedUsersList');
    
    if (blockedUsers.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">No blocked users.</p>';
      return;
    }

    list.innerHTML = blockedUsers.map(user => `
      <div class="user-item">
        <div class="user-info">
          <p><strong>${user.name}</strong></p>
          <p>📧 ${user.email}</p>
          <p>📱 ${user.phone}</p>
        </div>
        <button class="btn btn-primary" onclick="unblockUser('${user._id}')">🔓 Unblock</button>
      </div>
    `).join('');
  } catch (error) {
    showAlert('Error loading blocked users', 'danger');
    console.error(error);
  }
}

// Create complaint card
function createComplaintCard(complaint) {
  return `
    <div class="complaint-card" id="complaint-${complaint._id}">
      <div class="complaint-header">
        <div class="complaint-header-left">
          <h3>Complaint #${complaint._id.slice(-6)}</h3>
          <p class="complaint-date">Reported: ${formatDate(complaint.createdAt)}</p>
        </div>
        <span class="badge badge-${getStatusBadgeClass(complaint.status)}">${complaint.status}</span>
      </div>

      <div class="complaint-details">
        <p><strong>Reported by:</strong> ${complaint.userId.name}</p>
        <p><strong>Phone:</strong> ${complaint.userId.phone}</p>
        <p><strong>Email:</strong> ${complaint.userId.email}</p>
        <p><strong>Address:</strong> ${complaint.userId.address}</p>
      </div>

      <p><strong>Description:</strong> ${complaint.description}</p>
      ${complaint.image ? `<img src="/uploads/${complaint.image}" alt="Complaint">` : ''}
      
      <p style="font-size: 0.9rem; color: #666; margin: 1rem 0;">
        📍 <a href="${getMapLink(complaint.latitude, complaint.longitude)}" target="_blank">View Location</a>
      </p>

      <div class="complaint-actions">
        <select class="status-select" data-complaint-id="${complaint._id}" onchange="updateComplaintStatus(this)">
          <option value="">-- Update Status --</option>
          <option value="Not Started" ${complaint.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
          <option value="Processing" ${complaint.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Completed" ${complaint.status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
        <button class="btn btn-danger" onclick="blockUser('${complaint.userId._id}', '${complaint.userId.name}')">🚫 Block User</button>
      </div>
    </div>
  `;
}

// Update complaint status
async function updateComplaintStatus(selectElement) {
  const complaintId = selectElement.dataset.complaintId;
  const status = selectElement.value;

  if (!status) return;

  try {
    const response = await apiRequest(`/complaint/update-status/${complaintId}`, 'PUT', {
      status
    });

    showAlert('Complaint status updated successfully!', 'success');
    loadDashboardStats();
    
    // Reload the current view
    const activeView = document.querySelector('.menu-link.active').dataset.view;
    if (activeView === 'new') {
      loadNewComplaints();
    } else if (activeView === 'unsolved') {
      loadUnsolvedComplaints();
    }
  } catch (error) {
    showAlert(error.message, 'danger');
    selectElement.value = '';
  }
}

// Block user
async function blockUser(userId, userName) {
  if (!confirm(`Are you sure you want to block ${userName}?`)) {
    return;
  }

  try {
    const response = await apiRequest(`/municipality/block-user/${userId}`, 'POST', {});
    showAlert(`${userName} has been blocked successfully!`, 'success');
    loadDashboardStats();
    loadBlockedUsers();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

// Unblock user
async function unblockUser(userId) {
  if (!confirm('Are you sure you want to unblock this user?')) {
    return;
  }

  try {
    const response = await apiRequest(`/municipality/unblock-user/${userId}`, 'POST', {});
    showAlert('User has been unblocked successfully!', 'success');
    loadDashboardStats();
    loadBlockedUsers();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

// Attach complaint event listeners
function attachComplaintEventListeners() {
  // Event listeners are attached via onchange and onclick attributes in HTML
}

// Setup image upload
function setupImageUpload(areaId, inputId, previewId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);

  area.addEventListener('click', () => input.click());

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      if (previewId) showImagePreview(input, previewId);
    }
  });

  input.addEventListener('change', () => {
    if (previewId) showImagePreview(input, previewId);
  });
}

// Show image preview
function showImagePreview(input, previewId) {
  if (!previewId) return;
  const preview = document.getElementById(previewId);
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Handle profile update
async function handleProfileUpdate(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('name', document.getElementById('editName').value);
  formData.append('location', document.getElementById('editLocation').value);

  const fileInput = document.getElementById('profileImageInput');
  if (fileInput.files[0]) {
    formData.append('profilePicture', fileInput.files[0]);
  }

  try {
    const response = await apiRequestFormData('/municipality/profile', 'PUT', formData);
    showAlert('Profile updated successfully!', 'success');
    toggleEditMode();
    loadMunicipalityProfile();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

// Toggle edit mode
function toggleEditMode() {
  const editForm = document.getElementById('profileEditForm');
  const profileView = document.getElementById('profileView');

  if (editForm.style.display === 'none' || !editForm.style.display) {
    editForm.style.display = 'block';
    profileView.style.display = 'none';
  } else {
    editForm.style.display = 'none';
    profileView.style.display = 'block';
  }
}

// Profile modal functions
function openProfileModal() {
  document.getElementById('profileModal').style.display = 'block';
  document.getElementById('profileView').style.display = 'block';
  document.getElementById('profileEditForm').style.display = 'none';
}

function closeProfileModal() {
  document.getElementById('profileModal').style.display = 'none';
}

// Delete account
async function deleteAccount() {
  const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
  if (!confirmed) return;

  try {
    await apiRequest('/municipality/delete-account', 'DELETE');
    showAlert('Account deleted successfully. Redirecting to home...', 'success');
    setTimeout(() => {
      logout();
    }, 1500);
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

// Helper functions
function getStatusBadgeClass(status) {
  switch (status) {
    case 'Completed': return 'success';
    case 'Processing': return 'warning';
    default: return 'info';
  }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('profileModal');
  if (e.target === modal) {
    closeProfileModal();
  }
});
