console.log("School loading")
// Tải danh sách trường học từ file JSON
async function loadSchools(trinhdo) {
   
        let url = '';

        // Xác định đường dẫn tệp JSON dựa trên trình độ
        if (trinhdo === 'Đại học') {
            url = 'DH.json'; // Đường dẫn đến tệp JSON danh sách trường đại học
        } else if (trinhdo === 'Trung học phổ thông') {
            url = 'THPT.json'; // Đường dẫn đến tệp JSON danh sách trường trung học phổ thông
        } else {
            url = 'THCS.json'; // Đường dẫn đến tệp JSON danh sách trường trung học cơ sở
        } 
        
        try {
        const response = await fetch(url); // Thay đổi đường dẫn nếu cần
        const schools = await response.json();
        const schoolSelect = document.getElementById('truong');

        // Xóa các tùy chọn cũ trong dropdown
        schoolSelect.innerHTML = '';

        schools.forEach(school => {
            const option = document.createElement('option');
            option.value = school; // Sử dụng trực tiếp giá trị từ JSON
            option.textContent = school; // Sử dụng trực tiếp giá trị từ JSON
            schoolSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading schools:', error);
    }
}

// Gọi hàm để tải trường khi trang được tải
window.onload = loadSchools;
