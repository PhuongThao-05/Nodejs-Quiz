const express = require('express');
const router = express.Router();
const db = require('../models/connectdb'); 
const ResponseModel= require( '../models/response/ResponseModel');
const { authenticateToken, checkRole } = require('../config/authentication');
const { Op, where } = require('sequelize'); // Import Sequelize operators
const moment = require('moment-timezone');

//router lấy danh loại tài khoản
router.get('/lsttype',authenticateToken,checkRole([true,false]), async (req, res) => {
    try {
        const typeaccs = await db.loaitk.findAll({
            order: [['maloaitk', 'ASC']], // Sắp xếp theo `id` tăng dần. Dùng 'DESC' để sắp xếp giảm dần.
        });        
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, typeaccs));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching type account', [error.message]);
        res.status(500).json(new ResponseModel.ResponseModel(false,errorResponse));
    }
});
//lấy thông tin của 1 loại tài khoản 
router.get('/lsttype/:id',authenticateToken,checkRole([true,false]), async (req, res) => {
    const typeid = req.params.id; // Lấy ID từ URL
    try {
        const typeacc = await db.loaitk.findOne({
            where:{
                maloaitk:typeid
            }
        }); 

        if (!typeacc) {
            // Nếu không tìm thấy dữ liệu
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `Type account with ID ${typeid} not found`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        // Trả về dữ liệu nếu tìm thấy
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, typeacc));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching type account by ID', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//lấy thông tin của loại tài khoản của người dùng
router.get('/mytypeacc',authenticateToken,checkRole([true,false]), async (req, res) => {
    try {
        const username = req.user.username; // Lấy username từ req.user
        const nguoidung = await db.nguoidung.findOne({
            where: { username: username }
        });

        if (!nguoidung) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'User not found'));
        }
        const typeacc = await db.loaitk.findOne({
            where:{
                maloaitk:nguoidung.maloaitk
            }
        }); 
        
        if (!typeacc) {
            // Nếu không tìm thấy dữ liệu
            const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `Type account with ID ${typeid} not found`, []);
            return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
        }
        const myuse= await db.nguoidung.findOne({
            where: { username: username },
            attributes:['lanthi','sodethi','luottai','ngaybatdau','ngayketthuc']
        });
        // Trả về dữ liệu nếu tìm thấy
        return res.status(200).json({
            success: true,
            data: typeacc,
            myuse: myuse
        });
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching type account by ID', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//tìm kiếm theo tên tài khoản
router.get('/packageacc', async (req, res) => {
    try {
        const type = req.query.type;
        const typeaccs = await db.loaitk.findAll({
            order:[['gia','ASC']],
            where: {
                tenloaitk: { [Op.like]: `%${type}%` }
            }
        });
    // Kiểm tra nếu không có kết quả nào
    if (typeaccs.length === 0) {
        const errorResponse = new ResponseModel.ErrorResponseModel('NOT_FOUND', `No type account name found with type name: ${type}`, []);
        return res.status(404).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, typeaccs));
    } catch (error) {
        console.error(error); // Log lỗi ra console
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching type account name', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
// Route để thêm mã loại tài khoản
router.post('/addtype',authenticateToken,checkRole([true]), async (req, res) => {
    try {
        const {tenloaitk,gia,solanthi,solandangbai} = req.body;
        if (gia < 0) {
            return res.status(400).json(new ResponseModel.ResponseModel(false, {
                code: 'VALIDATION_ERROR',
                message: 'Price must be at least 0',
                details: ['Price cannot be a negative value']
            }));
        }
        const typeacc = await db.loaitk.create({
            tenloaitk,
            gia,
            solanthi: solanthi !== undefined ? solanthi : 5,
            solandangbai: solandangbai !== undefined ? solandangbai : 5,
        });
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, typeacc));
    } catch (error) {
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching type account', [error.message]);
        console.log("Gia:", req.body.gia, typeof req.body.gia);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
// Route để lưu mã loại tài khoản được chọn
router.post('/storetype',authenticateToken,checkRole([false]), async (req, res) => {
    try {
        const { selectedPackage} = req.body;
        
        if (!Array.isArray(selectedPackage) || selectedPackage.length === 0) {
            return res.status(400).json(new ResponseModel.ResponseModel(false, {
                code: 'ERROR',
                message: 'Package not found.',
                details: ['Not receiving your package.']
            }));
        }
        req.session.package=selectedPackage;
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, selectedPackage));
    } catch (error) {
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error fetching type account', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//sửa thông tin type
router.put('/updatetype/:id',authenticateToken,checkRole([true]), async (req, res) => {
    try {
        const typeid = req.params.id; // Lấy id từ tham số URL
        const {tenloaitk,gia,solanthi,solandangbai} = req.body; // Lấy dữ liệu từ body request
        if (gia < 0) {
            return res.status(400).json(new ResponseModel.ResponseModel(false, {
                code: 'VALIDATION_ERROR',
                message: 'Price must be at least 0',
                details: ['Price cannot be a negative value']
            }));
        }

        const typeacc = await db.loaitk.findByPk(typeid);

        if (!typeacc) {
            return res.status(404).json(new ResponseModel.ResponseModel(false, 'Type account not found', null));
        }

        // Cập nhật các trường của bản ghi
        typeacc.tenloaitk = tenloaitk || typeacc.tenloaitk;
        typeacc.gia = gia || typeacc.gia;
        typeacc.solanthi = solanthi !== undefined ? solanthi : typeacc.solanthi;
        typeacc.solandangbai = solandangbai !== undefined ? solandangbai : typeacc.solandangbai;

        await typeacc.save();

        // Phản hồi thành công
        return res.status(200).json(new ResponseModel.ResponseModel(true, null, typeacc));
    } catch (error) {
        // Xử lý lỗi
        const errorResponse = new ResponseModel.ErrorResponseModel('INTERNAL_SERVER_ERROR', 'Error updating type account', [error.message]);
        return res.status(500).json(new ResponseModel.ResponseModel(false, errorResponse));
    }
});
//xóa type
router.delete("/lsttype/:id",authenticateToken,checkRole([true]), async (req, res) => {
    try {
        const typeid = req.params.id;

        // Kiểm tra danh mục có tồn tại hay không
        const existingtypeacc = await db.loaitk.findByPk(typeid);
        if (!existingtypeacc) {
            return res.status(404).json(new ResponseModel.ResponseModel( false, "Type account not exists", null));
        }
       // Kiểm tra xem loại tài khoản này có được sử dụng trong bảng taikhoan
       const isReferencedInNguoidung = await db.nguoidung.findOne({
        where: { maloaitk: typeid }
    });

    // Kiểm tra xem loại tài khoản này có được sử dụng trong bảng nangcap
    const isReferencedInNangcap = await db.nangcaptk.findOne({
        where: { maloaitk: typeid }
    });

    // Nếu loại tài khoản được tham chiếu trong bất kỳ bảng nào, trả về lỗi
    if (isReferencedInNguoidung || isReferencedInNangcap) {
        await db.loaitk.update(
            { statetype: false },
            { where: { maloaitk: typeid } }
        );
        return res.status(200).json(new Models.ResponseModel(true, null, "Type account is in use, updated statetype to false!"));
    }
        // Xóa danh mục
        await db.loaitk.destroy({ where: { maloaitk: typeid } });

        return res.status(200).json(new ResponseModel.ResponseModel(true, null,"Delete type account successfully!"));
    } catch (err) {
        return res.status(500).json(new ResponseModel.ResponseModel(false,new ResponseModel.ErrorResponseModel(1, "INTERNAL_SERVER_ERROR", err.message),null));
    }
});
module.exports = router;
