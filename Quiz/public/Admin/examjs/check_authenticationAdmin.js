export async function checkTokenAndExecute(callback) {
    const tokenAdmin = localStorage.getItem('tokenAdmin');
    
    // Kiểm tra xem token có tồn tại không
    if (!tokenAdmin) {
        alert('Token không tồn tại. Vui lòng đăng nhập lại.');
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/admin/login?redirectAdmin=${encodeURIComponent(currentUrl)}`;
        return;
    }
    try {
        const response = await fetch('/api/auth/authAdmin', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenAdmin}`
            }
        });

        if (!response.ok) {
            // Kiểm tra mã lỗi 401 hoặc 403
            if (response.status === 401 || response.status === 403) {
                throw new Error('Hết phiên sử dụng. Vui lòng đăng nhập lại.');
            } else {
                throw new Error('Lỗi không xác định khi kiểm tra token.');
            }
        }

        const data = await response.json();
        console.log('Token hợp lệ:', data.message);

        if (typeof callback === 'function') {
            callback(); // Gọi callback nếu token hợp lệ
        }
    } catch (error) {
        alert(error.message);
        window.location.href = '/admin/login'; // Chuyển hướng đến trang đăng nhập
    }
}
