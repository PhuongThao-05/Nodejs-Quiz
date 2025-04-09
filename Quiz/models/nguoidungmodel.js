module.exports=(sequelize, Sequelize)=>{
    const nguoidung=sequelize.define('nguoidung',{
        id:{
            type:Sequelize.INTEGER,
            primaryKey:true,
            allowNull:false,
            autoIncrement:true,
        },
        username:{
            type: Sequelize.STRING,
            allowNull:false,
            unique:{
                args:true,
                msg:'Username already exists!'
            },
            validate:{
                notEmpty:{
                    args:true,
                    msg:'Username can not be empty!'
                },
                notNull:{
                    args: true,
                    msg:'Please enter username!'
                },
            }           
        },
        maloaitk:{
            type:Sequelize.INTEGER,
            allowNull:false,  
        },
        ngaybatdau:{
            type:Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW 
        },
        ngayketthuc:{
            type:Sequelize.DATE,
            allowNull:true,
        },
        hoten:{
            type:Sequelize.STRING,
            allowNull:false,
        },
        chucdanh:{
            type:Sequelize.STRING,
            allowNull:true,
        },
        email:{
            type:Sequelize.STRING,
            allowNull:false,
        },
        lanthi:{
            type:Sequelize.INTEGER,
            allowNull:false,
        },
        luottai:{
            type:Sequelize.INTEGER,
            allowNull:false,
        },
        sodethi:{
            type:Sequelize.INTEGER,
            allowNull:false,
        }
    },{
        timestamps: false,
        tableName: 'nguoidung' 
    });
    return nguoidung;
}

