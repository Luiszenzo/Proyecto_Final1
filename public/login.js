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
            const response = await fetch('http://localhost:3002/login', {
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
            const response = await fetch('http://localhost:3002/verify-mfa', {
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