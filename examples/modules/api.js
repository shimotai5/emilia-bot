'use strict'

module.exports = {
  agenda: 'test',
  execute: function (success, failed) {
    // call apis...

    success([
      {
        title: 'api1.test',
        text: 'status: ok',
        color: 'good'
      },
      {
        title: 'api2.test',
        text: 'status: ok',
        color: 'good'
      },
      {
        title: 'api3.test',
        text: 'status: ng',
        color: 'danger'
      }
    ])
  }
}
