import { checkTokenAndExecute } from './check_authentication.js';

    function updateProgress(selector, current, total) {
        // Tính phần trăm
        const percentage = ((total-current) / total) * 100;

        // Cập nhật thanh tiến trình
        const progressFill = document.querySelector(`${selector} .progress-fill`);
        progressFill.style.width = `${percentage}%`;

        // Cập nhật giá trị hiển thị
        const textSpan = document.querySelector(`${selector} span`);
        textSpan.textContent = `${(total-current)}/${total}`;
    }

    async function LoadMytypeAcc() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/typeacc/mytypeacc', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const result = await response.json();
            console.log(result);

            if (result.success && result.data) {
                const myuse = result.myuse;

                // Cập nhật tiêu đề gói đăng ký
                document.getElementById('plan-title').textContent = `EduQuiz - Cá nhân - ${result.data.tenloaitk}`;

                // Kiểm tra ngày kết thúc và hiển thị
                if (myuse.ngayketthuc != null) {
                    document.getElementById('expired-time').textContent = `Từ ${new Date(myuse.ngaybatdau).toLocaleDateString()} đến ${new Date(myuse.ngayketthuc).toLocaleDateString()}`;
                }

                // Cập nhật danh sách các đặc quyền của gói đăng ký
                const mybenefit = document.getElementById('my-features');
                mybenefit.innerHTML = `
                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                        Tạo ${result.data.solandangbai} đề thi</li>
                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                        Được thi ${result.data.solanthi} lần</li>
                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                        Được tải đề thi ${result.data.solantai} lần</li>
                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                        Lưu trữ kết quả thi không giới hạn</li>
                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                        Ưu tiên hỗ trợ 24/7</li>
                `;

                // Cập nhật thanh tiến trình
                updateProgress('#de-thi', myuse.sodethi, result.data.solandangbai);
                updateProgress('#luot-thi', myuse.lanthi, result.data.solanthi);
                if(result.data.solantai===0)
                {
                    document.getElementById('luot-tai').style.display='none';
                } else {
                    document.getElementById('luot-tai').style.display='block';
                    updateProgress('#luot-tai', myuse.luottai, result.data.solantai);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    async function CheckmyUpgrade() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/upgrade/myupgr', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const result = await response.json();
            console.log(result);

            if (result.success && result.data) {
               document.getElementById('my-upgrade').style.display='block';
            }
            else{
                document.getElementById('my-upgrade').style.display='none';
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
document.addEventListener('DOMContentLoaded', function () {
     checkTokenAndExecute(LoadMytypeAcc);
     checkTokenAndExecute(CheckmyUpgrade);
});