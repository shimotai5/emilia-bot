'use strict'

const path = require('path')
const fs = require('fs')
const camelCase = require('camelcase')
const Botkit = require('botkit')
const Promise = require('bluebird')

const Facilitator = require(path.join(__dirname, 'Facilitator'))

class Emilia {
  constructor (modules, options) {
    modules = modules || []
    options = options || {}
    this._slackApiClientId = options.slackApiClientId || process.env.EMILIA_SLACK_API_CLIENT_ID
    this._slackApiClientSecret = options.slackApiClientSecret || process.env.EMILIA_SLACK_API_CLIENT_SECRET
    this._port = options.port || process.env.EMILIA_PORT
    this._storage = options.storage || { json_file_store: './simple_storage/' }
    this._hears = options.hears || {}
    this._facilitator = new Facilitator(modules, options)
    this._controller = {}
    this._bots = new Map()
  }

  start () {
    return Promise.coroutine(this._start).call(this)
  }

  * _start () {
    yield this._facilitator.start()
    yield this._setupController()
    yield this._setupWebServer()
    yield this._setupWebServerEndpoints()
    yield this._startBots(yield this._getTeams())
    this._setupInteractiveEvents()
    this._setupHearsEvents()
    this._setupOnEvents()
  }

  _setupController () {
    return new Promise((resolve, reject) => {
      this._controller = Botkit.slackbot(this._storage)
      this._controller.configureSlackApp({
        clientId: this._slackApiClientId,
        clientSecret: this._slackApiClientSecret,
        scopes: ['bot']
      })

      resolve()
    })
  }

  _setupWebServer () {
    return new Promise((resolve, reject) => {
      this._controller.setupWebserver(this._port, (err, webserver) => {
        if (err) {
          reject(err)
          return
        }

        resolve()
      })
    })
  }

  _setupWebServerEndpoints () {
    return new Promise((resolve, reject) => {
      this._controller.createWebhookEndpoints(this._controller.webserver)
      this._controller.createOauthEndpoints(this._controller.webserver, this._oauthEndpoint)

      resolve()
    })
  }

  _oauthEndpoint (err, req, res) {
    if (err) {
      console.error(err)
      res.sendStatus(500)
      return
    }

    res.sendStatus(200)
    return
  }

  _getTeams () {
    return new Promise((resolve, reject) => {
      this._controller.storage.teams.all((err, teams) => {
        if (err) {
          reject(err)
          return
        }

        resolve(teams)
      })
    })
  }

  _startBots (teams) {
    return Object.keys(teams)
        .filter((k) => teams[k].bot)
        .map((k) => this._startBot.bind(this, teams[k]))
        .reduce((p, c) => p.then(c.bind(this)), Promise.resolve())
  }

  _startBot (team) {
    return this._startRTM(this._controller.spawn(team))
  }

  _startRTM (bot) {
    return new Promise((resolve, reject) => {
      bot.startRTM((err) => {
        if (err) {
          reject(err)
          return
        }

        this._bots.set(bot.config.token, bot)
        resolve()
      })
    })
  }

  _setupInteractiveEvents () {
    let events = Emilia._readEvents(path.join(__dirname, 'events', 'interactive'))
        .reduce((map, obj) => map.set(obj.name, obj), new Map())

    this._controller.on('interactive_message_callback', (bot, msg) => {
      if (!events.has(msg.callback_id)) {
        console.warn('`' + msg.callback_id + '`interactive event not found')
        return
      }

      events.get(msg.callback_id).execute.call(this, bot, msg)
    })
  }

  _setupHearsEvents () {
    Emilia._readEvents(path.join(__dirname, 'events', 'hears'))
        .forEach((e) => this._controller.hears(this._hears[camelCase(e.name)] || e.hears, ['mention', 'direct_mention'], e.execute.bind(this)))
  }

  _setupOnEvents () {
    Emilia._readEvents(path.join(__dirname, 'events', 'on'))
        .forEach((e) => this._controller.on(e.name, e.execute.bind(this)))
  }

  static _readEvents (dir) {
    return fs.readdirSync(dir, { encoding: 'utf8' })
        .filter((f) => path.extname(f) === '.js')
        .map((f) => require(path.join(dir, f)))
        .filter((f) => f.hasOwnProperty('execute') && f.hasOwnProperty('name'))
  }
}

module.exports = Emilia
