const express = require('express');
const router = express.Router();
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');
const { Op, where } = require('sequelize'); // Import Sequelize operators
const moment = require('moment-timezone');
const { Document, Packer, Paragraph, TextRun } = require("docx");
const fs = require("fs");
const path = require("path");
//router lấy danh câu hỏi của 1 đề chế độ bình thường
router.get('/lstques/:id', async (req, res) => {
    try {
        const deId=req.params.id;
        const questions = await db.cauhoi.findAll({
            order:[['macauhoi', 'ASC']],
            where:{
               made:deId,
               statecauhoi:true
            }
        }); 
        // Duyệt qua từng câu hỏi để lấy đáp án
        const questionsWithAnswers = await Promise.all(
            questions.map(async (question) => {
                const answers = await db.dapan.findAll({
                    order: [['madapan', 'ASC']],
                    where: {
                        macauhoi: question.macauhoi
                    },
                    attributes: ['noidung']
                });

                return {
                    ...question.dataValues, // Dữ liệu câu hỏi
                    answers: answers.map(answer => answer.noidung) // Chỉ lấy nội dung đáp án
                };
            })
        );   
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, questionsWithAnswers));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching questions', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false,errorResponse));
    }
});
//router lấy danh câu hỏi của 1 đề chế độ random
router.get('/quesintest/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const deId=req.params.id;
        const questions = await db.cauhoi.findAll({
            order: db.sequelize.random(), // Sắp xếp ngẫu nhiên
            where:{
               made:deId,
               statecauhoi:true
            },
            include:[{
                model:db.de,
                attributes:['tende']
            }]
        }); 
        // Duyệt qua từng câu hỏi để lấy đáp án
        const questionsWithAnswers = await Promise.all(
            questions.map(async (question) => {
                const answers = await db.dapan.findAll({
                    order: db.sequelize.random(),
                    where: {
                        macauhoi: question.macauhoi
                    },
                    attributes: ['noidung','checkdapan']
                });
                return {
                    ...question.dataValues, // Dữ liệu câu hỏi
                    answers: answers.map(answer => ({
                        noidung: answer.noidung, // Nội dung đáp án
                        checkdapan: answer.checkdapan // Trạng thái đúng/sai của đáp án
                    }))
                };
            })
        );       
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, questionsWithAnswers));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching questions', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false,errorResponse));
    }
});
//router 1 câu hỏi
router.get('/singleques/:id',authenticateToken,checkRole([true,false]), async (req, res) => {
    try {
        const questionId=req.params.id;
        const question = await db.cauhoi.findOne({
            where:{
                macauhoi:questionId,
            }
        });
        if (!question) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Question not found', null));
        }
        // Truy vấn các đáp án cho câu hỏi
        const dapan = await db.dapan.findAll({
            order:[["madapan","ASC"]],
            where: {
                macauhoi: question.macauhoi,
            }
        });

        // Kết hợp câu hỏi và đáp án
        const quesandans = {
            ...question.dataValues, // Gán tất cả các thuộc tính của câu hỏi
            dapan // Gán danh sách đáp án
        };

        return res.status(200).json(new ResponseModel.ResponseModel(true, null, quesandans));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching questions', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false,errorResponse));
    }
});
// Route để thêm câu hỏi
router.post('/addques/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const deId=req.params.id;
        const {cauhoi} = req.body;
        const question = await db.cauhoi.create({
            made:deId,
            cauhoi,
            statecauhoi:true,
        });
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, question));
    } catch (error) {
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching question', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//sửa thông tin câu hỏi
router.put('/updateques/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const id = req.params.id; // Lấy id từ tham số URL
        const {cauhoi} = req.body; // Lấy dữ liệu từ body request
        const question = await db.cauhoi.findByPk(id);

        if (!question) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Question not found', null));
        }

        // Cập nhật các trường của bản ghi
        question.cauhoi = cauhoi || question.cauhoi;
        await question.save();

        // Phản hồi thành công
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, question));
    } catch (error) {
        // Xử lý lỗi
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error updating question', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//de-active câu hỏi
router.put("/delques/:id",authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const id = req.params.id; // Lấy id từ tham số URL
        const question = await db.cauhoi.findByPk(id);

        if (!question) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Question not found', null));
        }
        question.statecauhoi = false;
        await question.save();

        return res.status(200).json(new ResponseModel.ResponseModel(true,"De active question successfully!",question));
    } catch (err) {
        return res.status(500).json(new ResponseModel.ResponseModel(false,new ResponseModel.ErrorResponseModel(1, "INTERNAL_SERVER_ERROR", err.message),null));
    }
});
//tải câu hỏi
router.get("/download-exam/:id", async (req, res) => {
  try {
    const deId = req.params.id;
    const de = await db.de.findByPk(deId, {
        attributes: ['tende']
    });
    const tende = de.get('tende');
    console.log('tende',tende);
    const questions = await db.cauhoi.findAll({
      order: [['macauhoi', 'ASC']],
      where: {
        made: deId,
        statecauhoi: true
      }
    });
    console.log(questions);
    if (questions.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy câu hỏi hoặc đề thi" });
    }

    // Duyệt qua từng câu hỏi để lấy đáp án
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await db.dapan.findAll({
          order: [['madapan', 'ASC']],
          where: {
            macauhoi: question.macauhoi
          },
          attributes: ['noidung', 'checkdapan']
        });

        return {
          ...question.dataValues, // Dữ liệu câu hỏi
          answers: answers.map(answer => ({
            noidung: answer.noidung,
            checkdapan: answer.checkdapan
          }))
        };
      })
    );

    // Tạo tài liệu Word
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: questionsWithAnswers.map((item, index) => [
            // Thêm số thứ tự câu hỏi trước nội dung
            new Paragraph({
              children: [new TextRun({ text: `Câu ${index + 1}: ${item.cauhoi}`, bold: true })],
            }),
            ...item.answers.map(answer =>
              new Paragraph({
                children: [new TextRun({
                  text: answer.noidung,
                  highlight: answer.checkdapan ? "yellow" : undefined, // Highlight nếu là đáp án đúng
                })],
              })
            ),
            new Paragraph({ text: "" }), // Thêm dòng trống sau mỗi câu hỏi
          ]).flat(),
        },
      ],
    });

    // Lưu tài liệu vào bộ nhớ tạm
    const buffer = await Packer.toBuffer(doc);
    const Filename = `${tende.replace(/[^a-zA-Z0-9_\-]/g, "_")}.docx`;
    // Gửi file Word tới client
    res.setHeader("Content-Disposition", `attachment; filename=${Filename}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buffer);
  } catch (error) {
    console.error(error); // Log lỗi ra console
    const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error generating Word file', [error.message]);
    res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
  }
});

module.exports = router;
