#!/usr/bin/env node
'use stric'

var stdin = require('stdin')
var argv = require('minimist')(process.argv.slice(2), {
  boolean: ['help', 'version'],
  alias: {
    h     : 'help',
    usage : 'help',
    u     : 'help',
    v     : 'version'
  }
});

var es_index_manager = require('./index.js')();
es_index_manager.execute(argv).catch(
  function (error) {
    // Do nothing
  }
);