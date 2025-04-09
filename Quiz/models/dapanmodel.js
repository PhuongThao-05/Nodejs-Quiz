module.exports=(sequelize, Sequelize)=>{
    const dapan=sequelize.define('dapan',{
       madapan:{
            type: Sequelize.INTEGER,
            primaryKey:true,
            allowNull:false,
            autoIncrement:true,     
        },
        macauhoi:{
            type: Sequelize.INTEGER,
            allowNull:false,    
        },
        noidung:{
            type:Sequelize.STRING,
            allowNull:false,
            validate:{
                notEmpty:{
                    args:true,
                    msg:'Answer can not be empty!'
                },
                notNull:{
                    args: true,
                    msg:'Please enter answer!'
                },
            }   
        },
        checkdapan:{
            type:Sequelize.BOOLEAN,
            allowNull:false,
        }
    },{
        timestamps: false,
        tableName: 'dapan' 
    });
    return dapan;
}

