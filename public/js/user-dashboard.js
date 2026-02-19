// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  
  if (getUserType() !== 'user') {
    window.location.href = '/';
  }

  loadUserProfile();
  loadComplaints();
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

  // Register complaint form
  document.getElementById('registerComplaintForm').addEventListener('submit', handleRegisterComplaint);

  // Get location buttons
  document.getElementById('getComplaintLocation').addEventListener('click', getComplaintLocation);

  // Image uploads
  setupImageUpload('uploadArea', 'complaintImage', 'imagePreview');
  setupImageUpload('profileUploadArea', 'profileImageInput', null);

  // Edit image button
  const editBtn = document.getElementById('editImageBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const input = document.getElementById('complaintImage');
      input.value = '';
      document.getElementById('imagePreview').style.display = 'none';
      editBtn.style.display = 'none';
      document.getElementById('uploadArea').style.display = 'block';
    });
  }

  // Profile edit form
  document.getElementById('profileEditForm').addEventListener('submit', handleProfileUpdate);
}

// Show specific view
function showView(viewName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`${viewName}-view`).classList.add('active');

  // Load data based on view
  if (viewName === 'complaints') {
    loadComplaints();
  } else if (viewName === 'status') {
    loadComplaintStatus();
  } else if (viewName === 'history') {
    loadComplaintHistory();
  }
}

// Load user profile
let currentUserZone = ''; // will store zone for complaints

