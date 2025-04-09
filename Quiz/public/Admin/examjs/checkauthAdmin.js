function checkAuthentication() {
    const tokenAdmin = localStorage.getItem('tokenAdmin'); 
    if (!tokenAdmin) {
        console.error('User not authenticated'); 
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/admin/login?redirectAdmin=${encodeURIComponent(currentUrl)}`;
    }
}
checkAuthentication();