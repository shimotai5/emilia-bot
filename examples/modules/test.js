'use strict'

module.exports = {
  agenda: 'test',
  execute: function (success, failed) {
    // See: https://api.slack.com/docs/message-attachments
    success([
      {
        author_name: 'Emilia',
        title: 'test title1',
        text: 'test1',
        color: 'good'
      },
      {
        author_name: 'Rem',
        title: 'test title2',
        text: 'test2',
        color: 'warning'
      },
      {
        author_name: 'Ram',
        title: 'test title3',
        text: 'test3',
        color: 'danger'
      }
    ])
  }
}
