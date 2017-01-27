'use strict'

module.exports = {
  name: 'reaction_removed',
  execute: function (bot, msg) {
    this._facilitator.removeReaction(bot, msg)
  }
}
