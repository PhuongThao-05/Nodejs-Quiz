const express = require('express');
const router = express.Router();
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');
const { Op, where } = require('sequelize'); // Import Sequelize operators
const { Sequelize } = require('sequelize');
const moment = require('moment-timezone');

//router lấy số liệu 
router.get('/statistic', authenticateToken, checkRole([false]), async (req, res) => {
    try {
        const username = req.user.username;
        const user= await db.nguoidung.findOne({
        where:{
            username:username,
        }
        });
        if(!user)
        {
         return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found', null));
        }
        const deDaOn = await db.ketqua.count({
            include: [{
              model: db.nguoidung,
              attributes: [],
              where: { id: user.id },
            }]
          });
          const deDaTao = await db.de.count({
            include: [{
              model: db.nguoidung,
              attributes: [],
              where: { id: user.id }
            }],
            where: {
              statede: true
            }
          });
          const ketQua = await db.ketqua.findAll({
            attributes: [[Sequelize.fn('AVG', Sequelize.col('diemso')), 'diemThiTrungBinh']],
            include: [{
              model: db.nguoidung,
              attributes: [],
              where: { id: user.id }
            }],
            raw: true, 
          });          
          const diemThiTrungBinh = parseFloat(ketQua[0]?.diemThiTrungBinh).toFixed(2);
          res.status(200).json({
            success: true,
            data:{
                deDaOn,
                deDaTao,
                diemThiTrungBinh
            }
            });
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching statistics', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//lấy số liệu đơn hàng
router.get('/orderstatistic', authenticateToken, checkRole([true]), async (req, res) => {
    try {
        const orderconfirm = await db.nangcaptk.count({
          where:{
            xacnhan:true,
          }
          });
          const orderwaiting = await db.nangcaptk.count({
            where:{
              xacnhan:false,
            }
            });
         const totalorder = await db.nangcaptk.count();
          const income = await db.nangcaptk.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('gia')), 'income']
            ],
            include: [
                {
                    model: db.loaitk,
                    attributes: [] 
                }
            ],
            where: {xacnhan:true},
            raw: true, 
          });          
          res.status(200).json({
            success: true,
            data:{
                orderconfirm,
                orderwaiting,
                totalorder,
                income,
            }
            });
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching statistics', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//router lấy top topic
router.get('/toptopic', authenticateToken, checkRole([false]), async (req, res) => {
    try {
        const username = req.user.username;
        const user= await db.nguoidung.findOne({
        where:{
            username:username,
        }
        });
        if(!user)
        {
         return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found', null));
        }
        const topDe = await db.thongke.findAll({
            attributes: [
              [Sequelize.col('de.made'), 'made'], 
              [Sequelize.col('de.tende'), 'tende'], 
              [Sequelize.fn('SUM', Sequelize.col('thongke.luotthi')), 'luotthi'],
              [Sequelize.fn('SUM', Sequelize.col('thongke.luottai')), 'luottai'],
              [
                Sequelize.literal('SUM(thongke.luotthi) + SUM(thongke.luottai)'),
                'tuongtac'
              ]
            ],
            include: [
              {
                model: db.de,
                required: true,
                include: [
                  {
                    model: db.nguoidung,
                    where: { id: user.id }, 
                    required: true,
                    attributes: [] // Không lấy thêm cột nào từ bảng `nguoidung`
                  }
                ]
              }
            ],
            group: ['de.made', 'de.tende'], 
            order: [[Sequelize.literal('SUM(thongke.luotthi) + SUM(thongke.luottai)'), 'DESC']],
            limit: 5
          });
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, topDe));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching statistics', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//router lấy số liệu năm
router.get('/yeartostatistic', authenticateToken, checkRole([false]), async (req, res) => {
    try {
        const years = await db.thongke.findAll({
            attributes: [
              [Sequelize.literal(`DISTINCT EXTRACT(YEAR FROM ngaythuchien)`), 'nam']
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
router.get('/databymonth/:id', authenticateToken, checkRole([false]), async (req, res) => {
    try {
        const made = req.params.id;
        const year = req.query.year; // Lấy giá trị năm từ query string

        // Kiểm tra xem year có tồn tại không
        if (!year) {
            return res.status(400).json(new ResponseModel.ResponseModel(false, 'Year is required'));
        }

        // Truy vấn dữ liệu từ cơ sở dữ liệu
        const figure = await db.thongke.findAll({
            attributes: [
                ['made', 'made'],
                [Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM "ngaythuchien"')), 'nam'], // Tạo cột năm
                [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "ngaythuchien"')), 'thang'], // Tháng
                [Sequelize.fn('SUM', Sequelize.col('luotthi')), 'luotthi'], // Tổng lượt thi
                [Sequelize.fn('SUM', Sequelize.col('luottai')), 'luottai'], // Tổng lượt tải
            ],
            where:  Sequelize.and(
                { made: made },
                Sequelize.where(Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM "ngaythuchien"')), Op.eq, year) // So sánh năm trích xuất với năm truyền vào
            ),
            group: [
                Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM "ngaythuchien"')), // Nhóm theo năm
                Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "ngaythuchien"')), // Nhóm theo tháng
                'made'
            ],
            order: [
                [Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM "ngaythuchien"')), 'ASC'], // Sắp xếp theo năm
                [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "ngaythuchien"')), 'ASC'] // Sắp xếp theo tháng
            ]
        });

        // Trả kết quả
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, figure));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching statistics', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});


// Route thêm các lượt truy cập
router.post('/addaccess/:id', authenticateToken, checkRole([false]), async (req, res) => {
    const made = req.params.id;
    // Lấy ngày hiện tại theo múi giờ, chỉ lấy phần ngày
    const today = moment.tz("Asia/Ho_Chi_Minh").format('YYYY-MM-DD');
    try {
        // Tìm bản ghi với ngày thực hiện giống ngày hiện tại
        const existingRecord = await db.thongke.findOne({
            where: {
                made: made,
                ngaythuchien: today, // So sánh với ngày hiện tại
            },
        });

        if (existingRecord) {
            // Nếu đã tồn tại, cập nhật lượt thi và lượt tải
            existingRecord.luotthi += 1; // Cập nhật lượt thi
            await existingRecord.save(); // Lưu bản ghi đã cập nhật

            return res.status(200).json(new ResponseModel.ResponseModel(true, null, existingRecord));
        } else {
            // Nếu không tồn tại, thêm bản ghi mới
            const newRecord = await db.thongke.create({
                made: made,
                luotthi: 1,
                luottai: 0,
                ngaythuchien: today, // Lưu ngày hiện tại
            });
            return res.status(201).json(new ResponseModel.ResponseModel(true, null, newRecord));
        }
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error while processing your request', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
// Route thêm các lượt tải
router.post('/adddownload/:id', authenticateToken, checkRole([false]), async (req, res) => {
    const made = req.params.id;
    // Lấy ngày hiện tại theo múi giờ, chỉ lấy phần ngày
    const today = moment.tz("Asia/Ho_Chi_Minh").format('YYYY-MM-DD');
    try {
        // Tìm bản ghi với ngày thực hiện giống ngày hiện tại
        const existingRecord = await db.thongke.findOne({
            where: {
                made: made,
                ngaythuchien: today, // So sánh với ngày hiện tại
            },
        });

        if (existingRecord) {
            // Nếu đã tồn tại, cập nhật lượt thi và lượt tải
            existingRecord.luottai += 1; // Cập nhật lượt thi
            await existingRecord.save(); // Lưu bản ghi đã cập nhật

            return res.status(200).json(new ResponseModel.ResponseModel(true, null, existingRecord));
        } else {
            // Nếu không tồn tại, thêm bản ghi mới
            const newRecord = await db.thongke.create({
                made: made,
                luotthi: 0,
                luottai: 1,
                ngaythuchien: today, // Lưu ngày hiện tại
            });
            return res.status(201).json(new ResponseModel.ResponseModel(true, null, newRecord));
        }
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error while processing your request', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
module.exports = router;
