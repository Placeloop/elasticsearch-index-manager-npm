'use stric'
var constants = require('../../misc/constants')
var default_values = require('../../misc/default_values')
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')
var fs = require('../../facades/fs')()
var clone = require('../../facades/clone')

var generic_handler = require('./generic_generate_handler_for_obj')

module.exports.handle_query_templates = function(query_templates_filenames, configs) {
 return generic_handler.handle_objs(query_templates_filenames, configs, _handle_query_template, undefined)
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