'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sports extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      sports.belongsTo(models.User, {
        foreignKey: "userId"
      })
    }
    static addsport({ sports_name, userId }) {
      return this.create({
        sports_name,
        userId: userId
      })
    }
    static async allsports() {
      return await this.findAll()
    }
  }
  sports.init({
    sports_name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'sports',
  });
  return sports;
};