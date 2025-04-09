import { checkTokenAndExecute } from './check_authenticationAdmin.js';

async function fetchYears() {
    const response = await fetch('/api/upgrade/yeartostatistic',{
        method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('tokenAdmin')
                }
    });
    const result = await response.json(); // Dữ liệu trả về

    const years = result.data || []; 

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
        const firstYear = years[0].nam;  
        selectYear.value = firstYear; 
        StatisticIncome(firstYear); 
    } else {
        console.error("Dữ liệu năm không có sẵn!");
    }
    // Thêm sự kiện khi người dùng chọn năm
    selectYear.addEventListener('change', () => {
        const selectedYear = selectYear.value;
        StatisticIncome(selectedYear); // Truyền năm đã chọn
    });
}
    async function StatisticIncome(selectedYear) {                       
        try {
            const response = await fetch(`/api/upgrade/databymonth?year=${selectedYear}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('tokenAdmin')
                }
            });

            const result = await response.json();
            console.log(result.data);
            if (result.success&&result.data) {
                const labels = result.data.map(data => `${data.nam}-${String(data.thang).padStart(2, '0')}`); // Dạng "YYYY-MM"
                const totalincome = result.data.map(data => data.income);

                const config = {
                type: 'line',
                data: {
                    labels: labels, // Trục X - các tháng
                    datasets: [
                        {
                            label: 'Doanh thu',
                            data: totalincome, // Dữ liệu lượt thi
                            backgroundColor: 'rgba(153, 204, 255, 0.4)',
                            borderColor: 'rgba(153, 204, 255, 1)',
                            borderWidth: 2,
                            fill: true, // Điền màu dưới đường biên
                            tension: 0.3,
                            pointRadius: 8, 
                            pointHoverRadius: 12,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: { display: true, text: 'Thời gian (Tháng)' }
                        },
                        y: { title: {display: true, text: 'Doanh thu'},
                        ticks: {
                            beginAtZero: true, // Đảm bảo trục Y bắt đầu từ 0
                            stepSize: 1, // Khoảng cách giữa các giá trị trên trục Y (tùy chỉnh)
                        },
                        min: 0,
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
        } else{
            console.error("Error:",result.message);
        }
                                                      
        } catch (error) {
            console.error("Có lỗi:", error);
        }
    }
    document.addEventListener('DOMContentLoaded', () => {
        checkTokenAndExecute(fetchYears);
    });
