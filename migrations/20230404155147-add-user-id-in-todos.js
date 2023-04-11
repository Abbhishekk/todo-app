'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.addColumn('Todo','userId',{
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint('Todo',{
      fields: ['userId'],
      type: 'foreign key',
      references: {
        table: 'Users',
        field: 'Id'
      }
    })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    
    await queryInterface.removeColumn('Todo','userId');
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
