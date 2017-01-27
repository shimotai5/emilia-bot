'use strict'

module.exports = {
  name: 'take_attendance_callback',
  execute: function (bot, msg) {
    this._facilitator.takeAttendanceCallback(bot, msg).catch((err) => console.error(err))
  }
}
