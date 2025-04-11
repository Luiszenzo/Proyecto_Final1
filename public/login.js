document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const mfaContainer = document.getElementById('mfaContainer');
    const verifyMfaBtn = document.getElementById('verifyMfaBtn');
    const messageDiv = document.getElementById('message');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    
    let authToken = '';
    let mfaSecret = '';
    let resetToken = '';
    
    // Add password recovery form
    const recoveryForm = document.createElement('div');
    recoveryForm.className = 'hidden';
    recoveryForm.id = 'recoveryForm';
    recoveryForm.innerHTML = `
        <h2>Password Recovery</h2>
        <div class="form-group">
            <label for="recoveryUsername">Username</label>
            <input type="text" id="recoveryUsername" required>
        </div>
        <button id="requestRecoveryBtn" class="btn">Request Recovery</button>
        <div id="recoveryMfaContainer" class="hidden">
            <div class="form-group">
                <label for="recoveryMfaCode">Verification Code</label>
                <input type="text" id="recoveryMfaCode" required>
            </div>
            <div class="form-group">
                <label for="newPassword">New Password</label>
                <input type="password" id="newPassword" required>
            </div>
            <button id="completeRecoveryBtn" class="btn">Reset Password</button>
        </div>
        <button id="backToLoginBtn" class="btn secondary">Back to Login</button>
    `;
    document.querySelector('.form-container').appendChild(recoveryForm);
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            // Updated API URL to use the deployed Render URL
            const response = await fetch('https://proyecto-final1-rkc0.onrender.com/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and MFA secret
                authToken = data.token;
                mfaSecret = data.mfaSecret;
                
                // Show MFA verification form
                loginForm.classList.add('hidden');
                mfaContainer.classList.remove('hidden');
                
                // Add QR code display or email option
                const mfaOptionsDiv = document.createElement('div');
                mfaOptionsDiv.className = 'mfa-options';
                
                // Generate QR code URL if we have the secret
                if (mfaSecret) {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/YourApp?secret=${mfaSecret}`;
                    mfaOptionsDiv.innerHTML += `
                        <div class="qr-section">
                            <h3>Escanear código QR:</h3>
                            <img src="${qrUrl}" alt="MFA QR Code" class="qr-code">
                            <p>Usa tu aplicación de autenticación para escanear este código</p>
                        </div>
                    `;
                }
                
                if (data.emailSent) {
                    mfaOptionsDiv.innerHTML += `
                        <div class="email-section">
                            <h3>Se ha enviado un código a tu correo electrónico</h3>
                            <p>Por favor revisa tu bandeja de entrada.</p>
                        </div>
                    `;
                }
                
                // Insert before the input field
                const mfaInput = document.getElementById('mfaCode');
                mfaInput.parentNode.insertBefore(mfaOptionsDiv, mfaInput);
                
                showMessage(data.message, 'success');
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', 'error');
            console.error('Login error:', error);
        }
    });
    
    verifyMfaBtn.addEventListener('click', async function() {
        const mfaCode = document.getElementById('mfaCode').value;
        
        if (!mfaCode) {
            showMessage('Please enter the verification code', 'error');
            return;
        }
        
        try {
            // Updated API URL to use the deployed Render URL
            const response = await fetch('https://proyecto-final1-rkc0.onrender.com/verify-mfa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken,
                    'x-mfa-code': mfaCode
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('Login successful! Redirecting...', 'success');
                // Store token in localStorage for future authenticated requests
                localStorage.setItem('authToken', authToken);
                
                // Redirect to dashboard or home page after successful login
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage('An error occurred during MFA verification.', 'error');
            console.error('MFA verification error:', error);
        }
    });
    
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = 'message';
        messageDiv.classList.add(type);
    }

    // Password recovery functionality
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        recoveryForm.classList.remove('hidden');
    });

    document.getElementById('backToLoginBtn').addEventListener('click', function() {
        recoveryForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    document.getElementById('requestRecoveryBtn').addEventListener('click', async function() {
        const username = document.getElementById('recoveryUsername').value;
        
        if (!username) {
            showMessage('Please enter your username', 'error');
            return;
        }
    
        try {
            const response = await fetch('https://proyecto-final1-rkc0.onrender.com/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                resetToken = data.resetToken;
                const mfaContainer = document.getElementById('recoveryMfaContainer');
                mfaContainer.classList.remove('hidden');
                
                // Clear previous QR code if any
                const existingQr = document.querySelector('.recovery-qr-section');
                if (existingQr) {
                    existingQr.remove();
                }
                
                // Add QR code display
                const qrSection = document.createElement('div');
                qrSection.className = 'recovery-qr-section';
                qrSection.innerHTML = `
                    <h3>Escanear código QR:</h3>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/PasswordReset?secret=${data.mfaCode}" 
                         alt="MFA QR Code" class="recovery-qr-code">
                    <p>Usa tu aplicación de autenticación para escanear este código</p>
                    
                    <div class="recovery-mfa-code">
                        <h3>O ingresa manualmente:</h3>
                        <div class="code">${data.mfaCode}</div>
                        <p>Este código es válido por 30 segundos</p>
                    </div>
                `;
                
                mfaContainer.insertBefore(qrSection, mfaContainer.firstChild);
                showMessage(data.message, 'success');
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', 'error');
            console.error('Recovery request error:', error);
        }
    });

    document.getElementById('completeRecoveryBtn').addEventListener('click', async function() {
        const mfaCode = document.getElementById('recoveryMfaCode').value;
        const newPassword = document.getElementById('newPassword').value;
        
        if (!mfaCode || !newPassword) {
            showMessage('Please enter both the verification code and new password', 'error');
            return;
        }

        try {
            const response = await fetch('https://proyecto-final1-rkc0.onrender.com/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    resetToken,
                    mfaCode,
                    newPassword 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage(data.message, 'success');
                setTimeout(() => {
                    recoveryForm.classList.add('hidden');
                    document.getElementById('recoveryMfaContainer').classList.add('hidden');
                    loginForm.classList.remove('hidden');
                }, 1500);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage('An error occurred during password reset.', 'error');
            console.error('Password reset error:', error);
        }
    });
});
