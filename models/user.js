'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
    }
    static async addSessionId(id, session_id) {
      return await this.findByPk(id)
        .then((user) => {
          if (user.sessionId == null) {
            user.sessionId = session_id;
          }
          else {
            user.sessionId += `,${session_id}`;
          }
          return user.save();
      })
    }
    static async removeSessionId(id, session_id) {
      return await this.findByPk(id)
        .then((user) => {
          const updatedSessionId = user.sessionId.split(',').filter((id) => id !== session_id);
          user.sessionId = updatedSessionId.toString()
          return user.save();
      })
    }
  }
  User.init({
    userName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    sessionId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};