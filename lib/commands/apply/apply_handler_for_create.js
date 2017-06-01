'use strict'
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')

module.exports.create_index = function (es_setup, config_name, config, create_next_version) {
  var esclient = es_setup.esclient
  
  var index_reader = config_name + "_reader"
  var index_writer = config_name + "_writer"
  var index_name_prefix = config_name + "_v"
  var index_first_version = index_name_prefix + "1"

  console.log(console_colors.FGWHITE, "Checking for index reader: '"+index_reader+"'")
  return esclient.indices.get({ index : index_reader, ignore: [404] }).then(
    function(index_config_data) {
      var found_index_name = ""
      var found_index_version = 0
      for(var property in index_config_data) {
        if(index_config_data.hasOwnProperty(property)) {
          console.log(console_colors.FGWHITE, "   Aliased index: '"+property+"'")
  
          if(property.indexOf(config_name) === 0) {
            var tmp_index_name = property
            var tmp_index_version = parseInt(tmp_index_name.slice(index_name_prefix.length))
            if(tmp_index_version > found_index_version) {
              found_index_name = tmp_index_name
              found_index_version = tmp_index_version
              console.log(console_colors.FGWHITE, "     Index found: '"+found_index_name+"'")
            }
          }
        }
      }

      if(found_index_name === "") {
        console.log(console_colors.FGWHITE, " No Index found. Creating default one")
        return esclient.indices.create({ index : index_first_version }).then(
          function(index) {
            console.log(console_colors.FGWHITE, " Index created: '"+index_first_version+"'")
            return index
          }
        )
      } else if(create_next_version) {
        var index_name = index_name_prefix + (found_index_version + 1)
        
        console.log(console_colors.FGWHITE, " Creating index version: '"+found_index_name+"' -> '"+index_name+"'")
        return esclient.indices.create({ index : index_name }).then(
          function(index) {
            console.log(console_colors.FGWHITE, " Index next version created: '"+found_index_name+"' -> '"+index_name+"'")
            return index
          }
        ).then(
          function(index) {
            return esclient.indices.deleteAlias({ index: found_index_name, name : index_writer }).then(
              function(result) {
                console.log(console_colors.FGWHITE, " Index writer removed from: '"+found_index_name+"'")
                return index            
              }
            )
          }
        )
      } else {
        console.log(" Index '"+found_index_name+"' already exist. Doing nothing")
        return promise.resolve()
      }
    }
  )
}