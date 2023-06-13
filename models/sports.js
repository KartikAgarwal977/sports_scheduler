"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class sports extends Model {
    static associate(models) {
      // define association here
      sports.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
    static addsport({ sports_name, userId }) {
      return this.create({
        sports_name,
        userId: userId,
      });
    }
    static async allsports() {
      return await this.findAll();
    }
    static editSport(id, sportName) {
      return this.update(
        { sports_name: sportName },
        {
          where: {
            id: id,
          },
        }
      );
    }
    static deleteSport(id) {
      return this.destroy({
        where: {
          id: id,
        },
      });
    }
  }
  sports.init(
    {
      sports_name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "sports",
    }
  );
  return sports;
};
