'use strict'

module.exports = {
  name: 'take_attendance',
  hears: ['take'],
  execute: function (bot, msg) {
    this._facilitator.takeAttendance(bot, msg).catch((err) => console.error(err))
  }
}
