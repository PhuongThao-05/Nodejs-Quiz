import { checkTokenAndExecute } from './check_authentication.js';

let solanthi=null;
let soluottai=null;
function getTopicIdFromUrl() {
    const pathSegments = window.location.pathname.split('/');
    return pathSegments[pathSegments.length - 1]; 
}
    async function loadTopicInfo() {
        const topicId = getTopicIdFromUrl(); 
        try {
            const response = await fetch(`/api/de/gettopics/${topicId}`);
            const result = await response.json();

            if (result.success && result.data) {
                const topic = result.data;

                // Thay đổi nội dung HTML với dữ liệu từ API
                document.querySelector('.exam-details h2').textContent = topic.tende; // Tên bài
                document.querySelector('.author-name').textContent = topic.nguoidung.author || 'Unknown'; // Tên tác giả
                document.querySelector('.exam-date').innerHTML = `<i class="fa fa-calendar"></i> ${topic.ngaydang}`; // Ngày đăng
                document.querySelector('.subject-name').innerHTML = `<i class="fa-solid fa-book-open"></i> Môn học: ${topic.monhoc}`; // Ngày đăng
                document.querySelector('.school-name').innerHTML = `<i class="fa-solid fa-school"></i> ${topic.truong}`; // Ngày đăng

                document.querySelector('.exam-stats span:nth-child(1)').innerHTML = `<i class="fa fa-question-circle"></i> ${topic.questionCount}`; // Số câu hỏi
                document.querySelector('.exam-stats span:nth-child(2)').innerHTML = `<i class="fa fa-eye"></i> ${topic.totalLuotThi}`; // Tổng lượt thi
                document.querySelector('.exam-stats span:nth-child(3)').innerHTML = `<i class="fa-solid fa-download" aria-hidden="true"></i> ${topic.totalLuotTai}`; // Tổng lượt tải
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin đề thi:', error);
        }
    }
    async function loadAdvantageUser() {
        const token=localStorage.getItem('token');
        try {
            if(token){
            const response = await fetch(`/api/user/advantage`,{
                method:'GET',
                headers: { 
                            'Content-Type': 'application/json',
                           'Authorization': 'Bearer ' + token
                     }
            });
            const result = await response.json();

            if (result.success && result.data) {
                const adv = result.data;

                const lanthi = adv.lanthi ?? null;  // Kiểm tra nếu undefined/null
                const luottai = adv.luottai ?? null; // Tương tự
                 solanthi=lanthi;
                 soluottai=luottai;
                if (lanthi > 0 && luottai > 0) {
                    showNotification(`Bạn có ${lanthi} lần thi và ${luottai} lượt tải`, true);
                } else if (lanthi === 0 && luottai > 0) {
                    showNotification(`Bạn đã hết lượt thi, nhưng còn ${luottai} lượt tải`, true);
                } else if (lanthi > 0 && luottai === 0) {
                    showNotification(`Bạn đã hết lượt tải, nhưng còn ${lanthi} lượt thi`, true);
                } else if (lanthi === 0 && luottai === 0) {
                    showNotification(`Bạn đã hết lượt thi và lượt tải`, false);
                } else {
                    showNotification(`Dữ liệu không hợp lệ`, false); // Dữ liệu không mong đợi
                }
            } else {
                showNotification(`Không thể lấy thông tin`, false);
            }
            } else{
                showNotification(`Bạn nên đăng nhập nếu ôn thi`, true);
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin đề thi:', error);
        }
    }
   
    async function loadQuestions() {
    const topicId = getTopicIdFromUrl(); // Lấy ID đề từ URL
    try {
        const response = await fetch(`/api/question/lstques/${topicId}`, {
            method: 'GET',
        });
        const result = await response.json();

        if (result.success && result.data) {
            const questions = result.data.slice(0, 5); // Lấy 5 câu hỏi đầu tiên
            const questionsContainer = document.getElementById('noidung');
            questionsContainer.innerHTML = ''; // Xóa nội dung cũ

            // Hiển thị từng câu hỏi và đáp án
            questions.forEach((question, index) => {
                const questionElement = document.createElement('div');
                questionElement.classList.add('question-block');

                // Thêm nội dung câu hỏi
                questionElement.innerHTML = `
                    <p style="margin-bottom:2px;">Câu ${index + 1}: ${question.cauhoi}</p>
                    <ul style="list-style:none;margin-bottom: 2px;">
                        ${question.answers.map(answer =>
                         `<li style="display: flex;flex-direction: row;align-items: center;gap: 10px;">
                            <input type="radio" disabled/>${answer}</li>`).join('')}
                    </ul>
                `;

                questionsContainer.appendChild(questionElement);
            });
            } else {
            console.warn('Không tìm thấy dữ liệu câu hỏi.');
            }
            } catch (error) {
            console.error('Lỗi khi tải danh sách câu hỏi:', error);
            }
         }
         document.getElementById("download-exam-button").addEventListener("click", async () => {
        try {
            if(localStorage.getItem('token'))
            {
            if(soluottai>0){
            const topicId = getTopicIdFromUrl(); // Lấy ID đề từ URL
            const response = await fetch(`/api/question/download-exam/${topicId}`, {
            method: 'GET',
            });
            if (!response.ok) {
            throw new Error("Có lỗi xảy ra khi tải file");
            }
            // Đọc nội dung file trả về
            const blob = await response.blob();
            // Tạo một URL từ Blob
            const url = window.URL.createObjectURL(blob);
            const contentDisposition = response.headers.get("Content-Disposition");
            const match = contentDisposition && contentDisposition.match(/filename="?([^"]+)"?/);
            const filename = match ? match[1] : "exam.docx"; 
            const now = new Date();
            const formattedTime = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

            // Tạo thẻ <a> để tải file
            const a = document.createElement("a");
            a.href = url;
            a.download = `Eduquiz-exam-${formattedTime}_${filename}`; 
            document.body.appendChild(a);
            a.click();
            // Dọn dẹp URL và <a> sau khi tải xong
            a.remove();
            window.URL.revokeObjectURL(url);
            //đếm lượt tải
            await fetch(`/api/figure/adddownload/${topicId}`, {
            method: 'POST',
            headers: { 
                            'Content-Type': 'application/json',
                           'Authorization': 'Bearer ' + localStorage.getItem('token')
                     },
            });
            //trừ số lần tải
            await fetch(`/api/user/descdownload`,{
                method:'PUT',
                headers: { 
                            'Content-Type': 'application/json',
                           'Authorization': 'Bearer ' + localStorage.getItem('token')
                     }
            });
            loadTopicInfo();
            loadAdvantageUser();
            }
            else{
                showNotification('Bạn đã hết lượt tải',false);
            }
        } else{
            showNotification('Bạn chưa đăng nhập',false);
        }
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Không thể tải file. Vui lòng thử lại.");
        }
        });
         window.onload = function() {
            loadAdvantageUser() ;
            loadTopicInfo();
            loadQuestions();
            loadResults();
            loadResultstatistic();
        };
        async function handleExamStart(button) {
            if(solanthi>0){
                //đếm lượt thi
                const response= await fetch(`/api/figure/addaccess/${getTopicIdFromUrl()}`,{
                    method:'POST',
                    headers: { 
                                'Content-Type': 'application/json',
                               'Authorization': 'Bearer ' + localStorage.getItem('token')
                         },
                });
                const result= await response.json();
                if(result.success&&result.data)
                {
                //trừ số lần thi
                await fetch(`/api/user/desctest`,{
                    method:'PUT',
                    headers: { 
                                'Content-Type': 'application/json',
                               'Authorization': 'Bearer ' + localStorage.getItem('token')
                         }
                });
                window.location.href = button.href;
                }
                else{
                    console.log(result.error); 
                }
                } else {
                    showNotification('Bạn đã hết lượt tải',false);
                }
     
        }
        document.querySelectorAll('.start-exam-button').forEach(button => {
            button.addEventListener('click', async function(event) {
        event.preventDefault(); // Ngăn chặn hành vi điều hướng mặc định

        const token = localStorage.getItem('token'); // Kiểm tra token trong localStorage

        if (token) {
            checkTokenAndExecute(() => handleExamStart(button));
            }
        else{
            showNotification('Vui lòng đăng nhập để tiếp tục!', false);
            }
    })
        });
        async function loadResults() {
    const topicId = getTopicIdFromUrl(); // Lấy ID đề từ URL
    try {
        const token=localStorage.getItem('token');
        const ketquacontainer=document.getElementById('ketqua');
        if(!token){
            ketquacontainer.innerHTML=`
            <div class="normal-result">
            <svg style="font-size: xx-large;" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="text-[1.8rem]" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 8v11.529S6.621 19.357 12 22c5.379-2.643 10-2.471 10-2.471V8s-5.454 0-10 2.471C7.454 8 2 8 2 8z"></path><circle cx="12" cy="5" r="3"></circle></svg>
            <span>Bạn chưa có kết quả thi</span></div>
            `;
            document.querySelector('.thongke-tab').style.display='none';
        } else{
        const response = await fetch(`/api/result/resultwithtopic/${topicId}`, {
            method: 'GET',
            headers:{
                            'Content-Type': 'application/json',
                           'Authorization': 'Bearer ' + token
            }
        });
        const result = await response.json();
        console.log(result.data);
        const noDataRow = document.getElementById('no-data'); 
        const tbody=document.querySelector('.results-table tbody');  
        if (result.success && result.data) { 
            if(result.data.length>0)
            {
            if (noDataRow) {
                    noDataRow.style.display = 'none';  // Ẩn thông báo không có dữ liệu
                } 
            } else{
                if (noDataRow) {
                    noDataRow.style.display = 'table-cell';  // Hiển thị thông báo không có dữ liệu
                }
            }                 
            // Hiển thị từng câu hỏi và đáp án
            result.data.forEach(result => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${result.nguoidung.hoten}</td>
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
            } else {
                console.error('Lỗi khi tải kết quả:', result.error);
            }
        }
            } catch (error) {
            console.error('Lỗi khi tải kết quả:', error);
            }
         }
         async function loadResultstatistic() {
    const topicId = getTopicIdFromUrl(); // Lấy ID đề từ URL
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            document.querySelector('.thongke-tab').style.display = 'none';
        } else {
            document.querySelector('.thongke-tab').style.display = 'block';
            const today = new Date();
            const currentMonth = today.getMonth() + 1; // Tháng (tính từ 1 - 12)
            const currentYear = today.getFullYear();
            const response = await fetch(`/api/result/resultinmonth/${topicId}?month=${currentMonth}&year=${currentYear}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const result = await response.json();
            console.log(result.data);  // Log the result data to debug

            if (result.success && result.data) { 
                document.getElementById('title-statistic-month').innerHTML=`Thống kê điểm số tháng ${currentMonth}/${currentYear}`;
                const chartData = result.data; // Dữ liệu từ backend
                console.log('Chart Data:', chartData);  // Log the chart data
                const labels = chartData.map(item => item.thoigianhoanthanhbaithi); // Ngày hoàn thành
                const scores = chartData.map(item => item.diemso); // Điểm thi

                // Vẽ biểu đồ
                const ctx = document.getElementById('myChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line', // Loại biểu đồ (line chart)
                    data: {
                        labels: labels, // X: ngày
                        datasets: [{
                            label: 'Điểm thi',
                            data: scores, // Y: điểm thi
                            borderColor: 'rgba(75, 192, 192, 1)', // Màu đường biên
                            pointRadius: 6, // Kích thước của các điểm đánh dấu khi không hover
                            pointHoverRadius: 10,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)', // Màu nền điểm
                            fill: true, // Điền màu dưới đường biên
                            tension: 0.3 // Độ cong của đường
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Ngày'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Điểm'
                                },
                                min: 0, // Điểm thấp nhất là 0
                                max: 10 // Điểm cao nhất là 10 (hoặc thay đổi theo yêu cầu)
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách câu hỏi:', error);
    }
}