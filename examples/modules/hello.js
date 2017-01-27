'use strict'

module.exports = {
  agenda: 'hello',
  execute: function (success, failed) {
    success([{
      text: 'Hello world'
    }])
  }
}
