const API_BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getUserType() {
  return localStorage.getItem('userType');
}

function getUserId() {
  return localStorage.getItem('userId') || localStorage.getItem('municipalityId');
}

async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'API Error');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

async function apiRequestFormData(endpoint, method = 'POST', formData) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'API Error');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login';
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('userId');
  localStorage.removeItem('municipalityId');
  window.location.href = '/';
}

// Show alert message
function showAlert(message, type = 'success') {
  // some pages use "errorAlert" for danger instead of "dangerAlert";
  // look up either id and fall back to creating a div if necessary.
  const desiredId = type === 'danger' ? 'errorAlert' : `${type}Alert`;
  let alertElement = document.getElementById(desiredId);
  if (!alertElement) {
    alertElement = document.createElement('div');
    alertElement.id = desiredId;
    // put at top of body so it's visible on all layouts
    document.body.prepend(alertElement);
  }

  alertElement.textContent = message;
  alertElement.className = `alert alert-${type} show`;
  alertElement.style.display = 'block';

  setTimeout(() => {
    alertElement.classList.remove('show');
    alertElement.style.display = 'none';
  }, 5000);
}

// Get geolocation
function getGeolocation() {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        error => {
          reject(error);
        }
      );
    } else {
      reject(new Error('Geolocation is not supported by this browser'));
    }
  });
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Get map link
function getMapLink(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
