const axios = require('axios');
const CryptoJS = require('crypto-js');
const express = require('express');
const router = express.Router();
const moment = require('moment');
const qs = require('qs');
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');

const ngrok = require('ngrok');  // Đảm bảo bạn đã cài ngrok

let ngrokUrl = null; // Biến lưu trữ URL ngrok

 // Đảm bảo ngrok được khởi tạo một lần khi server khởi động
 (async () => {
   await ngrok.authtoken(process.env.AUTH_TOKEN);
   ngrokUrl = await ngrok.connect(3000);
   console.log('Ngrok tunnel opened at:', ngrokUrl);
 })();

// APP INFO, STK TEST: 4111 1111 1111 1111
const config = {
  app_id: '2554',
  key1: 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn',
  key2: 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf',
  endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
};

/**
 * method: POST
 * Sandbox: POST https://sb-openapi.zalopay.vn/v2/create
 * Real: POST https://openapi.zalopay.vn/v2/create
 * description: tạo đơn hàng, thanh toán
 */
router.post('/payment', authenticateToken, checkRole([false]), async (req, res) => {
  const { accountType,username, amount,token } = req.body;

  // Kiểm tra ngrokUrl đã có giá trị hay chưa
  if (!ngrokUrl) {
    return res.status(500).json({ message: 'Ngrok tunnel is not ready' });
  }

  const ReturnUrl = `${ngrokUrl}/user/return`; // Sử dụng URL ngrok đã lưu
  const embed_data = {
    maloaitk: accountType,
    token:token,
    redirecturl: ReturnUrl, // URL khi thanh toán thành công
  };

  const items = []; // Danh sách các mục (items) trong đơn hàng (có thể bỏ qua nếu không có mục gì đặc biệt)
  const transID = Math.floor(Math.random() * 1000000); // Tạo ID giao dịch ngẫu nhiên
  const order = {
    app_id: config.app_id,
    app_trans_id: `${moment().format('YYMMDD')}${transID}`, // ID giao dịch
    app_user: username, // Thông tin người dùng
    app_time: Date.now(), // Thời gian tạo đơn
    item: JSON.stringify(items), // Chuyển items thành chuỗi JSON
    embed_data: JSON.stringify(embed_data), // Chuyển embed_data thành chuỗi JSON
    amount: amount, // Số tiền thanh toán
    callback_url: `${ngrokUrl}/api/payment/callback`, // URL callback nhận thông báo từ ZaloPay
    description: `Payment for the order #${transID}`, // Mô tả đơn hàng
    bank_code: '', // Mã ngân hàng (nếu có, để trống nếu không chọn ngân hàng cụ thể)
  };
  console.log(order);
  // Tạo chuỗi dữ liệu cần thiết để tính toán MAC
  const data =
    config.app_id +
    '|' +
    order.app_trans_id +
    '|' +
    order.app_user +
    '|' +
    order.amount +
    '|' +
    order.app_time +
    '|' +
    order.embed_data +
    '|' +
    order.item;
    console.log(data);
  // Tính toán MAC
  order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();
  console.log(order.mac);
  try {
    // Gửi yêu cầu thanh toán đến ZaloPay
    const result = await axios.post(config.endpoint, null, { params: order });
    console.log(result);
    // Kiểm tra kết quả trả về và trả về URL thanh toán cho client
    if (result.data.return_code === 1) {
      console.log(result.data.order_url);
        // Nếu ZaloPay trả về thành công, trả về payment_url cho client
        return res.status(200).json({ success: true, data: result.data.order_url });
    } else {
        // Nếu có lỗi khi tạo đơn thanh toán
        return res.status(400).json({ success: false, message: result.data.return_message });
    }
} catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
}
});

/**
 * method: POST
 * description: callback để Zalopay Server call đến khi thanh toán thành công.
 * Khi và chỉ khi ZaloPay đã thu tiền khách hàng thành công thì mới gọi API này để thông báo kết quả.
 */
