
document.addEventListener('DOMContentLoaded', () => {
    fetchgetTopics({ level: [], school: "", monhoc: "", page: 1 });
});

const levelCheckboxes = document.querySelectorAll('input[name="level"]');
const schoolSelect = document.getElementById('truong');
let selectedLevels = [];
let selectedSchool = "";
let currentPage = 1;
let totalPages = 1;
let monhoc = "";
const searchInput = document.getElementById('searchInput');

// Sự kiện tìm kiếm
searchInput.addEventListener('change', (event) => {
    monhoc = event.target.value.trim(); // Lấy giá trị tìm kiếm
    currentPage = 1; // Reset lại trang hiện tại về trang 1	
    selectedSchool = "";	
    fetchgetTopics({ level: selectedLevels, school: selectedSchool, monhoc: monhoc, page: currentPage, limit: 6 });
});
// Theo dõi sự thay đổi của level
levelCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
        levelCheckboxes.forEach(cb => {
            if (cb !== checkbox) cb.checked = false; // Bỏ tick các checkbox khác
        });
        selectedLevels = Array.from(levelCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (selectedLevels.length > 0) {
            schoolSelect.disabled = false;

            // Gửi yêu cầu lấy danh sách trường theo level
            try {
                const response = await fetch(`/api/de/gettopics?level=${selectedLevels.join(',')}`, {
                    method: 'GET',
                });
                const data = await response.json();
                if (data.success) {
                    console.log(selectedLevels.join(','));
                    loadSchools(selectedLevels.join(',')); // Cập nhật danh sách trường
                } else {
                    console.error('Không tìm thấy trường:', data.message);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách trường:', error);
            }

            fetchgetTopics({ level: selectedLevels, page: 1, limit: 6 }); // Lọc đề thi chỉ theo trình độ
        } else {
            schoolSelect.disabled = true;
            schoolSelect.innerHTML = '<option value="">Chọn trường</option>';
            fetchgetTopics({ level: [], page: 1, limit: 6 }); // Bỏ lọc nếu không có trình độ
        }
    });
});

schoolSelect.addEventListener('change', () => {
    selectedSchool = schoolSelect.value;
    fetchgetTopics({ level: selectedLevels, school: selectedSchool, page: 1, limit: 6 }); // Lọc đề thi theo trường
});

function displayTopics(topics) {
    const topicsContainer = document.getElementById('topics-container');
    topicsContainer.innerHTML = '';

    topics.forEach(topic => {
        const topicHTML = `
									<div class="col-md-6 col-lg-4 mb-4 d-flex align-items-stretch">
										<div class="project-wrap card">
											<a href="#" class="img" style="background-image: url('/User/Static/images/exam-04.png');">
												<span class="price">${topic.monhoc}</span>
											</a>
											<div class="text p-3">
												<h4 class="title"><a href="/user/detailtopic/${topic.made}">${topic.tende}</a></h4>
												<div class="info d-flex justify-content-between mb-2" style="flex-direction: column;">
													<span><i class="fa fa-calendar"></i> ${topic.ngaydang}</span>
													<div>
														<span><i class="fa fa-question-circle"></i> ${topic.questionCount}</span>
														<span><i class="fa fa-eye"></i> ${topic.totalLuotThi}</span>
														<span><i class="fa-solid fa-download"></i> ${topic.totalLuotTai}</span>
													</div>
												</div>
												<p class="author">Tác giả: <span>${topic.nguoidung.author}</span></p>
												<a href="/user/detailtopic/${topic.made}" class="btn btn-primary btn-block mt-3">Vào ôn thi</a>
											</div>
										</div>
									</div>
								`;
        topicsContainer.insertAdjacentHTML('beforeend', topicHTML);
    });
}

function updatePagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';

    if (currentPage > 1) {
        paginationContainer.innerHTML += `<li><a href="#" onclick="return changePage(${currentPage - 1})">&lt;</a></li>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationContainer.innerHTML += `<li class="${activeClass}"><a href="#" onclick="return changePage(${i})">${i}</a></li>`;
    }

    if (currentPage < totalPages) {
        paginationContainer.innerHTML += `<li><a href="#" onclick="return changePage(${currentPage + 1})">&gt;</a></li>`;
    }
}

function changePage(page) {
    if (page < 1 || page > totalPages) return false;
    currentPage = page;
    fetchgetTopics({ level: selectedLevels, school: selectedSchool, monhoc: monhoc, page: currentPage, limit: 6 });
    return false;
}

async function fetchgetTopics(filter = {}) {
    // Xử lý các tham số để không truyền tham số rỗng
    const params = new URLSearchParams();
    if (filter.level && filter.level.length > 0) {
        params.append('level', filter.level.join(','));
    }
    if (filter.school && filter.school.length > 0) {
        params.append('school', filter.school);
    }
    if (filter.monhoc && filter.monhoc.length > 0) {
        params.append('monhoc', filter.monhoc);
    }

    params.append('page', filter.page || 1);
    params.append('limit', filter.limit || 6);

    const queryParams = params.toString();

    try {
        const response = await fetch(`/api/de/gettopics?${queryParams}`, {
            method: 'GET',
        });
        const data = await response.json();

        if (data.success) {
            if (data.data.length === 0) {
                document.getElementById('paginationContainer').style.display = 'none';
                document.getElementById('topics-container').innerHTML = '<p style="margin: auto;font-size: 1.2rem;padding: 30px;color: #4986fc;">Không có dữ liệu.</p>';
            } else {
                document.getElementById('paginationContainer').style.display = 'block';
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
