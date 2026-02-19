const otpState = {
  emailOtpVerified: false
};

document.getElementById('userEmail').addEventListener('blur', async () => {
  const email = document.getElementById('userEmail').value.trim();
  const statusDiv = document.getElementById('emailCheckStatus');
  const emailInput = document.getElementById('userEmail');

  if (!email) {
    statusDiv.textContent = '';
    emailInput.style.borderColor = '#ddd';
    return;
  }

  try {
    const response = await apiRequest('/auth/check-email', 'POST', { email });

    if (response.exists) {
      statusDiv.textContent = '❌ Email already exists';
      statusDiv.style.color = '#d32f2f';
      emailInput.style.borderColor = '#d32f2f';
      emailInput.style.backgroundColor = '#ffebee';
    } else {
      statusDiv.textContent = '✓ Email available';
      statusDiv.style.color = '#27ae60';
      emailInput.style.borderColor = '#27ae60';
      emailInput.style.backgroundColor = '#f1f8f6';
    }
  } catch (error) {
    statusDiv.textContent = '';
    emailInput.style.borderColor = '#ddd';
  }
});

// Email field input to reset styling when user edits
document.getElementById('userEmail').addEventListener('input', () => {
  const emailInput = document.getElementById('userEmail');
  const statusDiv = document.getElementById('emailCheckStatus');
  if (emailInput.value !== emailInput.dataset.lastValue) {
    emailInput.style.borderColor = '#ddd';
    emailInput.style.backgroundColor = 'white';
    statusDiv.textContent = '';
  }
  emailInput.dataset.lastValue = emailInput.value;
});

// Phone validation on blur
document.getElementById('userPhone').addEventListener('blur', async () => {
  const phone = document.getElementById('userPhone').value.trim();
  const statusDiv = document.getElementById('phoneCheckStatus');
  const phoneInput = document.getElementById('userPhone');

  if (!phone) {
    statusDiv.textContent = '';
    phoneInput.style.borderColor = '#ddd';
    return;
  }

  try {
    const response = await apiRequest('/auth/check-phone', 'POST', { phone });

    if (response.exists) {
      statusDiv.textContent = '❌ Phone number already exists';
      statusDiv.style.color = '#d32f2f';
      phoneInput.style.borderColor = '#d32f2f';
      phoneInput.style.backgroundColor = '#ffebee';
    } else {
      statusDiv.textContent = '✓ Phone number available';
      statusDiv.style.color = '#27ae60';
      phoneInput.style.borderColor = '#27ae60';
      phoneInput.style.backgroundColor = '#f1f8f6';
    }
  } catch (error) {
    statusDiv.textContent = '';
    phoneInput.style.borderColor = '#ddd';
  }
});

// Phone field input to reset styling when user edits
document.getElementById('userPhone').addEventListener('input', () => {
  const phoneInput = document.getElementById('userPhone');
  const statusDiv = document.getElementById('phoneCheckStatus');
  if (phoneInput.value !== phoneInput.dataset.lastValue) {
    phoneInput.style.borderColor = '#ddd';
    phoneInput.style.backgroundColor = 'white';
    statusDiv.textContent = '';
  }
  phoneInput.dataset.lastValue = phoneInput.value;
});


