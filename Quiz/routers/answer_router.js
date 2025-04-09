const express = require('express');
const router = express.Router();
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');
const { Op, where } = require('sequelize'); // Import Sequelize operators
const moment = require('moment-timezone');
//router lấy danh đáp án của 1 câu hỏi chế độ bình thường
router.get('/lstans/:id',authenticateToken,checkRole([true,false]), async (req, res) => {
    try {
        const quesId=req.params.id;
        const answers = await db.dapan.findAll({
            order:[['madapan', 'ASC']],
            include:[{
                model: db.cauhoi,
                attributes: ['cauhoi'], 
            }],
            where:{
               macauhoi:quesId
            }
        });        
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, answers));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching answers', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false,errorResponse));
    }
});
//router lấy danh sách câu trả lời của 1 câu hỏi chế độ random
router.get('/ansintest/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const quesId=req.params.id;
        const answers = await db.dapan.findAll({
            order:db.sequelize.random(),
            include:[{
                model: db.cauhoi,
                attributes: ['cauhoi'], 
            }],
            where:{
               macauhoi:quesId
            }
        });        
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, answers));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching answers', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false,errorResponse));
    }
});
// Route để thêm đáp án
router.post('/addans/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const ansId=req.params.id;
        const {noidung,checkdapan} = req.body;
        const answer = await db.dapan.create({
            macauhoi:ansId,
            noidung,
            checkdapan,
        });
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, answer));
    } catch (error) {
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching answer', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//sửa thông tin đáp án
router.put('/updateans/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const id = req.params.id; // Lấy id từ tham số URL
        const {noidung,checkdapan} = req.body; // Lấy dữ liệu từ body request

        const answer = await db.dapan.findByPk(id);

        if (!answer) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Answer not found', null));
        }

        // Cập nhật các trường của bản ghi
        answer.noidung = noidung || answer.noidung;
       if (answer.checkdapan !== checkdapan) {
        console.log('Updating checkdapan from', answer.checkdapan, 'to', checkdapan);
        answer.checkdapan = checkdapan; // Cập nhật nếu có thay đổi
        }
        await answer.save();
        // Phản hồi thành công
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, answer));
    } catch (error) {
        // Xử lý lỗi
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error updating answer', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//xóa đáp án
router.delete("/lstans/:id",authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const id = req.params.id;

        // Kiểm tra danh mục có tồn tại hay không
        const existingans = await db.dapan.findByPk(id);
        if (!existingans) {
            return res.status(404).json(new ResponseModel.ResponseModel( false, "Answer not exists", null));
        }
       
        await db.dapan.destroy({ where: { madapan: id } });

        return res.status(200).json(new ResponseModel.ResponseModel(true, null,"Delete answer successfully!"));
    } catch (err) {
        return res.status(500).json(new ResponseModel.ResponseModel(false,new ResponseModel.ErrorResponseModel(1, "INTERNAL_SERVER_ERROR", err.message),null));
    }
});
module.exports = router;
