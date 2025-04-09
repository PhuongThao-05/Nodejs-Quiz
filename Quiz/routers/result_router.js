const express = require('express');
const router = express.Router();
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');
const { Op, where } = require('sequelize'); // Import Sequelize operators
const moment = require('moment-timezone');
//router lấy danh kết quả thi của 1 người dùng
router.get('/lstres', authenticateToken, checkRole([false]), async (req, res) => {
    try {
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });

        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }

        // Lấy tham số phân trang từ query string
        const limit = parseInt(req.query.limit) || 5;  // Mặc định là 5 nếu không có tham số
        const offset = parseInt(req.query.offset) || 0;  // Mặc định là 0 nếu không có tham số

        // Lấy tham số endDate từ query string (nếu có)
        const endDate = req.query.endDate ? moment(req.query.endDate, 'DD/MM/YYYY').startOf('day') : null;

        // Tạo đối tượng where để lọc dữ liệu
        const where = {
            id: nguoidung.id,
        };

        // Nếu có endDate, thêm điều kiện so sánh ngày hoàn thành bài thi vào where
        if (endDate) {
            where.thoigianhoanthanhbaithi = {
                [db.Sequelize.Op.gte]: endDate.toDate(),  // So sánh thời gian hoàn thành lớn hơn hoặc bằng 00:00 của ngày endDate
                [db.Sequelize.Op.lt]: endDate.clone().endOf('day').toDate()  // So sánh thời gian hoàn thành nhỏ hơn 23:59 của ngày endDate
            };
        }

        const results = await db.ketqua.findAll({
            order: [['thoigianhoanthanhbaithi', 'DESC']],
            include: [
                {
                    model: db.nguoidung,
                    attributes: ['hoten']
                },
                {
                    model: db.de,
                    attributes: ['tende']
                }
            ],
            where: where,  // Sử dụng điều kiện where đã xây dựng
            limit: limit, // Số bản ghi trên mỗi trang
            offset: offset // Bắt đầu từ vị trí offset 
        });

        const formattedresult = results.map(result => ({
            ...result.dataValues,
            thoigianhoanthanhbaithi: moment(result.thoigianhoanthanhbaithi).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        }));

        // Tính toán tổng số bản ghi để frontend có thể tính được số trang
        const totalItems = await db.ketqua.count({
            where: where
        });

        return res.status(200).json({
            success: true,
            data: formattedresult,
            totalItems: totalItems  // Send total number of items for pagination
        });
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching results', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//lấy kết quả gần đây của người dùng của 1 đề thi
router.get('/resultwithtopic/:id', authenticateToken, checkRole([false]), async (req, res) => {
    try {
        const made=req.params.id;
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });

        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }

        const results = await db.ketqua.findAll({
            order: [['thoigianhoanthanhbaithi', 'DESC']],
            include: [
                {
                    model: db.nguoidung,
                    attributes: ['hoten']
                },
                {
                    model: db.de,
                    attributes: ['tende']
                }
            ],
            where: {
                id:nguoidung.id,
                made:made,
            }, 
            limit: 5
        });

        const formattedresult = results.map(result => ({
            ...result.dataValues,
            thoigianhoanthanhbaithi: moment(result.thoigianhoanthanhbaithi).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        }));

        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedresult));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching results', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//Điểm số trong 1 tháng
router.get('/resultinmonth/:id', authenticateToken, checkRole([false]), async (req, res) => {
    try {
        const made=req.params.id;
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });

        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }

        const month = req.query.month; // Ví dụ tháng 1
        const year = req.query.year; // Ví dụ năm 2023
        const results = await db.ketqua.findAll({
            where: {
                made: made,
                id: nguoidung.id,
                [db.Sequelize.Op.and]: [
                    db.sequelize.where(
                        db.sequelize.fn('EXTRACT', db.sequelize.literal("MONTH FROM thoigianhoanthanhbaithi")),
                        month
                    ),
                    db.sequelize.where(
                        db.sequelize.fn('EXTRACT', db.sequelize.literal("YEAR FROM thoigianhoanthanhbaithi")),
                        year
                    )
                ]
            },
            order: [['thoigianhoanthanhbaithi', 'ASC']] // Sắp xếp theo ngày hoàn thành
        });
        
        
        const formattedresult = results.map(result => ({
            ...result.dataValues,
            thoigianhoanthanhbaithi: moment(result.thoigianhoanthanhbaithi).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        }));

        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedresult));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching results', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
// Route để thêm kết quả thi
router.post('/addres/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });
        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }
        const deid=req.params.id;
        const tongSoCauHoi = await db.cauhoi.count({
            where: { made: deid,statecauhoi:true }
        });
        console.log(tongSoCauHoi);
        const {diemso,socausai,socaudung,thoigianlambai} = req.body;
        if(diemso<0)
            {
                return res.status(400).json(new ResponseModel.ResponseModel(false, {
                    code: 'VALIDATION_ERROR',
                    message: 'The score must be at least 0',
                    details: ['Score cannot be a negative value']
                })); 
            }
        const xeploaikq = 
        diemso < 5 ? 'Yếu' :
        diemso < 7 ? 'Trung Bình' :
        diemso < 8.5 ? 'Khá' :
        diemso < 10 ? 'Giỏi' :
        diemso === 10 ? 'Xuất Sắc' : null;
        if(socausai+socaudung<tongSoCauHoi||socausai+socaudung>tongSoCauHoi)
        {
            return res.status(400).json(new ResponseModel.ResponseModel(false, {
                code: 'VALIDATION_ERROR',
                message: 'The sum of the number of questions is incorrect',
                details: ['The sum of the number of true and false answers must equal the total number of questions.']
            })); 
        }
        const result = await db.ketqua.create({
            made:deid,
            id:nguoidung.id,
            diemso, 
            xeploai:xeploaikq,
            tongsocauhoi:tongSoCauHoi,
            socaudung:parseInt(socaudung),
            socausai:parseInt(socausai),
            thoigianlambai,
            thoigianhoanthanhbaithi:new Date()
        });
        const formattedresult ={
            ...result.dataValues,
            thoigianhoanthanhbaithi: moment(result.thoigianhoanthanhbaithi).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        };
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedresult));
    } catch (error) {
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching result', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//xóa kết quả
router.delete("/lstres/:id",authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const kqid = req.params.id;

        // Kiểm tra có tồn tại hay không
        const existingres = await db.ketqua.findByPk(kqid);
        if (!existingres) {
            return res.status(404).json(new ResponseModel.ResponseModel( false, "Result not exists", null));
        }
       
        await db.ketqua.destroy({ where: { makq: kqid } });

        return res.status(200).json(new ResponseModel.ResponseModel(true, null,"Delete result successfully!"));
    } catch (err) {
        return res.status(500).json(new ResponseModel.ResponseModel(false,new ResponseModel.ErrorResponseModel(1, "INTERNAL_SERVER_ERROR", err.message),null));
    }
});
module.exports = router;
