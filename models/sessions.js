'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static addsession({ date, address, player, total, organizer, sportId }) {
      return this.create({
        date,
        address,
        player,
        total,
        organizer,
        sportId
      })
    }
  }
  sessions.init({
    date: DataTypes.DATE,
    address: DataTypes.STRING,
    player: DataTypes.STRING,
    total: DataTypes.STRING,
    organizer: DataTypes.STRING,
    sportId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'sessions',
  });
  return sessions;
};