document.querySelectorAll('.signup-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;

    document.querySelectorAll('.signup-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    document.querySelectorAll('.signup-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tabName}SignupForm`).classList.add('active');
  });
});

document.getElementById('sendEmailOtp').addEventListener('click', async (e) => {
  e.preventDefault();
  const btn = e.target;
  const email = document.getElementById('userEmail').value;
  const statusDiv = document.getElementById('emailOtpStatus');

  if (!email) {
    statusDiv.textContent = '❌ Please enter email first';
    statusDiv.style.color = '#d32f2f';
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Sending...';
    statusDiv.textContent = '📧 Sending OTP to email...';
    statusDiv.style.color = '#666';

    await apiRequest('/auth/send-otp', 'POST', { email, type: 'email' });

    statusDiv.textContent = '✓ OTP sent to email';
    statusDiv.style.color = '#27ae60';

    // Start 10-second timer
    let timeLeft = 10;
    btn.textContent = `Resend in ${timeLeft}s`;

    const timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        btn.textContent = `Resend in ${timeLeft}s`;
      } else {
        clearInterval(timerInterval);
        btn.textContent = 'Resend OTP';
        btn.disabled = false;
      }
    }, 1000);
  } catch (error) {
    statusDiv.textContent = '❌ ' + error.message;
    statusDiv.style.color = '#d32f2f';
    btn.disabled = false;
    btn.textContent = 'Send OTP';
  }
});



// Verify Email OTP
document.getElementById('verifyEmailOtp').addEventListener('click', async (e) => {
  e.preventDefault();
  const btn = e.target;
  const email = document.getElementById('userEmail').value;
  const otp = document.getElementById('userEmailOtp').value;
  const statusDiv = document.getElementById('emailOtpVerifyStatus');

  if (!otp || otp.length !== 6) {
    statusDiv.textContent = '❌ Please enter a valid 6-digit OTP';
    statusDiv.style.color = '#d32f2f';
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Verifying...';
    statusDiv.textContent = 'Verifying...';
    statusDiv.style.color = '#666';

    await apiRequest('/auth/verify-otp', 'POST', { email, otp, type: 'email' });

    otpState.emailOtpVerified = true;
    statusDiv.textContent = '✓ Email OTP verified successfully';
    statusDiv.style.color = '#27ae60';
    btn.style.background = '#d4edda';
    btn.style.color = '#27ae60';
    btn.textContent = '✓ Email OTP Verified';
    btn.disabled = true;
  } catch (error) {
    statusDiv.textContent = '❌ ' + error.message;
    statusDiv.style.color = '#d32f2f';
    btn.disabled = false;
    btn.textContent = 'Verify Email OTP';
  }
});






// User Signup
document.getElementById('userSignupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  const phone = document.getElementById('userPhone').value;
  const address = document.getElementById('userAddress').value;
  const zone = document.getElementById('userZone').value;
  const password = document.getElementById('userPassword').value;
  const confirmPassword = document.getElementById('userConfirmPassword').value;

  // Validation
  if (!name || !email || !phone || !address || !zone || !password || !confirmPassword) {
    showAlert('Please fill all required fields', 'danger');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'danger');
    return;
  }

  if (password !== confirmPassword) {
    showAlert('Passwords do not match', 'danger');
    return;
  }

  // Check if both OTPs are verified
  if (!otpState.emailOtpVerified) {
    showAlert('Please verify email OTP first', 'danger');
    return;
  }



  try {
    // Create user account after OTPs verified
    await apiRequest('/auth/user-signup', 'POST', {
      name,
      email,
      phone,
      address,
      zone,
      password,
      confirmPassword
    });

    showAlert('Signup successful! Redirecting to login...', 'success');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  } catch (error) {
    showAlert(error.message, 'danger');
  }
});

// Municipality Email OTP state
const munOtpState = {
  emailOtpVerified: false
};

// Send Municipality Email OTP
document.getElementById('sendMunEmailOtp').addEventListener('click', async (e) => {
  e.preventDefault();
  const btn = e.target;
  const email = document.getElementById('munEmail').value;
  const statusDiv = document.getElementById('munEmailOtpStatus');

  if (!email) {
    statusDiv.textContent = '❌ Please enter email first';
    statusDiv.style.color = '#d32f2f';
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Sending...';
    statusDiv.textContent = '📧 Sending OTP to email...';
    statusDiv.style.color = '#666';

    await apiRequest('/auth/send-otp', 'POST', { email, type: 'email' });

    statusDiv.textContent = '✓ OTP sent to email';
    statusDiv.style.color = '#27ae60';

    // Start 10-second timer
    let timeLeft = 10;
    btn.textContent = `Resend in ${timeLeft}s`;

    const timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        btn.textContent = `Resend in ${timeLeft}s`;
      } else {
        clearInterval(timerInterval);
        btn.textContent = 'Resend OTP';
        btn.disabled = false;
      }
    }, 1000);
  } catch (error) {
    statusDiv.textContent = '❌ ' + error.message;
    statusDiv.style.color = '#d32f2f';
    btn.disabled = false;
    btn.textContent = 'Send OTP';
  }
});

// Verify Municipality Email OTP
document.getElementById('verifyMunEmailOtp').addEventListener('click', async (e) => {
  e.preventDefault();
  const btn = e.target;
  const email = document.getElementById('munEmail').value;
  const otp = document.getElementById('munEmailOtp').value;
  const statusDiv = document.getElementById('munEmailOtpVerifyStatus');

  if (!otp || otp.length !== 6) {
    statusDiv.textContent = '❌ Please enter a valid 6-digit OTP';
    statusDiv.style.color = '#d32f2f';
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Verifying...';
    statusDiv.textContent = 'Verifying...';
    statusDiv.style.color = '#666';

    await apiRequest('/auth/verify-otp', 'POST', { email, otp, type: 'email' });

    munOtpState.emailOtpVerified = true;
    statusDiv.textContent = '✓ Email OTP verified successfully';
    statusDiv.style.color = '#27ae60';
    btn.style.background = '#d4edda';
    btn.style.color = '#27ae60';
    btn.textContent = '✓ Email OTP Verified';
    btn.disabled = true;
  } catch (error) {
    statusDiv.textContent = '❌ ' + error.message;
    statusDiv.style.color = '#d32f2f';
    btn.disabled = false;
    btn.textContent = 'Verify Email OTP';
  }
});

// Municipality Email Check
document.getElementById('munEmail').addEventListener('blur', async () => {
  const email = document.getElementById('munEmail').value.trim();
  const statusDiv = document.getElementById('munEmailCheckStatus');
  const emailInput = document.getElementById('munEmail');

  if (!email) {
    statusDiv.textContent = '';
    emailInput.style.borderColor = '#ddd';
    return;
  }

  try {
    const response = await apiRequest('/auth/check-email', 'POST', { email });

    if (response.exists) {
      statusDiv.textContent = '❌ Email already exists';
      statusDiv.style.color = '#d32f2f';
      emailInput.style.borderColor = '#d32f2f';
      emailInput.style.backgroundColor = '#ffebee';
    } else {
      statusDiv.textContent = '✓ Email available';
      statusDiv.style.color = '#27ae60';
      emailInput.style.borderColor = '#27ae60';
      emailInput.style.backgroundColor = '#f1f8f6';
    }
  } catch (error) {
    statusDiv.textContent = '';
    emailInput.style.borderColor = '#ddd';
  }
});

// Municipality Email field input to reset styling
document.getElementById('munEmail').addEventListener('input', () => {
  const emailInput = document.getElementById('munEmail');
  const statusDiv = document.getElementById('munEmailCheckStatus');
  if (emailInput.value !== emailInput.dataset.lastValue) {
    emailInput.style.borderColor = '#ddd';
    emailInput.style.backgroundColor = 'white';
    statusDiv.textContent = '';
  }
  emailInput.dataset.lastValue = emailInput.value;
});

// Municipality Signup
document.getElementById('municipalitySignupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('munName').value;
  const regNumber = document.getElementById('munRegNumber').value;
  const location = document.getElementById('munLocation').value;
  const email = document.getElementById('munEmail').value;
  const password = document.getElementById('munPassword').value;
  const confirmPassword = document.getElementById('munConfirmPassword').value;

  // Validation
  if (!name || !regNumber || !location || !email || !password || !confirmPassword) {
    showAlert('Please fill all required fields', 'danger');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'danger');
    return;
  }

  if (password !== confirmPassword) {
    showAlert('Passwords do not match', 'danger');
    return;
  }

  // Check if email OTP is verified
  if (!munOtpState.emailOtpVerified) {
    showAlert('Please verify email OTP first', 'danger');
    return;
  }

  try {
    // Create municipality account after OTP verified
    await apiRequest('/auth/municipality-signup', 'POST', {
      name,
      email,
      password,
      confirmPassword,
      regNumber,
      location
    });

    showAlert('Signup successful! Redirecting to login...', 'success');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  } catch (error) {
    showAlert(error.message, 'danger');
  }
});
