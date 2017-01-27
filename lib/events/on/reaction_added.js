'use strict'

module.exports = {
  name: 'reaction_added',
  execute: function (bot, msg) {
    this._facilitator.addReaction(bot, msg)
  }
}
