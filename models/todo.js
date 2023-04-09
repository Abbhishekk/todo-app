'use strict';
const {
  Model, Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Todos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Todos.belongsTo(models.user,{
        foreignKey: 'userId'  
      })
      // define association here
    }

    static addTodo({ title, dueDate, userId }) {
      if(title != " " && dueDate != "" )
        return this.create({ title: title, dueDate: dueDate, completed: false,userId });
      else return
    }
    static async allCompleted(userId){
      return this.findAll({
        where : {
          completed : true,
          userId
        }
      })
    }
    static async dueToday(userId){
      return this.findAll({
        where:{
          dueDate:{
            [Op.eq]: new Date(),
            },
            userId,
            completed : false
          },
      });
    }

    static async overdue(userId){
      return this.findAll({
        where:{
          dueDate:{
            [Op.lt]: new Date(),
            },
            userId,
            completed : false
          },
      });
    }

    static async duelater(userId){
      return this.findAll({
        where:{
          dueDate:{
            [Op.gt]: new Date(),
            },
            userId,
            completed : false
          },
      });
    }

    static getTodos(userId){
      return this.findAll({
        where : {
          userId
        }
      });
    }

    setCompletionStatus(complete) {
      
      return this.update({ completed : !complete });
    }

  }
  Todos.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
          notNull: true,
          len: 5
      }},
    dueDate: {
      type :DataTypes.DATEONLY,
      allowNull : false,
      validate :{
        notNull : true,
      }
    },
    completed: {
      type : DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todos;
};