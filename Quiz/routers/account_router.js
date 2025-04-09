const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/connectdb'); // Giả sử bạn đã có mô hình cho người dùng
const router = express.Router();

const dotenv= require('dotenv');
const { where } = require('sequelize');
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY; // Sử dụng biến môi trường cho khóa bí mật

// Đăng ký tài khoản
router.post('/register', async (req, res) => {
    try {
        const { username, password} = req.body; 

        // Kiểm tra thông tin đầu vào
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }
        const existaccount= await db.taikhoan.findAll({
            where:{
                username:username
            }
        });
        if (existaccount.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới (newUser)
        const newUser = await db.taikhoan.create({
            username: username,
            password: hashedPassword,
            identify: false // true cho admin, false cho user
        });

        // Tạo token cho người dùng mới sau khi đã tạo tài khoản
        const token = jwt.sign({ username: newUser.username, identify: newUser.identify }, SECRET_KEY, {
            expiresIn: '1d' // Thời gian hết hạn token
        });

        // Cập nhật token vào tài khoản người dùng
        newUser.token = token;
        await newUser.save();
        req.session.username = username;
        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            token: token // Trả về token
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

//signup cho admin
router.post('/signupadmin', async (req, res) => {
    try {
        const { username, password} = req.body; 

        // Kiểm tra thông tin đầu vào
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }
        const existaccount= await db.taikhoan.findAll({
            where:{
                username:username
            }
        });
        if (existaccount.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.taikhoan.create({
            username: username,
            password: hashedPassword,
            identify: true 
        });

        const token = jwt.sign({ username: newUser.username, identify: newUser.identify }, SECRET_KEY, {
            expiresIn: '1d' // Thời gian hết hạn token
        });

        newUser.token = token;
        await newUser.save();
        return res.status(201).json({
            success: true,
            message: 'Account registered successfully.',
            token: token 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// Đăng nhập tài khoản
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kiểm tra thông tin đầu vào
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        // Tìm người dùng trong cơ sở dữ liệu
        const user = await db.taikhoan.findOne({ where: { username: username } });

        // Kiểm tra xem người dùng có tồn tại hay không
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username.' });
        }
        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Invalid password.' });
            }
        // Kiểm tra xem token đã hết hạn chưa
        const token = user.token; // Giả sử bạn đã lưu token vào database
        let newToken;
        if (token) {
            // Nếu có token, kiểm tra nó có hợp lệ không
            try {
                jwt.verify(token, SECRET_KEY);
                // Nếu token còn hợp lệ, trả về token hiện tại
                newToken=token;
            } catch (err) {
                // Nếu token đã hết hạn, tạo mới
                console.log('Token has expired, creating a new one.');
                newToken = jwt.sign({ username: user.username, identify: user.identify }, SECRET_KEY, {
                    expiresIn: '1d' // Thời gian hết hạn token
                });
                user.token = newToken; // Lưu token mới vào user
                await user.save(); // Lưu thay đổi
            }
        } else {
            // Nếu không có token, tạo mới
            newToken = jwt.sign({ username: user.username, identify: user.identify }, SECRET_KEY, {
                expiresIn: '1d' // Thời gian hết hạn token
            });
            user.token = newToken; // Lưu token vào user
            await user.save(); // Lưu thay đổi
        }
        const nguoidung= await db.nguoidung.findOne({
            where:{
                username:user.username,
            }
        });
        // Chuyển hướng đến trang khác tùy thuộc vào loại tài khoản
        if (user.identify) {
            // Nếu là admin, chuyển đến trang admin
            return res.status(200).json({
                success: true,
                message: 'Login successful. Redirecting to admin page.',
                identify: user.identify,
                token: newToken
            });
        } else {
            // Nếu là user, chuyển đến trang user
            return res.status(200).json({
                success: true,
                message: 'Login successful. Redirecting to user page.',
                identify: user.identify,
                token: newToken,
                hoten:nguoidung.hoten,
                username:nguoidung.username
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});
module.exports = router;
