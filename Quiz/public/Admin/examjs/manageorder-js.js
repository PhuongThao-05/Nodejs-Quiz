import { checkTokenAndExecute } from './check_authenticationAdmin.js';

let ncid=null; 
let currentPage = 1;
let itemsPerPage = parseInt(document.getElementById('itemsPerPage')?.value) || 5;
let totalItems = 0;
let name="";
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('change', (event) => {
                        name = event.target.value.trim();
                        currentPage = 1; 	
                        const offset = (currentPage - 1) * itemsPerPage;
                        LoadUpgradeRequire({ limit: itemsPerPage, offset: offset, name: name});
                    });
async function LoadUpgradeRequire(filter={}) {
    const tokenAdmin = localStorage.getItem('tokenAdmin');
    const offset = (currentPage - 1) * itemsPerPage;
    const params = new URLSearchParams();
    if (filter.name && filter.name.length > 0) {
        params.append('name', filter.name);
    }
    params.append('offset', filter.offset || 0);
    params.append('limit', filter.limit || 5);
    const queryParams = params.toString();
    try {
        const response = await fetch(`/api/upgrade/lstupgr?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenAdmin
            }
        });
        const result = await response.json();
        console.log(result.data);
        if (result.success && result.data) {
            totalItems = result.totalItems;
            console.log(totalItems);
            const tbody = document.querySelector('.table-orders tbody');
            tbody.innerHTML = '';
            result.data.forEach(data => {
                const row = document.createElement('tr');
                row.innerHTML = `
                  <td>${data.orderid}</td>
                  <td>${data.nguoidung.hoten}</td>
                  <td>${data.loaitaikhoan.tenloaitk}</td>
                  <td>${data.loaitaikhoan.gia.toLocaleString('vi-VN')} VNĐ</td>
                  <td>${data.ngaythanhtoan}</td>
                  <td>
                    <input type="checkbox" ${data.xacnhan ? 'checked' : ''} class="custom-checkbox disabled" onclick="return false;" />
                  </td>
                   <td>
                    <a href="/admin/confirm/${data.manc}" data-id="${data.manc}" class="StateButton btn btn-action btn-primary  mr-1 btn-act" data-toggle="tooltip" title="Cập nhật" style="background-color: #33cc33; border: solid 1px #33cc33; box-shadow: 0 2px 6px #99ff99;">
                     <i class="fas fa-pencil-alt" style="font-size: 11px;"></i>
                    </a>
                    <a href="#" data-id="${data.manc}" class="delete-btn btn btn-danger btn-action btn-act" data-toggle="tooltip" title="Xóa" style="background-color: #fc544b; border: solid 1px #fc544b; box-shadow: 0 2px 6px #fd9b96; ">
                     <i class="fas fa-trash"></i>
                    </a>
                  </td>
            `;
                tbody.appendChild(row);
            });
            updatePagination();
        }
        else {
            console.log(result.error);
        }
    }
    catch (error) {
        console.error("Error:", error);
    }
}

function updatePagination() {
const totalPages = Math.ceil(totalItems / itemsPerPage);
const pagination = document.getElementById('pagination');
pagination.innerHTML = '';  // Clear all current pagination items

const prevPageItem = document.createElement('li');
prevPageItem.classList.add('page-item');
prevPageItem.innerHTML = `<a>&#171;</a>`;
prevPageItem.classList.toggle('disabled', currentPage === 1);
prevPageItem.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        LoadUpgradeRequire({ limit: itemsPerPage, offset:(currentPage - 1) * itemsPerPage, name: name});
    }
});

pagination.appendChild(prevPageItem); // Append previous button

// Create page number buttons
for (let i = 1; i <= totalPages; i++) {
    const pageItem = document.createElement('li');
    pageItem.classList.add('page-item');
    pageItem.innerHTML = `<a>${i}</a>`;
    pageItem.addEventListener('click', () => {
        currentPage = i;
        LoadUpgradeRequire({ limit: itemsPerPage, offset:(currentPage - 1) * itemsPerPage, name: name});
    });

    if (i === currentPage) {
        pageItem.classList.add('active');
    }

    pagination.appendChild(pageItem); // Append page number
}

// Create next button
const nextPageItem = document.createElement('li');
nextPageItem.classList.add('page-item');
nextPageItem.innerHTML = `<a>&#187;</a>`;
nextPageItem.classList.toggle('disabled', currentPage === totalPages);
nextPageItem.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        LoadUpgradeRequire({ limit: itemsPerPage, offset:(currentPage - 1) * itemsPerPage, name: name});
    }
});

pagination.appendChild(nextPageItem); // Append next button
}
document.getElementById('itemsPerPage').addEventListener('change', (event) => {
itemsPerPage = parseInt(event.target.value);
currentPage = 1;  // Khi thay đổi số lượng hàng, quay lại trang 1
LoadUpgradeRequire({ limit: itemsPerPage, offset:(currentPage - 1) * itemsPerPage, name: name});
});
//hiển thị modal
$(document).ready(function () {
    $(document).on('click', '.delete-btn', function (event) {
        event.preventDefault();
        ncid = $(this).data('id');
        $('#deleteOrderModal').modal('show');
        document.body.style.paddingRight = '0px'; 
    });
    $('.cancelOrderNo').on('click', function () {
        // Đóng modal popup
        $('#deleteOrderModal').modal('hide');
    });
    $('#deleteOrderModal').on('hidden.bs.modal', function () {
        // Đóng modal popup khi nó được ẩn đi
        $('#deleteOrderModal').modal('hide');
    });
});

async function AcceptDelete() {
    const tokenAdmin = localStorage.getItem('tokenAdmin');
    try {
        const response = await fetch(`/api/upgrade/hideorder/${ncid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenAdmin
            }
        });
        const result = await response.json();
        console.log(result.data);
        if (result.success && result.data) {
            LoadUpgradeRequire({ limit: itemsPerPage, offset:(currentPage - 1) * itemsPerPage, name: name});
            const modal = document.getElementById('deleteOrderModal');
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '0px'; 
        }
        else {
            console.log(result.error);
        }
    }
    catch (error) {
        console.error("Error:", error);
    } 
}
document.getElementById('btnconfirmdel').addEventListener('click',AcceptDelete);
document.addEventListener('DOMContentLoaded', function () {
    checkTokenAndExecute(LoadUpgradeRequire({ limit: itemsPerPage, offset:(currentPage - 1) * itemsPerPage, name: ""}));
});