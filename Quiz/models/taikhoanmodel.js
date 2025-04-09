module.exports=(sequelize, Sequelize)=>{
    const taikhoan=sequelize.define('taikhoan',{
        username:{
            type: Sequelize.STRING,
            primaryKey:true,
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
        password:{
            type:Sequelize.STRING,
            allowNull:false,
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
        identify:{
            type:Sequelize.BOOLEAN,
            allowNull:false,
            defaultValue:false,
        },
        token: { 
            type:Sequelize.STRING,
            allowNull: true
        }
    },{
        timestamps: false,
        tableName: 'taikhoan' 
    });
    return taikhoan;
}

