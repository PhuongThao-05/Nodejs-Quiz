import { checkTokenAndExecute } from './check_authentication.js';
// Chuyển đổi giữa các tab
function switchTab() {
    const tabs = document.querySelectorAll('.tab');
    const containers = document.querySelectorAll('.container');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Xóa class active khỏi tất cả các tab
            tabs.forEach((t, i) => {
                t.classList.remove('active');
                containers[i].classList.remove('active');
            });

            // Thêm class active cho tab và container đã chọn
            tab.classList.add('active');
            containers[index].classList.add('active');
        });
    });
}

// Tải danh sách trường học từ file JSON
async function loadSchools(trinhdo) {
    let url = '';
    // Xác định đường dẫn tệp JSON dựa trên trình độ
    if (trinhdo === 'Đại học') {
        url = '/User/DH.json'; // Đường dẫn đến tệp JSON danh sách trường đại học
    } else if (trinhdo === 'Trung học phổ thông') {
        url = '/User/THPT.json'; // Đường dẫn đến tệp JSON danh sách trường trung học phổ thông
    } else {
        url = '/User/THCS.json'; // Đường dẫn đến tệp JSON danh sách trường trung học cơ sở
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

const selectElement = document.getElementById("trinhdo");
    selectElement.addEventListener("change", (event) => {
        const selectedValue = event.target.value; // Lấy giá trị được chọn
        loadSchools(selectedValue);
    });

const returnTopicBtn = document.querySelector('.btn-returntopic');
    returnTopicBtn.addEventListener('click', (e) => {
// Danh sách các key mà bạn không muốn xóa
const keysToKeep = ['token', 'userInfo'];
// Lưu lại các key trong localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
const key = localStorage.key(i);
// Kiểm tra xem key có trong danh sách giữ lại hay không
if (!keysToKeep.includes(key)) {
    keysToRemove.push(key);
}
}
// Xóa các key không cần thiết
keysToRemove.forEach(key => {
localStorage.removeItem(key);
});                 
createdExamId = null;
document.getElementById('createButton').style.display = 'block';
document.getElementById('updateButton').style.display = 'none';
});

function getTopicIdFromUrl() {
    const pathSegments = window.location.pathname.split('/');
    return pathSegments[pathSegments.length - 1]; // ID là phần cuối của URL
}

const token = localStorage.getItem('token');
// Gọi API để lấy thông tin đề thi và hiển thị trong form
async function loadTopicInfo() {
    try {
        const response = await
        fetch(`/api/de/gettopics/${getTopicIdFromUrl()}`, {
                                method: 'GET',
                                headers: { 
                                    'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                                }
                            });
        const topic = await response.json();

        if (topic && topic.data) {
            // Điền thông tin vào các trường
            document.getElementById('tende').value = topic.data.tende;
            document.getElementById('monhoc').value = topic.data.monhoc;
            document.getElementById('trinhdo').value = topic.data.trinhdo;
            await loadSchools(topic.data.trinhdo);                        
            // Gán giá trị cho trường học
            const schoolSelect = document.getElementById('truong');
            const schoolValue = topic.data.truong; // Cập nhật để lấy đúng giá trị
            console.log('Giá trị trường học:', schoolValue); // Kiểm tra giá trị trường học
            schoolSelect.value = schoolValue; // Gán giá trị vào select
        }
    } catch (error) {
        console.error('Lỗi khi tải thông tin đề thi:', error);
    }
}

// Gọi hàm loadTopicInfo khi trang được tải
window.onload = () => {
    checkTokenAndExecute(loadTopicInfo); // Gọi hàm để lấy và hiển thị thông tin đề
    checkTokenAndExecute(fetchYears);  
    switchTab();  
    document.getElementById('updateButton').addEventListener('click', updateTopic);                   
};
async function updateTopic() {
    const topicId = getTopicIdFromUrl(); // Lấy ID từ URL
    const tende = document.getElementById('tende').value;
    const monhoc = document.getElementById('monhoc').value;
    const trinhdo = document.getElementById('trinhdo').value;
    const truong = document.getElementById('truong').value;

    // Kiểm tra nếu ID không tồn tại
    if (!topicId) {
        alert("Không tìm thấy mã đề.");
        return;
    }

    try {
        const response = await fetch(`/api/de/updatetopic/${topicId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ tende, monhoc, trinhdo, truong })
        });

        const result = await response.json();
        if (result.success) {
            showNotification("Đã cập nhật đề thi thành công",true);
    
        } else {
            showNotification("Cập nhật thất bại: " + result.message,false);
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật:", error);
        showNotification("Đã xảy ra lỗi khi cập nhật",false);
    }
};                   
async function fetchYears() {
const response = await fetch('/api/figure/yeartostatistic',{
    method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
});
const result = await response.json(); // Dữ liệu trả về

const years = result.data || []; // Lấy mảng từ thuộc tính 'data', nếu không có thì mặc định là mảng rỗng

// Kiểm tra nếu years không phải là mảng thì không làm gì
if (!Array.isArray(years)) {
    console.error('Dữ liệu trả về không phải là mảng');
    return;
}

const selectYear = document.getElementById('selectYear');
// Thêm các năm vào dropdown
years.forEach(year => {
    const option = document.createElement('option');
    option.value = year.nam;  
    option.textContent = year.nam; 
    selectYear.appendChild(option);
});
if (years.length > 0) {
    const firstYear = years[0].nam;  // Lấy năm đầu tiên trong mảng
    selectYear.value = firstYear; // Chọn năm đầu tiên trong dropdown
    StatisticWithTopic(firstYear); // Gửi yêu cầu thống kê với năm đầu tiên
} else {
    console.error("Dữ liệu năm không có sẵn!");
}
// Thêm sự kiện khi người dùng chọn năm
selectYear.addEventListener('change', () => {
    const selectedYear = selectYear.value;
    StatisticWithTopic(selectedYear); // Truyền năm đã chọn
});
}
async function StatisticWithTopic(selectedYear) {
    const topicId = getTopicIdFromUrl(); // Lấy ID từ URL
    if (!topicId) {
        alert("Không tìm thấy mã đề.");
        return;
    }

    try {
        const response = await fetch(`/api/figure/databymonth/${topicId}?year=${selectedYear}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });

        const result = await response.json();
        console.log(result.data);
        if (result.success&&result.data) {
            const labels = result.data.map(data => `${data.nam}-${String(data.thang).padStart(2, '0')}`); // Dạng "YYYY-MM"
            const luotThi = result.data.map(data => data.luotthi);
            const luotTai = result.data.map(data => data.luottai);

            const config = {
            type: 'line',
            data: {
                labels: labels, // Trục X - các tháng
                datasets: [
                    {
                        label: 'Tổng lượt thi',
                        data: luotThi, // Dữ liệu lượt thi
                        fill: true, // Tô màu dưới đường
                        pointRadius: 10, // Kích thước của các điểm đánh dấu khi không hover
                        pointHoverRadius: 20,
                        backgroundColor: 'rgba(153, 204, 255, 0.4)',
                        borderColor: 'rgba(153, 204, 255, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Tổng lượt tải',
                        data: luotTai, // Dữ liệu lượt tải
                        fill: true, // Tô màu dưới đường
                        pointRadius: 10, // Kích thước của các điểm đánh dấu khi không hover
                        pointHoverRadius: 20,
                        backgroundColor: 'rgba(255, 153, 153, 0.4)',
                        borderColor: 'rgba(255, 153, 153, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Thời gian (Tháng)'}
                    },
                    y: {
                        title: { display: true, text: 'Số lượng' },
                        min: 0, 
                        ticks: {
                            beginAtZero: true, 
                            stepSize: 1 
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        };
        if (window.myChart && typeof window.myChart.destroy === 'function') {
            window.myChart.destroy();
        }
        const ctx = document.getElementById('myChart').getContext('2d');
        window.myChart = new Chart(ctx, config);
                        
        } else {
            console.log("Error: " + result.message);
        }
    } catch (error) {
        console.error("Có lỗi:", error);
    }
}
