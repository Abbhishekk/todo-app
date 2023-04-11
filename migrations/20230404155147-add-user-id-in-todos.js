'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.addColumn('Todos','userId',{
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint('Todos',{
      fields: ['userId'],
      type: 'foreign key',
      references: {
        table: 'user',
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
    
    await queryInterface.removeColumn('Todos','userId');
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
