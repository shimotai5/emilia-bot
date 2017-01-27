'use strict'

class Meeting {
  constructor (team, channel, bot) {
    this._id = Meeting.createId(team, channel)
    this._team = team
    this._channel = channel
    this._bot = bot
    this._attendees = new Map()
    this._phase = 0
    this._state = Meeting.state.IDLE
    this._takeAttendanceMsgTs = ''
    this._startMeetingMsgTs = ''
    this._latestMsgTs = ''
    this._latestMsgReactionAttendees = new Set()
    this._lock = false
  }

  get id () {
    return this._id
  }

  set id (id) {
    this._id = id
  }

  get state () {
    return this._state
  }

  set state (state) {
    this._state = state
  }

  get takeAttendanceMsgTs () {
    return this._takeAttendanceMsgTs
  }

  set takeAttendanceMsgTs (takeAttendanceMsgTs) {
    this._takeAttendanceMsgTs = takeAttendanceMsgTs
  }

  get startMeetingMsgTs () {
    return this._startMeetingMsgTs
  }

  set startMeetingMsgTs (startMeetingMsgTs) {
    this._startMeetingMsgTs = startMeetingMsgTs
  }

  get attendees () {
    return this._attendees
  }

  set attendees (atendees) {
    this._attendees = atendees
  }

  get phase () {
    return this._phase
  }

  set phase (phase) {
    this._phase = phase
  }

  get latestMsgTs () {
    return this._latestMsgTs
  }

  set latestMsgTs (latestMsgTs) {
    this._latestMsgTs = latestMsgTs
  }

  get latestMsgReactionAttendees () {
    return this._latestMsgReactionAttendees
  }

  set latestMsgReactionAttendees (latestMsgReactionAttendees) {
    this._latestMsgReactionAttendees = latestMsgReactionAttendees
  }

  get lock () {
    return this._lock
  }

  set lock (lock) {
    this._lock = lock
  }

  postMessage (msg) {
    return new Promise((resolve, reject) => {
      msg.channel = this._channel
      this._bot.say(msg, (err, res) => {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
  }

  updateMessage (msg, ts) {
    return new Promise((resolve, reject) => {
      msg.ts = ts
      msg.channel = this._channel
      this._bot.api.chat.update(msg, (err, res) => {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
  }

  deleteMessage (ts) {
    return new Promise((resolve, reject) => {
      this._bot.api.chat.delete({
        channel: this._channel,
        ts: ts
      }, (err, res) => {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
  }

  getUserInfo (userId) {
    return new Promise((resolve, reject) => {
      this._bot.api.users.info({
        user: userId
      }, (err, res) => {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
  }

  static createId (team, channel) {
    return team + '_' + channel
  }

  static get state () {
    return {
      TAKE_ATTENDANCE: 'take_attendance',
      MEETING: 'meeting',
      IDLE: 'idle'
    }
  }
}

module.exports = Meeting
