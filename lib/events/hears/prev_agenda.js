'use strict'

module.exports = {
  name: 'prev_agenda',
  hears: ['prev'],
  execute: function (bot, msg) {
    this._facilitator.executePrevModule(bot, msg)
  }
}
