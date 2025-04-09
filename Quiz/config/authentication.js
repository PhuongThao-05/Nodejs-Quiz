const jwt = require('jsonwebtoken');
const ResponseModel= require( '../models/response/ResponseModel');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // Lấy token từ header

    if (!token) return res.sendStatus(401); // Nếu không có token, trả về 401

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
            return res.status(401).json(new ResponseModel.ResponseModel(false, 'Token đã hết hạn'));
            }
            return res.status(403).json(new ResponseModel.ResponseModel(false, 'Token không hợp lệ'));
          }
        req.user = user; // Lưu thông tin người dùng vào request
        next(); // Tiếp tục đến middleware hoặc route tiếp theo
    });
};
const checkRole = (roles) => {
    return (req, res, next) => {
        const user = req.user; // Giả sử bạn đã xác thực và lưu thông tin người dùng vào req.user

        // Kiểm tra xem vai trò của người dùng có nằm trong danh sách vai trò cho phép không
        if (user && roles.includes(user.identify)) {
            return next(); // Cho phép truy cập
        }

        return res.status(403).json({
            success: false,
            message: "Forbidden: You don't have permission to access this resource."
        });
    };
};
function requireRegister(req, res, next) {
    if (!req.session.username) {
      return res.redirect('/user/register');
    }
    next(); // Nếu đã đăng nhập, tiếp tục truy cập trang
  }
module.exports = {authenticateToken,checkRole,requireRegister};

