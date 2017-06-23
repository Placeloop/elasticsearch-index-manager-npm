'use strict'

var promise = require('../../facades/promise')
var console_colors = require('../../misc/console_colors')

module.exports.reindex_with_pipeline = function (es_setup, config_name, config, current_index_version) {
  var esclient = es_setup.esclient
  
  var index_name_prefix = config_name + "_v"
  var index_writer = config_name + "_writer"
  

  var current_index_name = index_name_prefix + (current_index_version)
  var next_index_name = index_name_prefix + (current_index_version + 1)
        
  console.log(console_colors.FGWHITE, " Creating index version: '"+current_index_name+"' -> '"+next_index_name+"'")
  return promise.resolve().then(
    function() {
      return esclient.indices.create({ index : next_index_name }).then(
        function() {
          console.log(console_colors.FGWHITE, " Index next version created: '"+current_index_name+"' -> '"+next_index_name+"'")
          return promise.resolve()
        }
      )
    }
  ).then(
    function() {
      return esclient.indices.deleteAlias({ index: current_index_name, name : index_writer }).then(
        function() {
          console.log(console_colors.FGWHITE, " Index writer removed from: '"+current_index_name+"'")
          return promise.resolve()
        }
      )
    }
  ).then(
    function() {
      console.log(console_colors.FGWHITE, " Index '"+config_name+"' reindexed!")
      return promise.resolve(current_index_version + 1)
    }
  )
}