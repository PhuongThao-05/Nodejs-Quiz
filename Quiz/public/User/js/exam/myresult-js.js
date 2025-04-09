import { checkTokenAndExecute } from './check_authentication.js';

let currentPage = 1;
let itemsPerPage = parseInt(document.getElementById('itemsPerPage').value) || 5;
let totalItems = 0;
let selectedEndDate = '';  // Lưu giá trị endDate được chọn

$(document).ready(function () {
    // Khởi tạo date picker cho endDate
    $('#endDate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true
    }).on('changeDate', function () {
        const selectedDate = $(this).val();  // Lấy giá trị ngày đã chọn
        selectedEndDate = selectedDate;  // Lưu lại ngày đã chọn
        console.log("Ngày đã chọn: ", selectedDate); // In ra ngày đã chọn để kiểm tra
        currentPage = 1;  // Khi thay đổi endDate, luôn quay về trang 1
        fetchResults(selectedDate);  // Gọi hàm fetch với ngày đã chọn và trang 1
    });

    // Xử lý trường hợp người dùng xóa ngày
    $('#endDate').on('clearDate', function () {
        console.log("Ngày đã được xóa.");
        selectedEndDate = '';  // Xóa giá trị endDate khi người dùng xóa
        currentPage = 1;  // Khi xóa endDate, quay về trang 1
        fetchResults();  // Gọi hàm fetch với endDate rỗng và trang 1
    });
});
// Hàm kiểm tra ngày hợp lệ
function isValidDate(dateString) {
    const parts = dateString.split('/');
    if (parts.length !== 3) return false;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;  // Tháng bắt đầu từ 0
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    
    // Kiểm tra nếu ngày đã chọn hợp lệ
    return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
}


async function fetchResults(endDate = selectedEndDate) {  // Sử dụng selectedEndDate nếu endDate không có giá trị
    try {
        if (endDate && !isValidDate(endDate)) {
            alert('Ngày không hợp lệ.');
            return;
        }

        const offset = (currentPage - 1) * itemsPerPage;
        let url = `/api/result/lstres?limit=${itemsPerPage}&offset=${offset}`;

        // Thêm endDate vào query string nếu có
        if (endDate) {
            url += `&endDate=${endDate}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (response.status === 401) {
            alert('Phiên đăng nhập đã hết, vui lòng đăng nhập lại!');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();
        const noDataRow = document.getElementById('no-data');
        const tbody = document.querySelector('.results-table tbody');

        // Xóa dữ liệu cũ trong bảng
        tbody.innerHTML = '';

        if (!data.success || !data.data || data.data.length === 0) {
            if (noDataRow) {
                noDataRow.style.display = 'table-row';  // Hiển thị thông báo không có dữ liệu
            }
        } else {
            totalItems = data.totalItems;
            if (noDataRow) {
                noDataRow.style.display = 'none';  // Ẩn thông báo không có dữ liệu
            }

            // Thêm dữ liệu vào bảng
            data.data.forEach(result => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${result.de.tende}</td>
                    <td>${result.diemso}</td>
                    <td>${result.xeploai}</td>
                    <td>${result.socaudung}</td>
                    <td>${result.socausai}</td>
                    <td>${result.tongsocauhoi}</td>
                    <td>${result.thoigianlambai}</td>
                    <td>${result.thoigianhoanthanhbaithi}</td>
                `;
                tbody.appendChild(row);
            });

            updatePagination();
        }
    } catch (error) {
        console.error('Error fetching results:', error);
    }
}

function updatePagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';  // Clear all current pagination items

    const prevPageItem = document.createElement('li');
    prevPageItem.classList.add('page-item');
    prevPageItem.innerHTML = `<a class="page-link" href="#">&#171;</a>`;
    prevPageItem.classList.toggle('disabled', currentPage === 1);
    prevPageItem.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchResults();
        }
    });

    pagination.appendChild(prevPageItem); // Append previous button

    // Create page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add('page-item');
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.addEventListener('click', () => {
            currentPage = i;
            fetchResults();
        });

        if (i === currentPage) {
            pageItem.classList.add('active');
        }

        pagination.appendChild(pageItem); // Append page number
    }

    // Create next button
    const nextPageItem = document.createElement('li');
    nextPageItem.classList.add('page-item');
    nextPageItem.innerHTML = `<a class="page-link" href="#">&#187;</a>`;
    nextPageItem.classList.toggle('disabled', currentPage === totalPages);
    nextPageItem.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchResults();
        }
    });

    pagination.appendChild(nextPageItem); // Append next button
}

// Khi người dùng thay đổi số lượng hàng mỗi trang
document.getElementById('itemsPerPage').addEventListener('change', (event) => {
    itemsPerPage = parseInt(event.target.value);
    currentPage = 1;  // Khi thay đổi số lượng hàng, quay lại trang 1
    fetchResults();
});

// Khi trang tải, gọi fetchResults
document.addEventListener('DOMContentLoaded', () => {
    checkTokenAndExecute(fetchResults);  // Gọi hàm fetchResults sau khi trang đã tải xong
});