async function loadUserProfile() {
  try {
    const user = await apiRequest('/user/profile');
    document.getElementById('userWelcome').textContent = `Welcome, ${user.name}`;
    if (user.zone) {
      currentUserZone = user.zone;
    }

    // Update profile pictures
    if (user.profilePicture) {
      const profilePic = `/uploads/${user.profilePicture}`;
      // Small profile pic
      const smallPic = document.getElementById('profilePicSmall');
      smallPic.innerHTML = `<img src="${profilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      // Large profile pic
      const largePic = document.getElementById('profilePicLarge');
      largePic.innerHTML = `<img src="${profilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    }

    // Display current profile info
    displayProfileInfo(user);

    // Pre-fill edit form
    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone;
    document.getElementById('editAddress').value = user.address;
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Display profile info
function displayProfileInfo(user) {
  const profileInfo = document.getElementById('profileInfo');
  profileInfo.innerHTML = `
    <div style="background: #f0f8f5; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${user.phone}</p>
      <p><strong>Address:</strong> ${user.address}</p>
      <p><strong>Zone:</strong> ${user.zone}</p>
      ${user.latitude && user.longitude ? `<p><strong>Location:</strong> <a href="${getMapLink(user.latitude, user.longitude)}" target="_blank">View on Map</a></p>` : ''}
      <p style="font-size: 0.85rem; color: #666; margin-top: 1rem;">Account Status: <span style="color: ${user.isBlocked ? '#e74c3c' : '#27ae60'};">${user.isBlocked ? '🔒 Blocked' : '✅ Active'}</span></p>
    </div>
  `;
}

// Load all complaints
async function loadComplaints() {
  try {
    const complaints = await apiRequest('/complaint/my-complaints');
    const list = document.getElementById('complaintsList');
    
    if (complaints.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">No complaints registered yet.</p>';
      return;
    }

    list.innerHTML = complaints.map(complaint => `
      <div class="complaint-card">
        <div class="complaint-header">
          <h3 style="margin: 0; color: #27ae60;">Complaint #${complaint._id.slice(-6)}</h3>
          <span class="badge badge-${getStatusBadgeClass(complaint.status)}">${complaint.status}</span>
        </div>
        <p style="margin: 0.5rem 0; color: #666;" class="complaint-date">${formatDate(complaint.createdAt)}</p>
        <p style="margin: 1rem 0;">${complaint.description}</p>
        ${complaint.image ? `<img src="/uploads/${complaint.image}" alt="Complaint">` : ''}
        <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">
          📍 <a href="${getMapLink(complaint.latitude, complaint.longitude)}" target="_blank">View Location</a>
        </p>
      </div>
    `).join('');
  } catch (error) {
    showAlert('Error loading complaints', 'danger');
    console.error(error);
  }
}

// Load complaint status
async function loadComplaintStatus() {
  try {
    const complaints = await apiRequest('/complaint/my-complaints');
    const list = document.getElementById('statusList');
    
    if (complaints.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">No complaints to track.</p>';
      return;
    }

    list.innerHTML = complaints.map(complaint => {
      // determine assignment display name
      let assignedName = '';
      if (complaint.assignedTo) {
        if (typeof complaint.assignedTo === 'string') {
          assignedName = complaint.assignedTo;
        } else if (complaint.assignedTo.name) {
          assignedName = complaint.assignedTo.name;
        } else {
          // fallback to any serialisable value
          try {
            assignedName = JSON.stringify(complaint.assignedTo);
          } catch {
            assignedName = '';
          }
        }
      }

      return `
      <div class="complaint-card">
        <div class="complaint-header">
          <div>
            <h3 style="margin: 0; color: #27ae60;">Complaint #${complaint._id.slice(-6)}</h3>
            <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">${formatDate(complaint.createdAt)}</p>
          </div>
          <span class="badge badge-${getStatusBadgeClass(complaint.status)}">${complaint.status}</span>
        </div>
        <p style="margin: 1rem 0;">${complaint.description}</p>
        <div style="background: ${getStatusColor(complaint.status)}; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
          <strong>Current Status:</strong> ${complaint.status}
          ${assignedName ? `<p style="margin-top: 0.5rem;">Assigned to: ${assignedName}</p>` : ''}
        </div>
      </div>
    `;
    }).join('');
  } catch (error) {
    showAlert('Error loading complaint status', 'danger');
    console.error(error);
  }
}

// Load complaint history
async function loadComplaintHistory() {
  try {
    const complaints = await apiRequest('/complaint/my-complaints');
    const solvedComplaints = complaints.filter(c => c.status === 'Completed');
    const list = document.getElementById('historyList');
    
    if (solvedComplaints.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">No solved complaints yet.</p>';
      return;
    }

    list.innerHTML = solvedComplaints.map(complaint => `
      <div class="complaint-card" style="border-left-color: #28a745;">
        <div class="complaint-header">
          <h3 style="margin: 0; color: #28a745;">✓ Complaint #${complaint._id.slice(-6)}</h3>
          <span class="badge badge-success">Completed</span>
        </div>
        <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">Reported: ${formatDate(complaint.createdAt)}</p>
        <p style="margin: 1rem 0;">${complaint.description}</p>
        ${complaint.image ? `<img src="/uploads/${complaint.image}" alt="Complaint">` : ''}
      </div>
    `).join('');
  } catch (error) {
    showAlert('Error loading history', 'danger');
    console.error(error);
  }
}

// Handle register complaint
async function handleRegisterComplaint(e) {
  e.preventDefault();

  const fileInput = document.getElementById('complaintImage');
  const description = document.getElementById('complaintDescription').value;
  const latitude = document.getElementById('complaintLatitude').value;
  const longitude = document.getElementById('complaintLongitude').value;

  // Basic validation for required fields (image and location remain required)
  if (!fileInput.files[0]) {
    showAlert('❌ Image is required. Please upload a complaint photo.', 'danger');
    document.getElementById('uploadArea').style.borderColor = '#d32f2f';
    return;
  }

  if (!latitude || !longitude) {
    showAlert('❌ Location is required. Please click "Get Current Location" button.', 'danger');
    document.getElementById('getComplaintLocation').style.borderColor = '#d32f2f';
    return;
  }

  try {
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('description', description);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    if (currentUserZone) {
      formData.append('zone', currentUserZone);
    }

    const response = await apiRequestFormData('/complaint/register', 'POST', formData);
    showAlert('Complaint registered successfully!', 'success');
    
    document.getElementById('registerComplaintForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) uploadArea.style.display = 'block';
    const editBtn = document.getElementById('editImageBtn');
    if (editBtn) editBtn.style.display = 'none';
    const coordsDiv = document.getElementById('locationCoords');
    if (coordsDiv) coordsDiv.textContent = '';
    document.getElementById('getComplaintLocation').classList.remove('active');
    document.getElementById('getComplaintLocation').textContent = '📍 Get Current Location';
    document.getElementById('getComplaintLocation').style.borderColor = '#ddd';
    
    setTimeout(() => {
      showView('complaints');
      document.querySelector('.menu-link[data-view="complaints"]').click();
    }, 1000);
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

// Get complaint location
async function getComplaintLocation(e) {
  e.preventDefault();
  const btn = e.target;
  const coordsDiv = document.getElementById('locationCoords');

  try {
    btn.disabled = true;
    btn.textContent = '📍 Getting Location...';

    const location = await getGeolocation();
    
    document.getElementById('complaintLatitude').value = location.latitude;
    document.getElementById('complaintLongitude').value = location.longitude;

    btn.classList.add('active');
    btn.textContent = '✓ Location Captured';
    btn.style.borderColor = '#27ae60';
    if (coordsDiv) coordsDiv.textContent = `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  } catch (error) {
    btn.style.borderColor = '#d32f2f';
    showAlert('Could not get location: ' + error.message, 'danger');
  } finally {
    btn.disabled = false;
  }
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
  const preview = document.getElementById(previewId);
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      // hide upload area and show edit button
      const uploadArea = document.getElementById('uploadArea');
      if (uploadArea) uploadArea.style.display = 'none';
      const editBtn = document.getElementById('editImageBtn');
      if (editBtn) editBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Handle profile update
async function handleProfileUpdate(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('name', document.getElementById('editName').value);
  formData.append('email', document.getElementById('editEmail').value);
  formData.append('phone', document.getElementById('editPhone').value);
  formData.append('address', document.getElementById('editAddress').value);

  const fileInput = document.getElementById('profileImageInput');
  if (fileInput.files[0]) {
    formData.append('profilePicture', fileInput.files[0]);
  }

  try {
    const response = await apiRequestFormData('/user/profile', 'PUT', formData);
    showAlert('Profile updated successfully!', 'success');
    toggleEditMode();
    loadUserProfile();
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
    await apiRequest('/user/delete-account', 'DELETE');
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

function getStatusColor(status) {
  switch (status) {
    case 'Completed': return '#d4edda';
    case 'Processing': return '#fff3cd';
    default: return '#d1ecf1';
  }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('profileModal');
  if (e.target === modal) {
    closeProfileModal();
  }
});
