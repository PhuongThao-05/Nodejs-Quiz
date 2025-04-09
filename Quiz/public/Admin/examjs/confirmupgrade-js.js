import { checkTokenAndExecute } from './check_authenticationAdmin.js';
     function getIdFromUrl() {
                const pathSegments = window.location.pathname.split('/');
                return pathSegments[pathSegments.length - 1]; 
    }
    async function LoadOrderData(){
        const tokenAdmin = localStorage.getItem('tokenAdmin');
        try {
            const response = await fetch(`/api/upgrade/rqupgr/${getIdFromUrl()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + tokenAdmin
                }
            });
            const result = await response.json();
            console.log(result.data);
            if (result.success && result.data) {
                const orderinfo = document.querySelector('.order-info');
                orderinfo.innerHTML = '';
                const orderdetail = document.querySelector('.order-details');
                orderdetail.innerHTML = '';
                const stateorder = document.querySelector('.state-order');
                stateorder.innerHTML = '';
                const data=result.data;
                if(!data.xacnhan){
                document.getElementById('confirm-require').style.display='block';
                stateorder.innerHTML = '<p style="font-family: system-ui;font-size: 1rem;text-align: center;color: #fb6b6b;"> Đang đợi xét duyệt</p>';
                } else{
                document.getElementById('confirm-require').style.display='none';
                stateorder.innerHTML = '<p style="font-family: system-ui;font-size: 1rem;text-align: center;color: #08be45;"> Đã xét duyệt yêu cầu nâng cấp</p>';
                }
                    const dataorder = document.createElement('div');
                    dataorder.innerHTML = `
                      <dl class="dl-horizontal">
                            <dt>
                                Mã đơn hàng:
                            </dt>
                            <dd>
                              ${data.orderid}
                            </dd>
                        </dl>
                        <dl class="dl-horizontal">
                            <dt>
                                Tên khách hàng:
                            </dt>
                            <dd>
                                ${data.nguoidung.hoten}
                            </dd>
                        </dl>
                        <dl class="dl-horizontal">
                            <dt>
                                Ngày thanh toán:
                            </dt>
                            <dd>
                                ${data.ngaythanhtoan}
                            </dd>
                        </dl>
                        <dl class="dl-horizontal">
                            <dt>
                                Tổng tiền thanh toán:
                            </dt>
                            <dd>
                               ${data.loaitaikhoan.gia.toLocaleString('vi-VN')} VNĐ
                            </dd>
                        </dl>
                `;
                    orderinfo.appendChild(dataorder);
                    const datadetail = document.createElement('div');
                    datadetail.innerHTML = `
                      <dl class="dl-horizontal">
                            <dt>
                                Loại tài khoản nâng cấp:
                            </dt>
                            <dd>
                             ${data.loaitaikhoan.tenloaitk}
                            </dd>
                        </dl>
                        <dl class="dl-horizontal" style="flex-direction: column;gap: 5px;">
                            <dt>
                               Ưu đãi gói nâng cấp:
                            </dt>
                            <dd>
                                <ul id="pro-plan">
                                    <li>  <svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                                    Tạo ${data.loaitaikhoan.solandangbai} đề thi</li>
                                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                                        Được thi ${data.loaitaikhoan.solandangbai} lần</li>
                                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                                        Được tải đề thi ${data.loaitaikhoan.solantai} lần</li>
                                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                                        Lưu trữ kết quả thi không giới hạn</li>
                                    <li><svg class="icon-benefit-list" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>
                                        Ưu tiên hỗ trợ 24/7</li>
                                </ul>
                            </dd>
                        </dl>
                `;
                    orderdetail.appendChild(datadetail);
            }
            else {
                console.log(result.error);
            }
        }
        catch (error) {
            console.error("Error:", error);
        }
    }
//hiển thị modal
$(document).ready(function () {
    $('#confirm-require').on('click', function (event) {
        event.preventDefault();
        $('#confirmOrderModal').modal('show');
        document.body.style.paddingRight = '0px'; 
    });
    $('.cancelOrderNo').on('click', function () {
        // Đóng modal popup
        $('#confirmOrderModal').modal('hide');
    });
    $('#confirmOrderModal').on('hidden.bs.modal', function () {
        // Đóng modal popup khi nó được ẩn đi
        $('#confirmOrderModal').modal('hide');
    });
});

    async function AcceptConfirm() {
        const tokenAdmin = localStorage.getItem('tokenAdmin');
        try {
            const response = await fetch(`/api/upgrade/acceptupgr/${getIdFromUrl()}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + tokenAdmin
                }
            });
            const result = await response.json();
            if (result.success && result.data) {
               LoadOrderData();
               const modal = document.getElementById('confirmOrderModal');
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
    document.getElementById('btnconfirmupgrade').addEventListener('click',AcceptConfirm);
    document.addEventListener('DOMContentLoaded', () => {
        checkTokenAndExecute(LoadOrderData);
    });
