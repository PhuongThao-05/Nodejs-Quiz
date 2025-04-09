module.exports=(sequelize, Sequelize)=>{
    const thongke=sequelize.define('thongke',{
       maqldt:{
            type: Sequelize.INTEGER,
            primaryKey:true,
            allowNull:false,
            autoIncrement:true,     
        },
        made:{
            type: Sequelize.INTEGER,
            allowNull:false,     
        },
        luotthi:{
            type:Sequelize.INTEGER,
            allowNull:false,
        },
        luottai:{
            type:Sequelize.INTEGER,
            allowNull:false,
        },
        ngaythuchien:{
            type:Sequelize.DATEONLY,
            allowNull:true,
        }
    },{
        timestamps: false,
        tableName: 'thongke' 
    });
    return thongke;
}

