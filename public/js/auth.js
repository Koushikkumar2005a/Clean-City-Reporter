document.querySelectorAll('.login-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tabName}LoginForm`).classList.add('active');
  });
});

document.getElementById('userLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('userEmail').value;
  const password = document.getElementById('userPassword').value;

  try {
    const response = await apiRequest('/auth/user-login', 'POST', {
      email,
      password
    });

    localStorage.setItem('token', response.token);
    localStorage.setItem('userType', 'user');
    localStorage.setItem('userId', response.userId);

    showAlert('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = '/user-dashboard';
    }, 1000);
  } catch (error) {
    // custom messages
    let msg;
    if (/blocked/i.test(error.message)) {
      msg = 'You are blocked by admin';
    } else if (/invalid|incorrect|wrong/i.test(error.message)) {
      msg = 'Wrong email or password';
    } else {
      msg = error.message;
    }
    showAlert(msg, 'danger');
  }
});

// Municipality Login
document.getElementById('municipalityLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('munEmail').value;
  const password = document.getElementById('munPassword').value;

  try {
    const response = await apiRequest('/auth/municipality-login', 'POST', {
      email,
      password
    });

    localStorage.setItem('token', response.token);
    localStorage.setItem('userType', 'municipality');
    localStorage.setItem('municipalityId', response.municipalityId);

    showAlert('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = '/municipality-dashboard';
    }, 1000);
  } catch (error) {
    let msg;
    if (/blocked/i.test(error.message)) {
      msg = 'You are blocked by admin';
    } else if (/invalid|incorrect|wrong/i.test(error.message)) {
      msg = 'Wrong email or password';
    } else {
      msg = error.message;
    }
    showAlert(msg, 'danger');
  }
});
