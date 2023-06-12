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
        reason: "",
        status: "onboard"
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
    static previousSession(sport_id) {
      return this.findAll({
        where: {
          date: {
            [Op.lt]: new Date(),
          },
          sportId: sport_id,
        }
      })
    }
    static cancelSession(session_id,reason) {
      return this.update({
        status: 'cancelled',
        reason 
      },
        {
          where: {
            id: session_id,
            status: 'onboard'
          }
          })
    }
    static joinSession(sessionId, userName) {
      return this.findByPk(sessionId)
        .then((session) => {
          if (session.player === "") {
            session.player = userName;
          } else {
            session.player += `,${userName}`;
          }
          if (session.needed >= 1) {
            session.needed -= 1
          }
          return session.save();
        })
    }
    static leaveSession(sessionId, playerName) {
      return this.findByPk(sessionId)
      .then((session) => {
        const Players = session.player.split(',').map((player) => player.trim());
        const index = Players.indexOf(playerName.trim());
        if (index > 0) {
          Players.splice(index, 1);
          const updatedPlayers = Players
          console.log(updatedPlayers.toString())
          session.update({ player: updatedPlayers.toString() });
        }
        return session.save()
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
      status: DataTypes.STRING,
      reason: DataTypes.STRING
    },
    {
      sequelize,
      modelName: "sessions",
    }
  );
  return sessions;
};
