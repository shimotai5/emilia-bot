'use strict'

module.exports = {
  name: 'next_agenda',
  hears: ['next'],
  execute: function (bot, msg) {
    this._facilitator.executeNextModule(bot, msg)
  }
}
