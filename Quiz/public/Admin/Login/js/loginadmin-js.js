document.getElementById("signin-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    const username = document.getElementById("username-field").value;
    const password = document.getElementById("password-field").value;
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        if (result.success) {  
            if(!result.identify)
            {
                document.getElementById('errorMessage').textContent ='Account is not authorized';
            }
            else { 
                localStorage.setItem('tokenAdmin', result.token);
                const params = new URLSearchParams(window.location.search);
                const redirectUrlAd = params.get('redirectAdmin');
                if (redirectUrlAd) {
                window.location.href = redirectUrlAd; 
                } else {
                    window.location.href = '/admin/home';
                }                  
            }
        } else {
            document.getElementById('errorMessage').textContent = result.message || 'Đã xảy ra lỗi';
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Đã xảy ra lỗi khi đăng nhập.");
    }
});