module.exports=(sequelize, Sequelize)=>{
    const cauhoi=sequelize.define('cauhoi',{
       macauhoi:{
            type: Sequelize.INTEGER,
            primaryKey:true,
            allowNull:false,
            autoIncrement:true,     
        },
        made:{
            type: Sequelize.INTEGER,
            allowNull:false,    
        },
        cauhoi:{
            type:Sequelize.STRING,
            allowNull:false,
            validate:{
                notEmpty:{
                    args:true,
                    msg:'Question can not be empty!'
                },
                notNull:{
                    args: true,
                    msg:'Please enter question!'
                },
            }   
        },
        statecauhoi:{
            type:Sequelize.BOOLEAN,
            allowNull:true,
            defaultValue:true,
        }
    },{
        timestamps: false,
        tableName: 'cauhoi'
    });
    return cauhoi;
}

