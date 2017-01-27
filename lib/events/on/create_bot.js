'use strict'

module.exports = {
  name: 'create_bot',
  execute: function (bot, msg) {
    if (this._bots.has(bot.config.token)) return

    this._startRTM(bot).catch((err) => console.error(err))
  }
}
