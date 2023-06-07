"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      sessions.belongsTo(models.sports, {
        foreignKey: "sportId",
      });
    }
    static associate(models) {
      sessions.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
    static addsession({ date, address, player, needed, sportId, userId }) {
      return this.create({
        date: date,
        address: address,
        player: player,
        needed: needed,
        sportId: sportId,
        userId: userId,
      });
    }
    static getsession(id) {
      return this.findOne({
        where: {
          id: id,
        },
      });
    }
    static upcomingSession(id) {
      return this.findAll({
        where: {
          date: {
            [Op.gte]: new Date(),
          },
          sportId: id,
        },
      });
    }
    static previousSession(id) {
      return this.findAll({
        where: {
          date: {
            [Op.lt]: new Date(),
          },
          sportId: id,
        }
      })
    }
  }
  sessions.init(
    {
      date: DataTypes.DATE,
      address: DataTypes.STRING,
      player: DataTypes.STRING,
      needed: DataTypes.INTEGER,
      sportId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "sessions",
    }
  );
  return sessions;
};
