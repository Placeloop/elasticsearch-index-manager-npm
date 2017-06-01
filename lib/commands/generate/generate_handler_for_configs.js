'use stric'
var fs = require('../../facades/fs')()

var generic_handler = require('./generic_generate_handler_for_obj')

module.exports.handle_configs = function(configs_filenames) {
 return generic_handler.handle_objs(configs_filenames, undefined, _handle_config, undefined)
}

var _handle_config = function(config_filename, config) {
  var config_name = fs.get_filename(config_filename, true)
  config.template = config_name + "_v*"

  config.aliases = typeof config.aliases !== 'undefined' && config.aliases !== null ? config.aliases : {} 
  config.aliases[config_name + "_reader"] = {}
  config.aliases[config_name + "_writer"] = {}

  return config
}