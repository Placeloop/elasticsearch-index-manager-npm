'use strict'
var constants = require('../../misc/constants')
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')

module.exports.apply_index_config = function (es_setup, config_name, config, create_next_version) {
  var esclient = es_setup.esclient
  
  var index_reader = config_name + "_reader"
  var index_name_prefix = config_name + "_v"
  var index_first_version = index_name_prefix + "1"

  console.log(console_colors.FGWHITE, "  Checking for index reader: '"+index_reader+"'")
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
          function(create_result) {
            console.log(console_colors.FGWHITE, " Index created: '"+index_first_version+"'")
            return { post_action : constants.NOOP_POST_ACTION, current_version : index_first_version }
          }
        )

      } else {
        console.log("   Index '"+found_index_name+"' already exist. Updating mappings")
        
        var promise_chain = promise.resolve(false)
        for(var property in config.mappings) {
          if(config.mappings.hasOwnProperty(property)) {
            var type_name = property
            var type_config = config.mappings[type_name]

            promise_chain = _apply_mapping_to_config(promise_chain, esclient, found_index_name, type_name, type_config)
          }
        }

        promise_chain = promise_chain.then(
          function(at_least_one_mapping_update_fail) {
            if(at_least_one_mapping_update_fail) {
              console.log(console_colors.FGWHITE, "  Index '"+found_index_name+"' mapping not updated. Reindex is required")     
              return { post_action : constants.REINDEX_POST_ACTION, current_version : found_index_version }
            } else {
              console.log(console_colors.FGWHITE,"  Index '"+found_index_name+"' mappings updated")  
              return { post_action : constants.UPDATE_POST_ACTION, current_version : found_index_version }
            }
          }
        )
        
        return promise_chain
      }
    }
  )
}

var _apply_mapping_to_config = function(promise_chain, esclient, found_index_name, type_name, type_config) {
  return promise_chain.then(
    function(previous_mapping_update_fail) {
      if(previous_mapping_update_fail) {
        return promise.resolve(previous_mapping_update_fail)
      }

      return esclient.indices.putMapping({ index : found_index_name, type : type_name, body : type_config }).then(
        function(mapping_update_result) {
          console.log(console_colors.FGWHITE, "     Type '"+found_index_name+"."+type_name+"' updated!")
          return promise.resolve(false)            
        }
      ).catch(
        function(error) {
          console.log(console_colors.FGYELLOW, "     Type '"+found_index_name+"."+type_name+"' not updated! Reindex is required. Reason = ", error)
          return promise.resolve(true)
        }
      )
    }
  )
}