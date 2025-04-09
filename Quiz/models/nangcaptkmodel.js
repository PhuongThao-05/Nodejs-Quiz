module.exports=(sequelize, Sequelize)=>{
    const nangcaptk=sequelize.define('nangcaptk',{
       manc:{
            type: Sequelize.INTEGER,
            primaryKey:true,
            allowNull:false,  
            autoIncrement:true,   
        },
        orderid:{
            type:Sequelize.STRING,
            allowNull:false,
        },
        id:{
            type:Sequelize.INTEGER,
            allowNull:false,
        },
        maloaitk:{
            type:Sequelize.INTEGER,
            allowNull:false,
        },
        ngaythanhtoan:{
            type:Sequelize.DATE,
            allowNull:false, 
        },
        xacnhan:{
            type:Sequelize.BOOLEAN,
            allowNull:false,
            defaultValue:false,
        },
        statenc:{
            type:Sequelize.BOOLEAN,
            allowNull:false,
            defaultValue:true,
        },
    },{
        timestamps: false,
        tableName: 'nangcaptk' 
    });
    return nangcaptk;
}

