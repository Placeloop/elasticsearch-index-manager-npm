'use stric'
var constants = require('../../misc/constants')
var default_values = require('../../misc/default_values')
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')
var fs = require('../../facades/fs')()
var clone = require('../../facades/clone')

var generic_handler = require('./generic_generate_handler_for_obj')

var commands_commons = require('../_commons/commons.js')

module.exports.handle_query_templates = function(query_templates_filenames, configs) {
 return generic_handler.handle_objs(query_templates_filenames, configs, _handle_query_template, undefined, _handler)
}

var _handle_query_template = function(query_template_filename, query_template, query_template_config) {
  if(typeof query_template_config !== 'undefined' && query_template_config !== null) {
    return _validate_query_templates_for_config(query_template, query_template_config)
  } else {
    return query_template
  }
}

var _validate_query_templates_for_config = function(query_template, query_template_config) {
  // TODO
  return query_template
}

var _handler = function(obj_filename, configs, processor) {
  return fs.read_file(obj_filename).then(
    function(file_content) {

      var obj = { template : _cleanup_json_string(file_content) }
      
      var obj_name = fs.get_filename(obj_filename, true)
      var obj_config = commands_commons.get_config_for_obj(obj_name, configs).config

      return processor(obj_filename, obj, obj_config)
    }
  )
}

var _cleanup_json_string = function(json_string) {
  return json_string.replace(/([^"]+)|("[^"]*")/g, function($0, $1, $2) {
      if ($1) {
          return $1.replace(/\s/g, '');
      } else {
          return $2; 
      } 
  })  
}
