const express = require('express');
const router = express.Router();
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');
const { Op, where } = require('sequelize'); // Import Sequelize operators
const moment = require('moment-timezone');
//router lấy danh người dùng
router.get('/lstuser',authenticateToken,checkRole([true]), async (req, res) => {
    try {
        const userinfo = await db.nguoidung.findAll({
            order: [['id', 'ASC']], // Sắp xếp theo `id` tăng dần. Dùng 'DESC' để sắp xếp giảm dần.
        });
        const formatteduser = userinfo.map(userinfo => ({
            ...userinfo.dataValues,
           ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
           ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
        }));
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formatteduser));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching user', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false,errorResponse));
    }
});
//lấy thông tin của 1 user 
router.get('/userinfo',authenticateToken,checkRole([false]), async (req, res) => {
    const username = req.user.username; 
    try {
        const userinfo = await db.nguoidung.findOne({
            attributes: ['username','hoten','chucdanh','email', 'ngaybatdau', 'ngayketthuc'], 
            where:{
                username: username,
            }
        }); 

        if (!userinfo) {
            // Nếu không tìm thấy dữ liệu
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `User info with ID ${id} not found`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        const formatteduser ={
            ...userinfo.dataValues,
            ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
            ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
        };
        console.log(formatteduser.ngaybatdau);
        // Trả về dữ liệu nếu tìm thấy
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formatteduser));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching user info by ID', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//lấy thông tin của quyền lợi của user
router.get('/advantage',authenticateToken,checkRole([false]), async (req, res) => {
    const username = req.user.username; // Lấy ID từ URL
    try {
        const userinfo = await db.nguoidung.findOne({
            attributes: ['lanthi','sodethi','luottai'], 
            where:{
                username:username
            }
        }); 

        if (!userinfo) {
            // Nếu không tìm thấy dữ liệu
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `User info not found`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        const formatteduser ={
            ...userinfo.dataValues,
            ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
            ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
        };
        // Trả về dữ liệu nếu tìm thấy
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formatteduser));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching user info', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});

//tìm kiếm theo tên người dùng hoặc tên tài khoản
router.get('/userwith',authenticateToken,checkRole([true]), async (req, res) => {
    try {
        const name = req.query.name;
        const acc = req.query.acc;
        const userinfo = await db.nguoidung.findAll({
            where: {
                [Op.or]: [
                    { hoten: { [Op.like]: `%${name}%` } },  // Tìm theo tên
                    { username: { [Op.like]: `%${acc}%` } }  // Tìm theo username
                ]
            }
        });
    // Kiểm tra nếu không có kết quả nào
    if (userinfo.length === 0) {
        const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `No user info found with name: ${name} or with username: ${acc}`, []);
        return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
    const formatteduser = userinfo.map(userinfo => ({
             ...userinfo.dataValues,
            ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
            ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
         }));
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formatteduser));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching user', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
// Route để thêm thông tin người dùng
router.post('/adduser', async (req, res) => {
    try {
        const {username,hoten,chucdanh,email} = req.body;
        const accountType = await db.loaitk.findOne({
            where: { maloaitk: 1 },
            attributes: ['solanthi', 'solandangbai','solantai']
          });
        if(accountType.length===0)
        {
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `Not found account type`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        const userinfo = await db.nguoidung.create({
            username,
            maloaitk:1,
            hoten,
            chucdanh,
            email,
            ngaybatdau: new Date(),
            lanthi:accountType.solanthi,
            sodethi:accountType.solandangbai,
            luottai:accountType.solantai
        });
        const formatteduser ={
            ...userinfo.dataValues,
            ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
            ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
        };
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formatteduser));
    } catch (error) {
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching user', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//sửa thông tin user
router.put('/updateuser',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const username = req.user.username;
        const userinfo = await db.nguoidung.findOne({
            where: { username: username }
        });
        const {hoten,chucdanh,email} = req.body; 

        if (!userinfo) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found', null));
        }

        // Cập nhật các trường của bản ghi
        userinfo.hoten = hoten || userinfo.hoten;
        userinfo.chucdanh= chucdanh || userinfo.chucdanh;
        userinfo.email = email || userinfo.email;

        await userinfo.save();
        const formatteduser ={
            ...userinfo.dataValues,
            ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
            ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
        };
        // Phản hồi thành công
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formatteduser));
    } catch (error) {
        // Xử lý lỗi
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error updating user', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//kiểm soát lượt thi
router.put('/desctest', authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const { username } = req.user; // giả sử userId được lấy từ token xác thực

        // Tìm người dùng
        const userinfo = await db.nguoidung.findOne({
            where: { username: username},
        });

        if (!userinfo) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }

        if (userinfo.lanthi>0) {
            userinfo.lanthi -= 1;
            await userinfo.save();
            const formatteduser ={
                ...userinfo.dataValues,
                ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
                ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
            };
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'User account type updated successfully',formatteduser));
        } else {
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'The number of testing times has run out, no update needed'));
        }
    } catch (error) {
        console.error(error);
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error checking or updating testing', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//kiểm soát lượt tải
router.put('/descdownload', authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const { username } = req.user; // giả sử userId được lấy từ token xác thực

        // Tìm người dùng
        const userinfo = await db.nguoidung.findOne({
            where: { username: username},
        });

        if (!userinfo) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }

        if (userinfo.luottai>0) {
            userinfo.luottai -= 1;
            await userinfo.save();
            const formatteduser ={
                ...userinfo.dataValues,
                ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
                ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
            };
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'User account type updated successfully',formatteduser));
        } else {
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'The number of testing times has run out, no update needed'));
        }
    } catch (error) {
        console.error(error);
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error checking or updating testing', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//kiểm soát số lần đăng bài
router.put('/descposttopic', authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const { username } = req.user; // giả sử userId được lấy từ token xác thực

        // Tìm người dùng
        const userinfo = await db.nguoidung.findOne({
            where: { username: username},
        });

        if (!userinfo) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }

        if (userinfo.sodethi>0) {
            userinfo.sodethi -= 1;
            await userinfo.save();
            const formatteduser ={
                ...userinfo.dataValues,
                ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
                ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
            };
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'User account updated successfully',formatteduser));
        } else {
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'The number of posting topic times has run out, no update needed'));
        }
    } catch (error) {
        console.error(error);
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error checking or updating topic', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//kiểm tra hạn sử dụng tài khoản
router.put('/expire', authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const { username } = req.user; 
        const userinfo = await db.nguoidung.findOne({
            where: { 
                username: username,
                maloaitk: {
                    [Op.ne]: 1,
                }
            },
        });

        if (!userinfo) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Account valid',[]));
        }
        const accountType = await db.loaitk.findOne({
            where: { maloaitk: 1 },
            attributes: ['solanthi', 'solandangbai','solantai']
          });
        if(accountType.length===0)
        {
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `Not found account type`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        // Lấy ngày hiện tại với giờ
        const currentDateTime = moment(); // Ngày và giờ hiện tại
        const ngayketthuc = moment(userinfo.ngayketthuc); // Ngày kết thúc từ cơ sở dữ liệu

        // Kiểm tra xem ngày kết thúc có nhỏ hơn ngày hiện tại không
        if (ngayketthuc.isBefore(currentDateTime)) {
            // Cập nhật người dùng nếu ngày kết thúc nhỏ hơn ngày hiện tại
            userinfo.maloaitk = 1; // Cập nhật `maloaitk` thành 1
            userinfo.ngaybatdau = currentDateTime.format('YYYY-MM-DD HH:mm'); // Cập nhật ngày bắt đầu là ngày hiện tại với giờ
            userinfo.ngayketthuc = null; // Đặt ngày kết thúc là null
            userinfo.lanthi=accountType.solanthi;
            userinfo.sodethi=accountType.solandangbai;
            userinfo.luottai=accountType.solantai;
            // Lưu thay đổi
            await userinfo.save();
            const formatteduser ={
                ...userinfo.dataValues,
                ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
                ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
            };
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'User account type updated successfully',formatteduser));
        } else {
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'User account type is valid, no update needed'));
        }

    } catch (error) {
        console.error(error);
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error checking or updating account type', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//renew tiện ích tài khoản free
router.put('/renewaccount', authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const { username } = req.user; 
        const userinfo = await db.nguoidung.findOne({
            where: { 
                username: username,
                maloaitk:1,
            },
        });

        if (!userinfo) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Account not need renew',[]));
        }
        const accountType = await db.loaitk.findOne({
            where: { maloaitk: 1 },
            attributes: ['solanthi', 'solandangbai','solantai']
          });
        if(accountType.length===0)
        {
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `Not found account type`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        // Lấy ngày hiện tại với giờ
        const currentDateTime = moment(); // Ngày và giờ hiện tại
        const ngaybatdau = moment(userinfo.ngaybatdau); 

        if (ngaybatdau.isBefore(currentDateTime, 'month')) {
            // Cập nhật người dùng nếu sang tháng mới
            userinfo.ngaybatdau = currentDateTime.format('YYYY-MM-DD HH:mm'); // Cập nhật ngày bắt đầu là ngày hiện tại với giờ
            userinfo.ngayketthuc = null; // Đặt ngày kết thúc là null
            userinfo.lanthi=accountType.solanthi;
            userinfo.sodethi=accountType.solandangbai;
            userinfo.luottai=accountType.solantai;
            // Lưu thay đổi
            await userinfo.save();
            const formatteduser ={
                ...userinfo.dataValues,
                ngaybatdau: userinfo.ngaybatdau ? moment(userinfo.ngaybatdau).format('DD/MM/YYYY HH:mm') : null, // Định dạng ngày nếu không phải null
                ngayketthuc: userinfo.ngayketthuc ? moment(userinfo.ngayketthuc).format('DD/MM/YYYY HH:mm') : null // Định dạng ngày nếu không phải null
            };
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'User account type updated successfully',formatteduser));
        } else {
            return res.status(200).json(new ResponseModel.ResponseModel(true, 'User account type is valid, no update needed'));
        }

    } catch (error) {
        console.error(error);
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error checking or updating account type', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
module.exports = router;
