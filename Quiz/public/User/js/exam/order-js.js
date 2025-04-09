import { checkTokenAndExecute } from './check_authentication.js';
document.addEventListener('DOMContentLoaded', function () {
    const packageDataElement = document.getElementById('packageData');
    const packageupgrade = JSON.parse(packageDataElement.getAttribute('data-package'));
    console.log(packageupgrade);
       if (packageupgrade) {
           document.querySelectorAll('.name-package').forEach(element => {
               element.textContent = `EduQuiz - Cá nhân - ${packageupgrade.tenloaitk}`;
           });
           document.querySelectorAll('.value-package').forEach(element => {
               element.innerHTML = `<span>${packageupgrade.gia.toLocaleString('vi-VN')} VNĐ</span>`;
           });
       if (packageupgrade.tenloaitk.includes("month")) {
           document.getElementById("1-month").checked = true;    
           document.getElementById("3-month").disabled = true;
           document.getElementById("12-month").disabled = true;
           document.getElementById("chuky-payment").textContent = document.getElementById("1-month").value;
       } else if (packageupgrade.tenloaitk.includes("year")) {
           document.getElementById("12-month").checked = true;
           document.getElementById("1-month").disabled = true; 
           document.getElementById("3-month").disabled = true;
           document.getElementById("chuky-payment").textContent = document.getElementById("12-month").value;
       } else if (packageupgrade.tenloaitk.includes("quarter")) {
           document.getElementById("3-month").checked = true;
           document.getElementById("1-month").disabled = true; 
           document.getElementById("12-month").disabled = true; 
           document.getElementById("chuky-payment").textContent = document.getElementById("3-month").value;
       }

        checkTokenAndExecute(document.querySelector('.continue-button').addEventListener('click', async function (e) {
        e.preventDefault(); 
        if (packageupgrade) {
        const amount = packageupgrade.gia; // Lấy số tiền từ packageupgrade
        const accountType = packageupgrade.maloaitk; // Lấy loại tài khoản từ packageupgrade
        const token=localStorage.getItem('token');
        const userinfo=JSON.parse(localStorage.getItem('userInfo'));
        const username=userinfo.username;
        // Gửi yêu cầu tạo URL thanh toán đến server
        const response = await fetch(`/api/payment/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Lấy token từ localStorage
            },
            body: JSON.stringify({ accountType: accountType,username:username, amount: amount,token:token }),
        });

        // Kiểm tra kết quả trả về từ server
        const result = await response.json();

        if (result.success) {
            window.location.href = result.data; // Chuyển hướng đến trang thanh toán ZaloPay
        } else {
            // Xử lý lỗi và hiển thị thông báo từ server
            alert(result.message || 'Đã xảy ra lỗi trong quá trình thanh toán');
        }
    } else {
        console.error('Không tìm thấy thông tin gói trong localStorage.');
    }
    }));
    
    } else {
    console.error('Không tìm thấy thông tin gói.');
    }
});