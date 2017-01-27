'use strict'

const deepAssign = require('deep-assign')

module.exports.takeAttendance = function (messages, attendees) {
  let msg = deepAssign({}, {
    text: messages.takeAttendanceMsg || '@here Take attendance.',
    link_names: 1,
    attachments: [
      {
        fallback: 'Failed to take attendance.',
        callback_id: 'take_attendance_callback',
        actions: [
          {
            name: 'attend',
            text: messages.takeAttendanceAttendBtnText || 'attend',
            type: 'button',
            style: 'primary'
          },
          {
            name: 'absent',
            text: messages.takeAttendanceAbsentBtnText || 'absent',
            type: 'button'
          }
        ]
      }
    ]
  })

  if (attendees && attendees.size > 0) {
    msg.attachments.push({
      text: attendeesToText(attendees)
    })
  }

  return msg
}

module.exports.startMeeting = function (messages, attendees, modules) {
  let msg = deepAssign({}, {
    text: messages.startMtgMsg || '@here Start meeting.',
    link_names: 1,
    attachments: [
      {
        fields: [
          {
            title: messages.startMtgAgendasTitle || 'agendas',
            value: modulesToText(modules),
            short: false
          },
          {
            title: messages.startMtgAttendeesTitle || 'attendees',
            value: attendeesToText(attendees),
            short: false
          }
        ]
      }
    ]
  })

  return msg
}

module.exports.endMeeting = function (messages, diffTime) {
  let msg = deepAssign({}, {
    text: messages.endMtgMsg || '@here End meeting.',
    link_names: 1,
    attachments: [
      {
        fields: [
          {
            title: 'time',
            value: diffTime,
            short: false
          }
        ]
      }
    ]
  })

  return msg
}

module.exports.agenda = function (agenda, phase, attachments) {
  let msg = deepAssign({}, {
    text: agendaToText(agenda, phase),
    attachments: Array.isArray(attachments) ? attachments : [attachments]
  })

  return msg
}

module.exports.agendaError = function (agenda, phase, errMsg) {
  let msg = deepAssign({}, {
    text: agendaToText(agenda, phase),
    attachments: [
      {
        text: errMsg,
        color: 'danger'
      }
    ]
  })

  return msg
}

function attendeesToText (attendees) {
  return Array.from(attendees.values()).map((u) => u.name).sort().join(', ')
}

function modulesToText (modules) {
  return modules.map((m, i) => '[' + (i + 1) + '] ' + m.agenda).join('\r\n')
}

function agendaToText (agenda, phase) {
  return '[' + (phase + 1) + '] ' + agenda
}
