'use strict'

const path = require('path')
const Promise = require('bluebird')
const moment = require('moment')
require('moment-duration-format')

const msgCreator = require(path.join(__dirname, 'message_creator'))
const Meeting = require(path.join(__dirname, 'Meeting'))

class Facilitator {
  constructor (modules, options) {
    this._modules = modules || []
    this._messages = options.messages || {}
    this._reactionRateToNextAgenda = options.reactionRateToNextAgenda || 0.8
    this._meetings = new Map()
    this._lock = false
  }

  start () {
    return Promise.coroutine(this._start).call(this)
  }

  * _start () {
    yield this._validateModules()
    this._setupModules()
  }

  _validateModules () {
    return new Promise((resolve, reject) => {
      if (!this._modules || this._modules.length < 1) reject('modules not found.')

      // HACK: Refactor me.
      this._modules.forEach((m) => {
        if (!m.hasOwnProperty('agenda')) reject('`agenda` property not found of any modules.')
        if (!m.hasOwnProperty('execute')) reject('`execute` property not found of any modules.')
      })

      resolve()
    })
  }

  _setupModules () {
    // HACK: Refactor me.
    let t = []
    this._modules.forEach((m) => {
      let c = Object.assign({}, m)
      let e = c.execute
      c.execute = () => { return new Promise(e) }
      t.push(c)
    })

    this._modules = t
  }

  takeAttendance (bot, msg) {
    return Promise.coroutine(function* () {
      let meeting = this._getMeeting(bot, msg)
      if (meeting.state !== Meeting.state.IDLE) return

      let m = msgCreator.takeAttendance(this._messages)
      let res = yield meeting.postMessage(m)

      meeting.state = Meeting.state.TAKE_ATTENDANCE
      meeting.takeAttendanceMsgTs = res.ts
    }).call(this)
  }

  takeAttendanceCallback (bot, msg) {
    return Promise.coroutine(function* () {
      let meeting = this._getMeeting(bot, msg)
      if (meeting.state !== Meeting.state.TAKE_ATTENDANCE) return

      let actionName = msg.actions[0].name
      let userId = msg.user
      let tmpAttendees = new Map(meeting.attendees)

      switch (actionName) {
        case 'attend':
          if (meeting.attendees.has(userId)) return

          let res = yield meeting.getUserInfo(userId)
          tmpAttendees.set(res.user.id, res.user)
          break
        case 'absent':
          if (!meeting.attendees.has(userId)) return

          tmpAttendees.delete(userId)
          break
        default:
          return Promise.reject('Action not found of take attendance event.')
      }

      let m = msgCreator.takeAttendance(this._messages, tmpAttendees)
      yield meeting.updateMessage(m, meeting.takeAttendanceMsgTs)

      meeting.attendees = tmpAttendees
    }).call(this)
  }

  startMeeting (bot, msg) {
    return Promise.coroutine(function* () {
      let meeting = this._getMeeting(bot, msg)
      if (meeting.state !== Meeting.state.TAKE_ATTENDANCE) return

      let m = msgCreator.startMeeting(this._messages, meeting.attendees, this._modules)
      let res = yield meeting.postMessage(m)

      yield meeting.deleteMessage(meeting.takeAttendanceMsgTs)

      meeting.state = Meeting.state.MEETING
      meeting.startMeetingMsgTs = res.ts
      this.executeModule(bot, msg, 0)
    }).call(this)
  }

  executeNextModule (bot, msg) {
    let meeting = this._getMeeting(bot, msg)
    if (meeting.state !== Meeting.state.MEETING) return

    let phase = meeting.phase + 1
    if (phase >= this._modules.length) {
      this.endMeeting(bot, msg).catch((err) => console.error(err))
    }

    this.executeModule(bot, msg, phase)
  }

  executePrevModule (bot, msg) {
    let meeting = this._getMeeting(bot, msg)
    if (meeting.state !== Meeting.state.MEETING) return

    let phase = meeting.phase - 1
    if (phase < 0) return

    this.executeModule(bot, msg, phase)
  }

  executeModule (bot, msg, phase) {
    let meeting = this._getMeeting(bot, msg)
    if (meeting.state !== Meeting.state.MEETING || meeting.lock) return

    let module = this._modules[phase]
    if (!module) return

    Promise.coroutine(function* () {
      meeting.lock = true
      let attachments = yield module.execute()
      let m = msgCreator.agenda(module.agenda, phase, attachments)
      let res = yield meeting.postMessage(m)

      meeting.latestMsgTs = res.ts
      let reactionAttendees = meeting.latestMsgReactionAttendees
      reactionAttendees.clear()
      meeting.phase = phase
      meeting.lock = false
    }).call(this).catch((err) => {
      meeting.lock = false
      let m = msgCreator.agendaError(module.agenda, phase, err)
      meeting.postMessage(m, (err, res) => {
        if (err) {
          console.error(err)
          return
        }
      })
    })
  }

  endMeeting (bot, msg) {
    return Promise.coroutine(function* () {
      let meeting = this._getMeeting(bot, msg)
      if (meeting.state !== Meeting.state.MEETING) return

      let ts1 = moment(parseInt(msg.ts * 1000, 10))
      let ts2 = moment(parseInt(meeting.startMeetingMsgTs * 1000, 10))
      let diffTime = moment.duration(ts1.diff(ts2)).format('h [hours] m [minutes] s [seconds]')

      let m = msgCreator.endMeeting(this._messages, diffTime)
      yield meeting.postMessage(m)

      this._meetings.delete(meeting.id)
    }).call(this)
  }

  addReaction (bot, msg) {
    let meeting = this._getMeeting(bot, msg)
    if (meeting.state !== Meeting.state.MEETING ||
        meeting.latestMsgTs !== msg.item.ts ||
        !meeting.attendees.has(msg.user)) {
      return
    }

    let reactionAttendees = meeting.latestMsgReactionAttendees
    reactionAttendees.add(msg.user)
    if (reactionAttendees.size >= Math.floor(meeting.attendees.size * this._reactionRateToNextAgenda)) {
      this.executeNextModule(bot, msg)
    }
  }

  removeReaction (bot, msg) {
    let meeting = this._getMeeting(bot, msg)
    if (meeting.state !== Meeting.state.MEETING ||
        meeting.latestMsgTs !== msg.item.ts ||
        !meeting.attendees.has(msg.user)) {
      return
    }

    let reactionAttendees = meeting.latestMsgReactionAttendees
    reactionAttendees.delete(msg.user)
  }

  _getMeeting (bot, msg) {
    let team = bot.team_info.id
    let channel = msg.channel || msg.item.channel
    let meetingId = Meeting.createId(team, channel)

    if (this._meetings.has(meetingId)) return this._meetings.get(meetingId)

    let meeting = new Meeting(team, channel, bot)
    this._meetings.set(meetingId, meeting)

    return meeting
  }
}

module.exports = Facilitator
