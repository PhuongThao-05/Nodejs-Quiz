module.exports = (sequelize, Sequelize) => {
    const de = sequelize.define('de', {
        made: {
            type: Sequelize.INTEGER,
            primaryKey: true,        
            allowNull: false,
            autoIncrement: true,
        },
        tende: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    args: true,    
                    msg: 'Topic can not be empty!'
                },
                notNull: {
                    args: true,   
                    msg: 'Please enter topic!'
                },
            }
        },
        monhoc: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    args: true,
                    msg: 'Subject can not be empty!'
                },
                notNull: {
                    args: true,
                    msg: 'Please enter subject!'
                },
            }
        },
        trinhdo: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        truong: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        id: {
            type: Sequelize.INTEGER, 
            allowNull: false,
        },
        ngaydang: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue:Sequelize.NOW,
        },
        statede: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        }
    }, {
        timestamps: false,
        tableName: 'de' // Chỉ định tên bảng là 'de'
    });
    
    return de;
};

