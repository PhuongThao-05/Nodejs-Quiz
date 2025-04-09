function showNotification(message,isSuccess) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeButton = document.getElementById('close-notification');

    notificationMessage.textContent = message;
    notification.style.display = 'block'; // Hiện thông báo
    notification.style.opacity = '1'; // Đặt độ mờ cho thông báo
    notification.style.backgroundColor = isSuccess ? 'rgba(0, 204, 102, 0.95)' : 'rgba(253, 127, 127, 0.95)';
    //Tự động tắt sau 5 giây
    setTimeout(() => {
    notification.style.opacity = '0'; // Giảm độ mờ
    setTimeout(() => {
    notification.style.display = 'none'; // Ẩn thông báo
        }, 500); // Thời gian trễ để ẩn
     }, 5000);

    // Thêm sự kiện cho nút đóng
    closeButton.onclick = () => {
        notification.style.opacity = '0'; // Giảm độ mờ
        setTimeout(() => {
            notification.style.display = 'none'; // Ẩn thông báo
        }, 500); // Thời gian trễ để ẩn
    };
}
