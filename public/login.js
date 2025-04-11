document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const mfaContainer = document.getElementById('mfaContainer');
    const verifyMfaBtn = document.getElementById('verifyMfaBtn');
    const messageDiv = document.getElementById('message');
    
    let authToken = '';
    let mfaSecret = '';
    
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
});

// Add these at the top with other DOM elements
const forgotPasswordLink = document.getElementById('forgotPassword');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const resetMfaContainer = document.getElementById('resetMfaContainer');
const verifyResetMfaBtn = document.getElementById('verifyResetMfaBtn');
const newPasswordForm = document.getElementById('newPasswordForm');
const savePasswordBtn = document.getElementById('savePasswordBtn');

let resetToken = '';

// Add forgot password click handler
forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    loginForm.classList.add('hidden');
    resetPasswordForm.classList.remove('hidden');
});

// Add reset password form submit
resetPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('resetUsername').value;
    
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
            resetPasswordForm.classList.add('hidden');  
            resetMfaContainer.classList.remove('hidden');
            showMessage(data.message, 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Error al solicitar recuperación de contraseña', 'error');
        console.error('Password reset error:', error);
    }
});

// Add MFA verification for password reset
verifyResetMfaBtn.addEventListener('click', async function() {
    const mfaCode = document.getElementById('resetMfaCode').value;
    
    if (!mfaCode) {
        showMessage('Por favor ingresa el código de verificación', 'error');
        return;
    }
    
    try {
        const response = await fetch('https://proyecto-final1-rkc0.onrender.com/verify-mfa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': resetToken,
                'x-mfa-code': mfaCode
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resetMfaContainer.classList.add('hidden');
            newPasswordForm.classList.remove('hidden');
            showMessage('Verificación exitosa. Ahora puedes establecer una nueva contraseña.', 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Error al verificar el código MFA', 'error');
        console.error('MFA verification error:', error);
    }
});

// Add new password form submit
savePasswordBtn.addEventListener('click', async function() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
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
                mfaCode: document.getElementById('resetMfaCode').value,
                newPassword 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Error al actualizar la contraseña', 'error');
        console.error('Password update error:', error);
    }
});