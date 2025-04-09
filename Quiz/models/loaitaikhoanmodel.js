module.exports=(sequelize, Sequelize)=>{
    const loaitk=sequelize.define('loaitaikhoan',{
       maloaitk:{
            type: Sequelize.INTEGER,
            primaryKey:true,
            allowNull:false,
            autoIncrement:true,     
        },
        tenloaitk:{
            type:Sequelize.STRING,
            allowNull:false,
            validate:{
                notEmpty:{
                    args:true,
                    msg:'Type of account name can not be empty!'
                },
                notNull:{
                    args: true,
                    msg:'Please enter Type of account name!'
                },
            }   
        },
        gia:{
            type: Sequelize.DOUBLE,  // Chuyển từ FLOAT sang DOUBLE
            allowNull: false,
            defaultValue: 0,
        },
        solanthi:{
            type:Sequelize.INTEGER,
            allowNull:true,
            defaultValue:5
        },
        solantai:{
            type:Sequelize.INTEGER,
            allowNull:true,
            defaultValue:5
        },
        solandangbai:{
            type:Sequelize.INTEGER,
            allowNull:true,
            defaultValue:5 
        },
        statetype:{
            type:Sequelize.BOOLEAN,
            defaultValue:true,
        },
    },{
        timestamps: false,
        tableName: 'loaitaikhoan' 
    });
    return loaitk;
}
