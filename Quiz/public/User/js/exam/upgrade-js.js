import { checkTokenAndExecute } from './check_authentication.js';

document.addEventListener('DOMContentLoaded', function () {
    // Hàm gọi API và xử lý dữ liệu trả về
    function fetchAndDisplayPlans(durationType) {
        console.log('Đã chọn:', durationType);
        fetch(`/api/typeacc/packageacc?type=${durationType}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data.data)) {
                    console.log('Dữ liệu là mảng:', data.data);
                    displayPlans(data.data); // Gọi hàm hiển thị các gói
                } else {
                    console.error('Dữ liệu trả về không phải là mảng:', data);
                }
            })
            .catch(error => {
                console.error('Lỗi khi gọi API:', error);
            });
    }

    // Lắng nghe sự kiện thay đổi trên các radio button
    document.querySelectorAll('input[name="duration"]').forEach(radio => {
        radio.addEventListener('change', function () {
            // Lấy giá trị của thuộc tính data-type từ input radio được chọn
            const durationType = this.getAttribute('data-type');
            fetchAndDisplayPlans(durationType); // Gọi hàm chung
        });
    });

    // Kiểm tra radio button mặc định khi trang tải
    const defaultRadio = document.querySelector('input[name="duration"]:checked');
    if (defaultRadio) {
        const durationType = defaultRadio.getAttribute('data-type');
        fetchAndDisplayPlans(durationType); // Gọi hàm chung
    }
});

// Function to display plans
function displayPlans(plans) {
    const plansContainer = document.getElementById('pricing-plans');
    plansContainer.innerHTML = '';
    // Thêm gói "Free" vào đầu danh sách
    const freePlan = document.createElement('div');
    freePlan.classList.add('plan');
    freePlan.innerHTML = `
<h3>Free</h3>
<p class="price">Miễn phí</p>
<hr/>
<p class="benefit-package">Ưu đãi:</p>
<ul id="pro-plan">
<li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
    Tạo 5 đề thi mỗi tháng</li>
<li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
    Được thi 5 lần mỗi tháng</li>
<li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
    Lưu trữ kết quả thi không giới hạn</li>
<li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
    Ưu tiên hỗ trợ 24/7</li>
</ul>
`;
    plansContainer.appendChild(freePlan);

    // Duyệt qua các gói và hiển thị
    plans.forEach(plan => {
        const planDiv = document.createElement('div');
        planDiv.classList.add('plan');
        planDiv.innerHTML = `
<h3>${plan.tenloaitk}</h3>
<p class="price">${plan.gia.toLocaleString('vi-VN')} VNĐ</p>
<hr/>
<p class="benefit-package">Ưu đãi:</p>
<ul id="pro-plan">
    <li>  <svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
    Tạo ${plan.solandangbai} đề thi</li>
    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
        Được thi ${plan.solandangbai} lần</li>
    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
        Được tải đề thi ${plan.solantai} lần</li>
    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
        Lưu trữ kết quả thi không giới hạn</li>
    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
        Ưu tiên hỗ trợ 24/7</li>
</ul>
<a href="/user/upgrade" data-typeacc="${plan.maloaitk}" class="btn-register">Đăng ký gói</a>
`;
        plansContainer.appendChild(planDiv);
    });
    async function Sendpackagedata(button){
        let selectedPackage = [];
        // Lấy thông tin mã loại tài khoản từ data-typeacc
        const accountType = button.getAttribute('data-typeacc');
        plans.forEach(plan => {
            if (Number(plan.maloaitk) === Number(accountType)) {
                selectedPackage.push(plan);
            }
        });
        if (selectedPackage.length>0) {
            try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/typeacc/storetype', {
                method: 'POST',
                headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                body: JSON.stringify({selectedPackage: selectedPackage})
            });
            const result = await response.json();
            if (result.success) {
                window.location.href='/user/order';
            } else {
                console.log('Gửi thất bại!');
            }
            } catch (error) {
                console.error("Error:", error);
            }
        } else {
            console.error('Không tìm thấy gói tài khoản với mã:', accountType);
        }
    }
    document.querySelectorAll('.btn-register').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            checkTokenAndExecute(Sendpackagedata(btn));
        });
    });
}