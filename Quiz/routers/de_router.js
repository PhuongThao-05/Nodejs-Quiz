const express = require('express');
const router = express.Router();
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');
const { Op } = require('sequelize'); // Import Sequelize operators
const moment = require('moment-timezone');
const { Sequelize } = require('sequelize');

//router lấy danh sách đề
router.get('/gettopics', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
        const limit = parseInt(req.query.limit) || 6; // Số lượng đề thi mỗi trang, mặc định là 6
        const offset = (page - 1) * limit; // Số lượng đề thi cần bỏ qua
        const { level, school, monhoc } = req.query;
        
        // Khởi tạo điều kiện where
        let whereConditions = { statede: true };

        // Kiểm tra và xử lý tham số level và school
        if (level) {
            whereConditions.trinhdo = { [Op.like]: `%${level}%` };
        }

        if (school) {
            whereConditions.truong = { [Op.like]: `%${school}%` };
        }

        if (monhoc) {
            whereConditions.monhoc = { [Op.iLike]: `%${monhoc}%` };
        }

        // Lấy danh sách các đề thi với điều kiện truy vấn
        const topics = await db.de.findAll({
            order: [['made', 'DESC']], // Sắp xếp theo `made` tăng dần
            where: whereConditions,
            include: [{
                model: db.nguoidung,
                attributes: [["hoten", "author"]]
            }],
            limit: limit, // Giới hạn số lượng đề thi trả về
            offset: offset // Bỏ qua các đề thi đã qua
        });

        // Kiểm tra nếu không có kết quả nào
        if (topics.length === 0) {
            return res.status(200).json(new ResponseModel.ResponseModel(true, null, []));
        }

        // Tính toán số lượng câu hỏi và tổng lượt thi cho từng đề
        const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
            // Tính số lượng câu hỏi
            const questionCount = await db.cauhoi.count({
                where: {
                    made: topic.made,
                    statecauhoi: true
                }
            }) || 0;

            // Tính tổng lượt thi
            const totalLuotThi = await db.thongke.sum('luotthi', {
                where: {
                    made: topic.made
                }
            }) || 0;

            // Tính tổng lượt tải
            const totalLuotTai = await db.thongke.sum('luottai', {
                where: {
                    made: topic.made
                }
            }) || 0;

            return {
                ...topic.dataValues, // Gán các giá trị của đề
                questionCount, // Số lượng câu hỏi
                totalLuotThi, // Tổng lượt thi
                totalLuotTai, // Tổng lượt tải
                ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm'), // Định dạng ngày
                author: topic.nguoidung ? topic.nguoidung.author : 'Unknown'
            };
        }));

        // Tính tổng số đề thi
        const totalTopics = await db.de.count({
            where: whereConditions
        });
        // Tính tổng số trang
        const totalPages = Math.ceil(totalTopics / limit);
        // Trả về kết quả bao gồm thông tin phân trang
        res.status(200).json({
            success: true,
            data: topicsWithCounts,
            pagination: {
                totalTopics, // Tổng số đề thi
                totalPages, // Tổng số trang
                currentPage: page, // Trang hiện tại
                perPage: limit // Số lượng đề thi mỗi trang
            }
        });

    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching topics', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});

