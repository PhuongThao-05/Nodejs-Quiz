const express = require('express');
const router = express.Router();
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');
const { Op, where, Model } = require('sequelize'); // Import Sequelize operators
const moment = require('moment-timezone');
const { Sequelize } = require('sequelize');
//router lấy danh sách yêu cầu nâng cấp tài khoản
router.get('/lstupgr', authenticateToken, checkRole([true]), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5; 
        const offset = parseInt(req.query.offset) || 0; 
        const { name } = req.query;
        
        let whereConditions = { statenc: true };

        if (name) {
            whereConditions['$nguoidung.hoten$'] = { [Op.iLike]: `%${name}%` };
        }

        const upgrade = await db.nangcaptk.findAll({
            order:[['manc','DESC']],
            where: whereConditions,
            include:[
                {
                    model: db.nguoidung,
                    attributes: ['hoten']
                },
                {
                    model: db.loaitk,
                    attributes: ['tenloaitk','gia']
                }
            ],
            limit: limit, 
            offset: offset
        });
        const totalItems = await db.nangcaptk.count({
            where: whereConditions,
            include:[
                {
                    model: db.nguoidung,
                    attributes: ['hoten']
                },
                {
                    model: db.loaitk,
                    attributes: ['tenloaitk','gia']
                }
            ]
        });
        const formattedupgrade = upgrade.map(upgrade => ({
            ...upgrade.dataValues,
            ngaythanhtoan: moment(upgrade.ngaythanhtoan).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        }));
        
        return res.status(200).json({
            success: true,
            data: formattedupgrade,
            totalItems: totalItems
        });
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching upgrades', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//lấy thông tin yêu cầu theo mã
router.get('/rqupgr/:id', authenticateToken, checkRole([true]), async (req, res) => {
    try {
        const idnc=req.params.id;
        const upgrade = await db.nangcaptk.findOne({
            where:{
                manc:idnc,
            },
            include:[
                {
                    model: db.nguoidung,
                    attributes: ['hoten']
                },
                {
                    model: db.loaitk,
                    attributes: ['tenloaitk','gia','solanthi','solantai','solandangbai']
                }
            ]
        });
        const formattedupgrade = {
            ...upgrade.dataValues,
            ngaythanhtoan: moment(upgrade.ngaythanhtoan).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        };
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedupgrade));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching upgrades', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//router lấy yêu cầu nâng cấp tài khoản của user
router.get('/myupgr', authenticateToken, checkRole([false]), async (req, res) => {
    try {
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });

        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }
        const upgrade = await db.nangcaptk.findOne({
            where:{
                id:nguoidung.id,
                xacnhan:false
            }
        });
        if (!upgrade) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'No upgrade found'));
        }
        const formattedupgrade ={
            ...upgrade.dataValues,
            ngaythanhtoan: moment(upgrade.ngaythanhtoan).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        };
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedupgrade));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching upgrades', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//tìm đơn hàng cần nâng cấp
router.get('/requpgr',authenticateToken,checkRole([true]), async (req, res) => {
    try {
        const xacnhan = req.query.xacnhan;
        const upgrade = await db.nangcaptk.findAll({
            where: {
                xacnhan: xacnhan
            }
        });
    // Kiểm tra nếu không có kết quả nào
    if (upgrade.length === 0) {
        const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `No upgrade found with status requirement upgrade: ${xacnhan}`, []);
        return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
    const formattedupgrade = upgrade.map(upgrade => ({
        ...upgrade.dataValues,
        ngaythanhtoan: moment(upgrade.ngaythanhtoan).format('DD/MM/YYYY HH:mm') // Định dạng ngày
    }));
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedupgrade));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching status requirement upgrade', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
// Route yêu cầu nâng cấp tài khoản
router.post('/addupgrade',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        console.log('Dữ liệu yêu cầu từ client:', req.body);
        const username = req.user.username; // Lấy username từ req.user
        console.log('Username lấy từ req.user:', username);
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });
        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }
        const { maloaitk, orderid } = req.body; // Lấy giá trị maloaitk từ req.body

            // Kiểm tra nếu maloaitk không tồn tại
            if (!maloaitk || !orderid) {
                return res.status(400).json(new ResponseModel.ResponseModel(false, 'Missing required fields'));
            }
            console.log('Orderid:', orderid,maloaitk,nguoidung.id,new Date(),false);
            const upgrade = await db.nangcaptk.create({
                orderid:orderid,
                maloaitk:maloaitk,
                id: nguoidung.id,
                ngaythanhtoan:new Date(),
                xacnhan:false,
                statenc:true
        });
        const formattedupgrade = {
            ...upgrade.dataValues,
            ngaythanhtoan: moment(upgrade.ngaythanhtoan).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        };
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedupgrade));
    } catch (error) {
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching require upgrade account', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//cập nhật nâng cấp tại khoản
router.put('/acceptupgr/:id',authenticateToken,checkRole([true]), async (req, res) => {
    try {
        const ncid = req.params.id; // Lấy id từ tham số URL

        const upgrade = await db.nangcaptk.findByPk(ncid);

        if (!upgrade) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Upgrade account not found', null));
        }
        // Cập nhật các trường của bản ghi
        upgrade.xacnhan = true;
        await upgrade.save();

     // Kiểm tra nếu xacnhan là true thì cập nhật bảng người dùng
    if (upgrade.xacnhan) {
    // Lấy thông tin tài khoản người dùng từ bảng nguoidung
    const user = await db.nguoidung.findByPk(upgrade.id);

    if (!user) {
        return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found', null));
    }

    // Cập nhật mã loại tài khoản người dùng từ bản ghi nâng cấp
    user.maloaitk = upgrade.maloaitk;
    user.ngaybatdau = new Date(); // Ngày bắt đầu là hiện tại

    // Tìm loại tài khoản theo mã `maloaitk` để xác định thời gian hiệu lực
    const accountType = await db.loaitk.findByPk(upgrade.maloaitk);

    if (!accountType) {
        return res.status(404).json(new ResponseModel.ResponseModel(false, 'Account type not found', null));
    }

        // Xác định thời gian hiệu lực dựa trên tên tài khoản tìm được
        if (accountType.tenloaitk.toLowerCase().includes('month')) {
            user.ngayketthuc = new Date(new Date().setMonth(new Date().getMonth() + 1));
        } else if (accountType.tenloaitk.toLowerCase().includes('quarter')) {
            user.ngayketthuc = new Date(new Date().setMonth(new Date().getMonth() + 3));
        } else if (accountType.tenloaitk.toLowerCase().includes('year')) {
            user.ngayketthuc = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        } else {
            // Đặt thời gian hết hạn mặc định hoặc xử lý các loại tài khoản khác
            user.ngayketthuc = null;
        }
        user.lanthi=accountType.solanthi;
        user.sodethi=accountType.solandangbai;
        user.luottai=accountType.solantai;
        // Lưu thay đổi vào cơ sở dữ liệu
        await user.save();

        const formattedupgrade = {
            ...upgrade.dataValues,
            ngaythanhtoan: moment(upgrade.ngaythanhtoan).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        };
        // Phản hồi thành công
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedupgrade));
    }
    } catch (error) {
        // Xử lý lỗi
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error updating upgrade', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//router lấy số liệu năm
router.get('/yeartostatistic', authenticateToken, checkRole([true]), async (req, res) => {
    try {
        const years = await db.nangcaptk.findAll({
            attributes: [
              [Sequelize.literal(`DISTINCT EXTRACT(YEAR FROM ngaythanhtoan)`), 'nam']
            ],
            order: [[Sequelize.literal('nam'), 'DESC']]
          });
          
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, years));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching years', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//router lấy số liệu theo tháng trong năm của đề
router.get('/databymonth', authenticateToken, checkRole([true]), async (req, res) => {
    try {
        const year = req.query.year; // Lấy giá trị năm từ query string

        // Kiểm tra xem year có tồn tại không
        if (!year) {
            return res.status(400).json(new ResponseModel.ResponseModel(false, 'Year is required'));
        }

        // Truy vấn dữ liệu từ cơ sở dữ liệu
        const income = await db.nangcaptk.findAll({
            attributes: [
                [Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM ngaythanhtoan')), 'nam'],
                [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM ngaythanhtoan')), 'thang'],
                [Sequelize.fn('SUM', Sequelize.col('gia')), 'income']
            ],
            include: [
                {
                    model: db.loaitk,
                    attributes: [] 
                }
            ],
            where:  Sequelize.and(
                {xacnhan:true},
                Sequelize.where(Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM "ngaythanhtoan"')), Op.eq, year) // So sánh năm trích xuất với năm truyền vào
            ),
            group: [
                Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM ngaythanhtoan')),
                Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM ngaythanhtoan'))
            ],
            order: [
                [Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM ngaythanhtoan')), 'ASC'],
                [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM ngaythanhtoan')), 'ASC']
            ],
            raw: true // Trả về dữ liệu dưới dạng đối tượng JavaScript thuần
        });

        // Trả kết quả
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, income));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching statistics', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
// Router xóa đơn bằng cách cập nhật trường statenc
router.put('/hideorder/:id',authenticateToken,checkRole([true]), async (req, res) => {
    try {
        const Idnc = req.params.id; // Lấy id từ tham số URL
        // Tìm đơn dựa vào id
        const order = await db.nangcaptk.findByPk(Idnc);
        if (!order) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Order not found', null));
        }
        order.statenc = false;

        // Lưu lại thay đổi
        await order.save();
        const formattedorder ={
            ...order.dataValues,
            ngaythanhtoan: moment(order.ngaythanhtoan).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        };
        // Phản hồi thành công
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedorder));
    } catch (error) {
        // Xử lý lỗi
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error hiding order', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
module.exports = router;
