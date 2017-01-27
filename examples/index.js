'use strict'

const Emilia = require('../')

let hello = require('./modules/hello.js')
let test = require('./modules/test.js')
let api = require('./modules/api.js')

let modules = [hello, test, api]

new Emilia(modules).start().catch((err) => {
  console.error(err)
})