//lấy thông tin theo id
router.get('/gettopics/:id', async (req, res) => {
    const topicId = req.params.id; // Lấy ID từ URL
    try {
        const topic = await db.de.findOne(
            {
                where: {
                    made:topicId
                },
                include: [{
                    model: db.nguoidung,
                    attributes: [["hoten", "author"]]
                }]
            });

        if (!topic) {
            // Nếu không tìm thấy dữ liệu
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `Topic with ID ${topicId} not found`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
              // Tính số lượng câu hỏi
              const questionCount = await db.cauhoi.count({
                where: {
                    made: topic.made,
                    statecauhoi: true
                }
            }) || 0;
    
            // Tính tổng lượt thi
            const totalLuotThi = await db.thongke.sum('luotthi', {
                where: {
                    made: topic.made
                }
            }) || 0;
    
            // Tính tổng lượt tải
            const totalLuotTai = await db.thongke.sum('luottai', {
                where: {
                    made: topic.made
                }
            }) || 0;
    
            // Format dữ liệu
            const formattedTopic = {
                ...topic.dataValues,
                questionCount,
                totalLuotThi,
                totalLuotTai,
                ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm'),
                author: topic.nguoidung ? topic.nguoidung.author : 'Unknown'
            };
        // Trả về dữ liệu nếu tìm thấy
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedTopic));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching topic by ID', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//lấy danh sách câu hỏi của đề
router.get('/topicwithques/:id',authenticateToken,checkRole([false]), async (req, res) => {
    const topicId = req.params.id; // Lấy ID từ URL
    try {
        const topic = await db.de.findByPk(topicId); // Tìm theo khóa chính (primary key)

        if (!topic) {
            // Nếu không tìm thấy dữ liệu
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `Topic with ID ${topicId} not found`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        const codequestion=await db.cauhoi.findAll({
            attributes:  [['macauhoi', 'id']],
            where:{
                made:topic.made,
                statecauhoi:true
            }
        })
        const formattedTopic ={
            ...topic.dataValues,
            codequestion
        };
        // Trả về dữ liệu nếu tìm thấy
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedTopic));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching topic by ID', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//lấy danh sách đề thi của 1 user
router.get('/detailusertopics',authenticateToken,checkRole([true,false]), async (req, res) => {
    try {
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });
        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }
        const topics = await db.de.findAll({
            order: [['made', 'ASC']],
            where: {
                id: nguoidung.id, // Sử dụng giá trị id
                statede:true,
            }
        });
    // Kiểm tra nếu không có kết quả nào
    if (topics.length === 0) {
        const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `No topics found with user id: ${userid}`, []);
        return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
    const formattedTopics = topics.map(topic => ({
        ...topic.dataValues,
        ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm') // Định dạng ngày
    }));
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedTopics));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching user id', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//thông tin đề hiển thị ra của 1 user
router.get('/usertopics', authenticateToken, checkRole([true,false]), async (req, res) => {
    try {
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });
        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }
        
        const userId = nguoidung.id; // Sử dụng giá trị id
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 4; 
        const offset = (page - 1) * limit;
        const {monhoc} = req.query;

        let whereConditions = { statede: true, id: userId };       

        if (monhoc) {
            whereConditions.monhoc = { [Op.iLike]: `%${monhoc}%` };
        }

        // Truy vấn các đề
        const topics = await db.de.findAll({
            where: whereConditions,
            order: [['made', 'DESC']],
            limit:limit,
            offset:offset
        });    
        // Kiểm tra nếu không có kết quả nào
        if (topics.length === 0) {
            return res.status(200).json(new ResponseModel.ResponseModel(true, null, []));
        }
            // Tính toán số lượng câu hỏi và tổng lượt thi cho từng đề
        const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
            // Tính số lượng câu hỏi
            const questionCount = await db.cauhoi.count({
                where: {
                    made: topic.made,
                    statecauhoi: true
                }
            }) ||0;

            // Tính tổng lượt thi
            const totalLuotThi = await db.thongke.sum('luotthi', {
                where: {
                    made: topic.made
                }
            }) || 0; // Nếu không có lượt thi nào thì gán giá trị là 0
            // Tính tổng lượt thi
            const totalLuotTai = await db.thongke.sum('luottai', {
                where: {
                    made: topic.made
                }
            }) || 0; // Nếu không có lượt thi nào thì gán giá trị là 0

            return {
                ...topic.dataValues, // Gán các giá trị của đề
                questionCount, // Số lượng câu hỏi
                totalLuotThi, // Tổng lượt thi
                totalLuotTai, // Tổng lượt tải
                ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm') // Định dạng ngày
            };
        }));
            // Tính tổng số đề thi
            const totalTopics = await db.de.count({
                where: whereConditions
            });
            // Tính tổng số trang
            const totalPages = Math.ceil(totalTopics / limit);
          
            res.status(200).json({
                success: true,
                data: topicsWithCounts,
                pagination: {
                    totalTopics, // Tổng số đề thi
                    totalPages, // Tổng số trang
                    currentPage: page, // Trang hiện tại
                    perPage: limit // Số lượng đề thi mỗi trang
                }
            });
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching user id', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//lọc theo trình độ và trường học
router.get('/lvandschools', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
        const limit = parseInt(req.query.limit) || 6; // Số lượng đề thi mỗi trang, mặc định là 10
        const offset = (page - 1) * limit; // Số lượng đề thi cần bỏ qua
        const { level, school } = req.query;
        
        // Khởi tạo điều kiện where
        let whereConditions = { statede: true };
        
        if (level) {
            whereConditions.trinhdo = { [Op.like]: `%${level}%` };
        }
        
        if (school) {
            whereConditions.truong = { [Op.like]: `%${school}%` };
        }

        // Tìm kiếm đề thi dựa trên điều kiện
        const topics = await db.de.findAll({
            where: whereConditions,
            include: [{
                model: db.nguoidung,
                attributes: [["hoten", "author"]]
            }],
            order: [['made', 'ASC']],
            limit: limit, // Giới hạn số lượng đề thi trả về
            offset: offset // Bỏ qua các đề thi đã qua
        });

        // Kiểm tra nếu không có kết quả nào
        if (topics.length === 0) {
            return res.status(200).json(new ResponseModel.ResponseModel(true, null, []));
        }        

        // Tính toán số lượng câu hỏi và tổng lượt thi cho từng đề
        const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
            const questionCount = await db.cauhoi.count({
                where: {
                    made: topic.made,
                    statecauhoi: true
                }
            }) || 0;

            const totalLuotThi = await db.thongke.sum('luotthi', {
                where: { made: topic.made }
            }) || 0;

            const totalLuotTai = await db.thongke.sum('luottai', {
                where: { made: topic.made }
            }) || 0;

            return {
                    ...topic.dataValues, // Gán các giá trị của đề
                    questionCount, // Số lượng câu hỏi
                    totalLuotThi, // Tổng lượt thi
                    totalLuotTai, // Tổng lượt tải
                    ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm'), // Định dạng ngày
                    author: topic.nguoidung ? topic.nguoidung.author : 'Unknown' 
            };
        }));
                // Tính tổng số đề thi
                const totalTopics = await db.de.count({
                    where: whereConditions
                });


                // Tính tổng số trang
                const totalPages = Math.ceil(totalTopics / limit);

                // Trả về kết quả bao gồm thông tin phân trang
                res.status(200).json({
                    success: true,
                    data: topicsWithCounts,
                    pagination: {
                        totalTopics, // Tổng số đề thi
                        totalPages, // Tổng số trang
                        currentPage: page, // Trang hiện tại
                        perPage: limit // Số lượng đề thi mỗi trang
                    }
                });
    } catch (error) {
        console.error(error);
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching topics', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//tìm kiếm theo tên môn học trang chung
router.get('/searchsubject', async (req, res) => {
    try {
        const monhoc = req.query.monhoc;

        // Truy vấn các đề
        const topics = await db.de.findAll({
            where: {
                statede: true,
                monhoc: { [Op.like]: `%${monhoc}%` }
            },
            include: [{
                model: db.nguoidung,
                attributes: [["hoten", "author"]]
            }],
            order: [['made', 'ASC']]
        });    
        // Kiểm tra nếu không có kết quả nào
        if (topics.length === 0) {
            return res.status(200).json(new ResponseModel.ResponseModel(true, null, []));
        }
        // Tính toán số lượng câu hỏi và tổng lượt thi cho từng đề
        const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
            // Tính số lượng câu hỏi
            const questionCount = await db.cauhoi.count({
                where: {
                    made: topic.made,
                    statecauhoi: true
                }
            }) ||0;

            // Tính tổng lượt thi
            const totalLuotThi = await db.thongke.sum('luotthi', {
                where: {
                    made: topic.made
                }
            }) || 0; // Nếu không có lượt thi nào thì gán giá trị là 0
            // Tính tổng lượt thi
            const totalLuotTai = await db.thongke.sum('luottai', {
                where: {
                    made: topic.made
                }
            }) || 0; // Nếu không có lượt thi nào thì gán giá trị là 0

            return {
                ...topic.dataValues, // Gán các giá trị của đề
                questionCount, // Số lượng câu hỏi
                totalLuotThi, // Tổng lượt thi
                totalLuotTai, // Tổng lượt tải
                ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm'), // Định dạng ngày
                author: topic.nguoidung ? topic.nguoidung.author : 'Unknown' 
            };
        }));
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, topicsWithCounts));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching subject name', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//tìm kiếm theo tên môn học của user
router.get('/subject',authenticateToken,checkRole([true,false]), async (req, res) => {
    try {
        const monhoc = req.query.monhoc;
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });
        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }
        
        const userId = nguoidung.id; // Sử dụng giá trị id

        // Truy vấn các đề
        const topics = await db.de.findAll({
            where: {
                id: userId,
                statede: true,
                monhoc: { [Op.like]: `%${monhoc}%` }
            },
            order: [['made', 'ASC']]
        });    
        // Kiểm tra nếu không có kết quả nào
        if (topics.length === 0) {
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `No topics found with monhoc: ${monhoc}`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        // Tính toán số lượng câu hỏi và tổng lượt thi cho từng đề
        const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
            // Tính số lượng câu hỏi
            const questionCount = await db.cauhoi.count({
                where: {
                    made: topic.made,
                    statecauhoi: true
                }
            }) ||0;

            // Tính tổng lượt thi
            const totalLuotThi = await db.thongke.sum('luotthi', {
                where: {
                    made: topic.made
                }
            }) || 0; // Nếu không có lượt thi nào thì gán giá trị là 0
            // Tính tổng lượt thi
            const totalLuotTai = await db.thongke.sum('luottai', {
                where: {
                    made: topic.made
                }
            }) || 0; // Nếu không có lượt thi nào thì gán giá trị là 0

            return {
                ...topic.dataValues, // Gán các giá trị của đề
                questionCount, // Số lượng câu hỏi
                totalLuotThi, // Tổng lượt thi
                totalLuotTai, // Tổng lượt tải
                ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm') // Định dạng ngày
            };
        }));
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, topicsWithCounts));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching subject name', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});

