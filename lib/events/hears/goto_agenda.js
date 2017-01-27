'use strict'

module.exports = {
  name: 'goto_agenda',
  hears: ['goto ([0-9]+)'],
  execute: function (bot, msg) {
    this._facilitator.executeModule(bot, msg, msg.match[1] - 1)
  }
}
