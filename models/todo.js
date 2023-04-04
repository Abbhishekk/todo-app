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
      // define association here
    }

    static addTodo({ title, dueDate }) {
      if(title != " " && dueDate != "" )
        return this.create({ title: title, dueDate: dueDate, completed: false });
      else return
    }
    static async allCompleted(){
      return this.findAll({
        where : {
          completed : true
        }
      })
    }
    static async dueToday(){
      return this.findAll({
        where:{
          dueDate:{
            [Op.eq]: new Date(),
            },
            completed : false
          },
      });
    }

    static async overdue(){
      return this.findAll({
        where:{
          dueDate:{
            [Op.lt]: new Date(),
            },
            completed : false
          },
      });
    }

    static async duelater(){
      return this.findAll({
        where:{
          dueDate:{
            [Op.gt]: new Date(),
            },
            completed : false
          },
      });
    }

    static getTodos(){
      return this.findAll();
    }

    setCompletionStatus(complete) {
      
      return this.update({ completed : !complete });
    }

  }
  Todos.init({
    title: DataTypes.STRING,
    dueDate: DataTypes.DATEONLY,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todos;
};