// Route để thêm đề mới
router.post('/addtopic',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });
        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }
        
        const userId = nguoidung.id; // Sử dụng giá trị id

        const { tende, monhoc, trinhdo, truong} = req.body;
        const topic = await db.de.create({
            tende:tende,
            monhoc:monhoc,
            trinhdo:trinhdo,
            truong:truong,
            id:userId,
            ngaydang:new Date(),
            statede: true
        });
        const formattedTopic = {
            ...topic.dataValues,
            ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm')
        };
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedTopic));
    } catch (error) {
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching topic', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//sửa thông tin đề
router.put('/updatetopic/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const topicId = req.params.id; // Lấy id từ tham số URL
        const { tende, monhoc, trinhdo, truong } = req.body; // Lấy dữ liệu từ body request

        // Tìm đề thi dựa vào id
        const topic = await db.de.findByPk(topicId);

        // Kiểm tra nếu không tìm thấy đề thi
        if (!topic) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Topic not found', null));
        }
        // Cập nhật các trường của bản ghi
        topic.tende = tende || topic.tende;
        topic.monhoc = monhoc || topic.monhoc;
        topic.trinhdo = trinhdo || topic.trinhdo;
        topic.truong = truong || topic.truong;
        topic.ngaydang = new Date();

        // Lưu lại thay đổi
        await topic.save();
        const formattedTopic ={
            ...topic.dataValues,
            ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        };
        // Phản hồi thành công
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedTopic));
    } catch (error) {
        // Xử lý lỗi
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error updating topic', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
// Router xóa đề bằng cách cập nhật trường statede
router.put('/hidetopic/:id',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const topicId = req.params.id; // Lấy id từ tham số URL
        const {statede } = req.body; // Lấy dữ liệu từ body request

        // Tìm đề thi dựa vào id
        const topic = await db.de.findByPk(topicId);

        // Kiểm tra nếu không tìm thấy đề thi
        if (!topic) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Topic not found', null));
        }
        topic.statede = false;

        // Lưu lại thay đổi
        await topic.save();
        const formattedTopic ={
            ...topic.dataValues,
            ngaydang: moment(topic.ngaydang).format('DD/MM/YYYY HH:mm') // Định dạng ngày
        };
        // Phản hồi thành công
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, formattedTopic));
    } catch (error) {
        // Xử lý lỗi
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error hiding topic', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
module.exports = router;
