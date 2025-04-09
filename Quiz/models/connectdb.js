const { Sequelize } = require('sequelize');
//khởi tạo kết nối
const sequelize = new Sequelize('Quiz', 'postgres', '260503', {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    logging: console.log, // Bật logging
});

const db={}
 db.sequelize=sequelize;
 db.Sequelize=Sequelize;

const taikhoanmodel=require('./taikhoanmodel');
const nguoidungmodel=require('./nguoidungmodel');
const loaitkmodel=require('./loaitaikhoanmodel');
 // tài khoản
 db.taikhoan=taikhoanmodel(sequelize,Sequelize);
 //loại tài khoản
 db.loaitk=loaitkmodel(sequelize,Sequelize);
 //người dùng
 db.nguoidung=nguoidungmodel(sequelize,Sequelize);
//khóa ngoại của người dùng
 db.nguoidung.belongsTo(db.taikhoan,{foreignKey:'username'});
 db.nguoidung.belongsTo(db.loaitk,{foreignKey:'maloaitk'});
 const nangcaptkmodel=require('./nangcaptkmodel');
//nâng cấp tài khoản
 db.nangcaptk=nangcaptkmodel(sequelize,Sequelize);
//khóa ngoại của nâng cấp tài khoản
 db.nangcaptk.belongsTo(db.nguoidung,{foreignKey:'id'});
 db.nangcaptk.belongsTo(db.loaitk,{foreignKey:'maloaitk'});
 //đề
 const demodel=require('./demodel');
 db.de=demodel(sequelize,Sequelize);
//khóa ngoại của đề
 db.de.belongsTo(db.nguoidung,{foreignKey:'id'});
 const cauhoimodel=require('./cauhoimodel');
 //câu hỏi
 db.cauhoi=cauhoimodel(sequelize,Sequelize);
//khóa ngoại của câu hỏi
 db.cauhoi.belongsTo(db.de,{foreignKey:'made'});
 const dapanmodel=require('./dapanmodel');
//đáp án
 db.dapan=dapanmodel(sequelize,Sequelize);
//khóa ngoại của đáp án
 db.dapan.belongsTo(db.cauhoi,{foreignKey:'macauhoi'});
 const ketquamodel=require('./ketquamodel');
//kết quả
db.ketqua=ketquamodel(sequelize,Sequelize);
//khóa ngoại kết quả
db.ketqua.belongsTo(db.nguoidung,{foreignKey:'id'});
db.ketqua.belongsTo(db.de,{foreignKey:'made'});
const thongkemodel=require('./thongkemodel');
//thống kê
db.thongke=thongkemodel(sequelize,Sequelize);
//khóa ngoại thống kê
db.thongke.belongsTo(db.de,{foreignKey:'made'});

module.exports=db;