router.post('/callback', async (req, res) => {
  let result = {};
  console.log(req.body);

  try {
    const { data: dataStr, mac: reqMac } = req.body;

    // Tính toán lại MAC từ dữ liệu nhận được và so sánh với MAC gửi từ ZaloPay
    const mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    console.log('mac =', mac);

    // Kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // Callback không hợp lệ
      result.return_code = -1;
      result.return_message = 'mac not equal';
    } else {
      // Thanh toán thành công
      // Merchant cập nhật trạng thái cho đơn hàng ở đây
      const dataJson = JSON.parse(dataStr); // Giải mã chuỗi JSON từ ZaloPay
      console.log(
        "update order's status = success where app_trans_id =",
        dataJson['app_trans_id']
      );

      const app_trans_id = dataJson['app_trans_id'];
      const embedData = JSON.parse(dataJson.embed_data || '{}');
      const maloaitk = embedData.maloaitk; // Lấy maloaitk từ embed_data
      const token=embedData.token;

      // Gọi API kiểm tra trạng thái đơn hàng
      try {
        const response = await axios.post('http://localhost:3000/api/payment/check-status-order', { app_trans_id });
        const { return_code, sub_return_code, is_processing } = response.data;

        if (return_code === 1 && sub_return_code === 1 && !is_processing) {
          console.log(`Giao dịch thành công: ${app_trans_id}`);
          // Xử lý cập nhật thông tin giao dịch thành công vào DB
          console.log(maloaitk,app_trans_id,token);
          const upgradeAccount = await axios.post('http://localhost:3000/api/upgrade/addupgrade',{
            maloaitk: maloaitk, 
            orderid: app_trans_id
          }, 
          {
            headers: {
              'Authorization': `Bearer ${token}`, // Thêm token vào header nếu cần
              'Content-Type': 'application/json', // Đảm bảo đúng Content-Type
            }
          }
        );
          console.log(upgradeAccount.data);
        } else {
          console.log(`Giao dịch thất bại hoặc đang xử lý: ${app_trans_id}`);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái giao dịch:', error.message);
      }

      result.return_code = 1;
      result.return_message = 'success';
    }
  } catch (ex) {
    console.log('lỗi:::' + ex.message);
    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }

  // Thông báo kết quả cho ZaloPay server
  res.json(result);
});

/**
 * method: POST
 * Sandbox	POST	https://sb-openapi.zalopay.vn/v2/query
 * Real	POST	https://openapi.zalopay.vn/v2/query
 * description:
 * Khi user thanh toán thành công,
 * ZaloPay sẽ gọi callback (notify) tới merchant để merchant cập nhật trạng thái
 * đơn hàng Thành Công trên hệ thống. Trong thực tế callback có thể bị miss do lỗi Network timeout,
 * Merchant Service Unavailable/Internal Error...
 * nên Merchant cần hiện thực việc chủ động gọi API truy vấn trạng thái đơn hàng.
 */
router.post('/check-status-order', async (req, res) => {
  const { app_trans_id } = req.body;

  const postData = {
    app_id: config.app_id,
    app_trans_id, // Input your app_trans_id
  };

  const data = postData.app_id + '|' + postData.app_trans_id + '|' + config.key1; // appid|app_trans_id|key1
  postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  const postConfig = {
    method: 'post',
    url: 'https://sb-openapi.zalopay.vn/v2/query',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify(postData),
  };

  try {
    const result = await axios(postConfig);
    return res.status(200).json(result.data);
  } catch (error) {
    console.log('lỗi');
    console.log(error);
    return res.status(500).json({ message: 'An error occurred while checking order status' });
  }
});
router.get('/return', async (req, res) => {
  const {status} = req.query;
  console.log(parseInt(status, 10));
  let message;
  try{
  if (parseInt(status, 10) === 1) {
      message={
        title: "Bạn đã đăng ký nâng cấp tài khoản thành công!",
        message:"Vui lòng chờ đợi yêu cầu được xét duyệt!"
      }
  }
  else {
    message={
      title: "Bạn đã đăng ký nâng cấp tài khoản thất bại!",
      message:"Vui lòng thử lại!"
    }
  }
  console.log(message);
    return res.status(200).json(new ResponseModel.ResponseModel(true, null, message));
  }
  catch (error) {
    console.error(error); // Log lỗi ra console
    const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error', [error.message]);
    return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
  }
});

module.exports = router;
