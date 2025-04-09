import { checkTokenAndExecute } from './check_authentication.js';
let createdExamId = localStorage.getItem('createdExamId') || null;
                let sodethi=null;
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

                const token = localStorage.getItem('token');
            
                // Tải thông tin đề thi từ localStorage khi trang tải lại
                async function loadFromLocalStorage() {
                    const tende = localStorage.getItem('tende');
                    const monhoc = localStorage.getItem('monhoc');
                    const trinhdo = localStorage.getItem('trinhdo');
                    const truong = localStorage.getItem('truong');
            
                    if (tende) document.getElementById('tende').value = tende;
                    if (monhoc) document.getElementById('monhoc').value = monhoc;
                    if (trinhdo) document.getElementById('trinhdo').value = trinhdo;
                    await loadSchools(trinhdo); 
                     // Gán giá trị cho trường học
                     const schoolSelect = document.getElementById('truong');
                     const schoolValue = truong; // Cập nhật để lấy đúng giá trị
                     console.log('Giá trị trường học:', schoolValue); // Kiểm tra giá trị trường học
                    schoolSelect.value = schoolValue; // Gán giá trị vào select                  
            
                    // Hiển thị nút "Cập Nhật" nếu đã có createdExamId
                    if (createdExamId) {
                        document.getElementById('createButton').style.display = 'none';
                        document.getElementById('updateButton').style.display = 'block';
                        document.getElementById('edit-ques-tab').classList.remove('disabled');
                        switchTab();
                    }
                }
            
                // Lưu thông tin đề thi vào localStorage
                function saveToLocalStorage(tende, monhoc, trinhdo, truong, examId = null) {
                    localStorage.setItem('tende', tende);
                    localStorage.setItem('monhoc', monhoc);
                    localStorage.setItem('trinhdo', trinhdo);
                    localStorage.setItem('truong', truong);
                    if (examId) localStorage.setItem('createdExamId', examId);
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

                        const dethi = adv.sodethi ?? null;  
                        sodethi=dethi;
                        if (sodethi > 0) {
                            showNotification(`Bạn có ${sodethi} lần tạo đề thi`, true);
                            document.getElementById('createButton').disabled = false;
                        } else if (sodethi === 0) {
                            showNotification(`Bạn đã hết lượt tạo đề thi`, false);
                            document.getElementById('createButton').disabled = true;
                        }
                    } else {
                        showNotification(`Không thể lấy thông tin`, false);
                    }
                    }
                } catch (error) {
                    console.error('Lỗi khi tải thông tin đề thi:', error);
                }
            }
                // Hàm tạo đề thi
                async function createExam(event) {
                    event.preventDefault();
                    if(sodethi>0){
                    const tende = document.getElementById('tende').value;
                    const monhoc = document.getElementById('monhoc').value;
                    const trinhdo = document.getElementById('trinhdo').value;
                    const truong = document.getElementById('truong').value;
            
                    if (!tende || !monhoc || !trinhdo || !truong) {
                        alert('Vui lòng hoàn tất form trước khi tiếp tục!');
                        return;
                    }
            
                    try {
                        const response = await fetch('/api/de/addtopic', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            },
                            body: JSON.stringify({ tende, monhoc, trinhdo, truong })
                        });
            
                        const result = await response.json();
                        if (result.success && result.data) {
                            createdExamId = result.data.made;
                            saveToLocalStorage(tende, monhoc, trinhdo, truong, createdExamId);
                            showNotification('Đề thi đã được tạo!',true);
                            document.getElementById('edit-ques-tab').classList.remove('disabled');
                            switchTab();
                            await fetch(`/api/user/descposttopic`,{
                                method:'PUT',
                                headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                                    }
                            });
                            // Chuyển sang chế độ cập nhật
                            document.getElementById('createButton').style.display = 'none';
                            document.getElementById('updateButton').style.display = 'block';
                        } else {
                            console.error("Error: createdExamId is undefined or null.");
                        }
                    } catch (error) {
                        console.error("Error:", error);
                        showNotification("Đã xảy ra lỗi khi thêm đề thi.",false);
                    }
                 } else{
                    showNotification("Bạn đã hết lượt tạo đề thi.",false);
                    document.getElementById('createButton').disabled = true;
                 }
                }
                // Hàm cập nhật đề thi
                async function updateTopic() {
                    const tende = document.getElementById('tende').value;
                    const monhoc = document.getElementById('monhoc').value;
                    const trinhdo = document.getElementById('trinhdo').value;
                    const truong = document.getElementById('truong').value;
            
                    if (!createdExamId) {
                        alert("Không tìm thấy mã đề.");
                        return;
                    }
            
                    try {
                        const response = await fetch(`/api/de/updatetopic/${createdExamId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            },
                            body: JSON.stringify({ tende, monhoc, trinhdo, truong })
                        });
            
                        const result = await response.json();
                        if (result.success) {
                            saveToLocalStorage(tende, monhoc, trinhdo, truong);
                            showNotification("Đã cập nhật đề thi thành công.",true);
                        } else {
                            showNotification("Cập nhật thất bại: " + result.message,false);
                        }
                    } catch (error) {
                        console.error("Lỗi khi cập nhật:", error);
                        alert("Đã xảy ra lỗi khi cập nhật.");
                    }
                }
            
                // Tải lại dữ liệu từ localStorage khi trang tải lại
                window.addEventListener('load', loadFromLocalStorage);
                window.onload = function() {
                    loadAdvantageUser() ;
                    checkTokenAndExecute(document.getElementById('createButton').addEventListener('click', createExam));                   
                    checkTokenAndExecute(document.getElementById('updateButton').addEventListener('click', updateTopic));                   
                };