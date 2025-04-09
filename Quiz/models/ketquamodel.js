module.exports=(sequelize, Sequelize)=>{
    const ketqua=sequelize.define('ketqua',{
        makq:{
            type: Sequelize.INTEGER,
            primaryKey:true,
            allowNull:false,
            autoIncrement:true,     
        }, 
       made:{
            type: Sequelize.INTEGER,
            allowNull:false,    
        },
        id:{
            type:Sequelize.INTEGER,
            allowNull:false,
        },
        diemso:{
            type:Sequelize.FLOAT,
            allowNull:false,
        },
        tongsocauhoi:{
            type:Sequelize.INTEGER,
            allowNull:false,  
        },
        socaudung:{
            type:Sequelize.INTEGER,
            allowNull:false,  
        },
        socausai:{
            type:Sequelize.INTEGER,
            allowNull:false,  
        },
        xeploai:{
            type:Sequelize.STRING,
            allowNull:false,
        },
        thoigianlambai:{
            type:Sequelize.STRING,
            allowNull:false,
        },
        thoigianhoanthanhbaithi:{
            type:Sequelize.DATE,
            allowNull:false,
        }
    },{
        timestamps: false,
        tableName: 'ketquathi' 
    });
    return ketqua;
}

