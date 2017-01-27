'use strict'

module.exports = {
  name: 'start_meeting',
  hears: ['start'],
  execute: function (bot, msg) {
    this._facilitator.startMeeting(bot, msg).catch((err) => console.error(err))
  }
}
