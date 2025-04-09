function checkAuthentication() {
    const token = localStorage.getItem('token'); 
    const identify = localStorage.getItem('identify'); 

    if (!token || identify === 'true') {
        console.error('User not authenticated'); 
        const currentUrl = window.location.pathname + window.location.search;
		window.location.href = `/user/login?redirect=${encodeURIComponent(currentUrl)}`;
    }
}
checkAuthentication();