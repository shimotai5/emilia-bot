'use strict'

module.exports = {
  name: 'end_meeting',
  hears: ['end'],
  execute: function (bot, msg) {
    this._facilitator.endMeeting(bot, msg).catch((err) => console.error(err))
  }
}
