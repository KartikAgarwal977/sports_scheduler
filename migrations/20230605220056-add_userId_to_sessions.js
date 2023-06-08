'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("sessions", "userId", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("sessions", {
      fields: ["userId"],
      type: "foreign key",
      references: {
        table: "Users",
        field: "id",
      },
    });
      await queryInterface.addColumn("sessions", "status", {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "onboard"
      })
      await queryInterface.addColumn('sessions', 'reason', {
        type: Sequelize.STRING,
      })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("sessions", "userId");
    await queryInterface.removeColumn("sessions", "status");
    await queryInterface.removeColumn("sessions", "reason");

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
