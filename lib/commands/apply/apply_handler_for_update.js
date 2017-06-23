'use strict'
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')

module.exports.update_by_query_with_pipeline = function (es_setup, config_name, config) {
  var esclient = es_setup.esclient
  
  var index_reader = config_name + "_reader"
  var pipeline_name = config_name

  var params = { 
    index : index_reader, 
    body : { conflicts : "proceed" }, 
    pipeline : pipeline_name 
  }
  return esclient.updateByQuery(params).then(
    function(result) {
      console.log(console_colors.FGWHITE, "  Index updated: '"+index_reader+"'")
      return result
    }
  )
}