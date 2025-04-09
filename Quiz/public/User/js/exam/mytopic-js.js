import { checkTokenAndExecute } from './check_authentication.js';
let currentPage = 1;
		let totalPages = 1;
		let monhoc="";
    // Gửi yêu cầu để lấy danh sách đề thi
    const token = localStorage.getItem('token');

    async function fetchUserTopics(filter = {}) {
        const params = new URLSearchParams();
		if (filter.monhoc && filter.monhoc.length > 0) {
		params.append('monhoc', filter.monhoc);
		}
        params.append('page', filter.page || 1);
		params.append('limit', filter.limit || 4);

		const queryParams = params.toString();
        try {
            const response = await fetch(`/api/de/usertopics?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const data = await response.json();
            if (data.success) {
                if (data.data.length === 0) {
				document.getElementById('paginationContainer').style.display='none';
				document.getElementById('topics-container').innerHTML = '<p style="margin: auto;font-size: 1.2rem;padding: 30px;color: #4986fc;">Không có dữ liệu.</p>'; 
				} else {
						document.getElementById('paginationContainer').style.display='flex';
						totalPages = data.pagination.totalPages;
						currentPage = data.pagination.currentPage;
						displayTopics(data.data);
				}
				updatePagination();
            } else {
                console.error('Không tìm thấy đề thi:', data.message);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đề thi:', error);
        }
    }

    function displayTopics(topics) {
        const topicsContainer = document.getElementById('topics-container');
        topicsContainer.innerHTML = ''; // Xóa nội dung cũ

        topics.forEach(topic => {
            // Tạo HTML cho mỗi đề thi
            const topicHTML = `
                <div class="contain-topic">
                    <div style="padding: 5px; border-bottom: 1px solid #d8d6d6e3;">
                        <img src="/User/images/exam-02.png" />
                        <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px;">
                            <p style="font-size: 18px;text-wrap: wrap;font-weight: 600;">${topic.tende}</p>
                            <p>
                                <i class="fa-regular fa-clock"></i>
                                ${topic.ngaydang} <!-- Ngày đăng từ dữ liệu -->
                            </p>
                            <p style="font-weight: 500;">
                                <i class="fa-solid fa-book" style="margin-right: 5px;"></i>
                                ${topic.monhoc} <!-- Môn học từ dữ liệu -->
                            </p>
                            <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-around;">                                                      
                                <div class="icon-topic" aria-label="Câu hỏi" data-bs-toggle="tooltip" title="Tổng số câu hỏi">
                                    <i class="fa-solid fa-circle-question" style="color: #ff7300;"></i>
                                    <span>${topic.questionCount}</span> <!-- Số câu hỏi -->
                                </div>
                                <div class="icon-topic" aria-label="Lượt thi" data-bs-toggle="tooltip" title="Lượt thi">
                                    <i class="fa-solid fa-right-to-bracket" style="color: #2c79cb;"></i>
                                    <span>${topic.totalLuotThi}</span> <!-- Lượt truy cập -->
                                </div>
                                <div class="icon-topic" aria-label="Lượt tải" data-bs-toggle="tooltip" title="Lượt tải">
                                    <i class="fa-solid fa-download" style="color: #009860;"></i>
                                    <span>${topic.totalLuotTai}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex;flex-direction: column;">
                        <div class="icon-feature">
                            <a href="/user/edittopic/${topic.made}" style="cursor: pointer;" data-bs-toggle="tooltip" title="Sửa đề thi"><i class="fa-regular fa-pen-to-square" style="color: #42d56d;"></i></a>
                            <a class="delete-topic" data-id="${topic.made}" style="cursor: pointer;" data-bs-toggle="tooltip" title="Xóa đề thi"><i class="fa-solid fa-trash-can" style="color: #db0d0d;"></i></a>
                            <a href="/user/edittopic/${topic.made}" style="cursor: pointer;" data-bs-toggle="tooltip" title="Thống kê đề thi"><i class="fa-solid fa-square-poll-vertical" style="color: #00b3ca;font-size: 21.5px;"></i></a>
                        </div>
                        <a href="/user/detailtopic/${topic.made}" class="add-topic" style="margin-bottom: 10px;"><i class="fa-solid fa-circle-play"></i> Vào ôn thi </a>
                    </div>
                </div>
            `;
            // Thêm nội dung HTML của đề thi vào container
            topicsContainer.insertAdjacentHTML('beforeend', topicHTML);
        });
        // Lấy các phần tử cần thiết
        const deleteButton = document.getElementById('deleteButton'); // Nút xóa
        const deleteModal = document.getElementById('deleteModal'); // Modal
        const confirmDeleteButton = document.getElementById('confirmDelete'); // Nút xác nhận xóa
        let idDelete=null;
        document.querySelectorAll('.delete-topic').forEach(deleteIcon => {
            deleteIcon.addEventListener('click', (event) => {
                deleteModal.style.display = 'block';
                idDelete = deleteIcon.getAttribute('data-id');
            })
        });
        const closeModal = () => {
        deleteModal.style.display = 'none'; // Đóng modal
        };
        document.querySelector('.close').addEventListener('click', closeModal);
        document.querySelector('.btn-secondary').addEventListener('click', closeModal);
        // Xử lý khi xác nhận xóa
                confirmDeleteButton.addEventListener('click', async function(event) {
                    event.preventDefault();
                    const topicId = idDelete;
                    await fetch(`/api/de/hidetopic/${topicId}`, {
                     method: 'PUT',
                     headers: {
                         'Authorization': 'Bearer ' + token
                     }
                 })
                 .then(response => response.json())
                 .then(data => {
                     if (data.success) {
                        fetchUserTopics({monhoc: monhoc, page: currentPage, limit: 4 });                  
                    } else {
                         console.error('Không thể xóa đề thi:', data.message);
                     }
                 })
                .catch(error => console.error('Lỗi khi xóa đề thi:', error));
                closeModal(); // Đóng modal sau khi xóa thành công
                })
      }
    const searchInput = document.getElementById('searchInput');
    // Tìm kiếm
    searchInput.addEventListener('change', (event) => {
	monhoc = event.target.value.trim(); // Lấy giá trị tìm kiếm
	currentPage = 1; 	
	fetchUserTopics({monhoc: monhoc, page: currentPage, limit: 4 });
	});

    function updatePagination() {
	const paginationContainer = document.getElementById('paginationContainer');
	paginationContainer.innerHTML = ''; 

    const prevPageItem = document.createElement('li');
    prevPageItem.classList.add('page-item');
    prevPageItem.innerHTML = `<a>&#171;</a>`;
    prevPageItem.classList.toggle('disabled', currentPage === 1);
    prevPageItem.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchUserTopics({monhoc: monhoc, page: currentPage, limit: 4 });
        }
    });
    paginationContainer.appendChild(prevPageItem);


	for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add('page-item');
        pageItem.innerHTML = `<a>${i}</a>`;
        pageItem.addEventListener('click', () => {
            currentPage = i;
            fetchUserTopics({monhoc: monhoc, page: currentPage, limit: 4 });
        });
        if (i === currentPage) {
            pageItem.classList.add('active');
        }

        paginationContainer.appendChild(pageItem);
	}
	const nextPageItem = document.createElement('li');
    nextPageItem.classList.add('page-item');
    nextPageItem.innerHTML = `<a>&#187;</a>`;
    nextPageItem.classList.toggle('disabled', currentPage === totalPages);
    nextPageItem.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchUserTopics({monhoc: monhoc, page: currentPage, limit: 4 });
        }
    });
    paginationContainer.appendChild(nextPageItem);
}

    document.addEventListener('DOMContentLoaded', function () {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    checkTokenAndExecute(fetchUserTopics({monhoc: "", page: currentPage, limit: 4 }));
});
