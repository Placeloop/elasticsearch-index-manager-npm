'use strict'

var promise = require('../../facades/promise')
var console_colors = require('../../misc/console_colors')

module.exports.reindex_with_pipeline = function (es_setup, config_name, config, current_index_version) {
  var esclient = es_setup.esclient
  
  var index_name_prefix = config_name + "_v"
  var index_reader = config_name + "_reader"
  var index_writer = config_name + "_writer"
  
  var current_index_name = index_name_prefix + (current_index_version)
  var next_index_name = index_name_prefix + (current_index_version + 1)
        
  console.log(console_colors.FGWHITE, "   Creating index version: '"+current_index_name+"' -> '"+next_index_name+"'")
  return promise.resolve().then(
    function() {
      return esclient.indices.create({ index : next_index_name }).then(
        function() {
          console.log(console_colors.FGWHITE, "   Index next version created: '"+current_index_name+"' -> '"+next_index_name+"'")
          return promise.resolve()
        }
      )
    }
  ).then(
    function() {
      return esclient.indices.deleteAlias({ index: current_index_name, name : index_writer }).then(
        function() {
          console.log(console_colors.FGWHITE, "   Index writer removed from: '"+current_index_name+"'")
          return promise.resolve()
        }
      )
    }
  ).then(
    function() {
      var body = { 
        source : {
           index : current_index_name
        },
         dest : {
           index : next_index_name,
        } 
      }
      return esclient.reindex({ body : body }).then(
        function() {
          console.log(console_colors.FGWHITE, "   Index '"+next_index_name+"' indexed!")
          return promise.resolve()
        }
      )
    }
  ).then(
    function() {
      return esclient.indices.deleteAlias({ index: current_index_name, name : index_reader }).then(
        function() {
          console.log(console_colors.FGWHITE, "   Index reader removed from: '"+current_index_name+"'")
          return promise.resolve()
        }
      )
    }
  ).then(
    function() {
      return esclient.indices.close({ index: current_index_name }).then(
        function() {
          console.log(console_colors.FGWHITE, "   Index '"+current_index_name+"' closed!")
          return promise.resolve()
        }
      )
    }
  ).then(
    function() {
      return promise.resolve(current_index_version + 1)
    }
  )
}