'use stric'
var constants = require('../misc/constants')
var default_values = require('../misc/default_values')

var promise = require('../facades/promise')
var fs = require('../facades/fs')()

module.exports.handle_generate_param = function(params) {
  return _handle_config_params(params).then(
    function(configs) {
      if(configs.length === 0) {
        return promise.reject("'generate' requires a 'config*' param")
      }
      params.configs = configs;

      return _handle_pipeline_params(params)
    }
  ).then(
    function(pipelines) {
      params.pipelines = pipelines;
      return _handle_query_templates_params(params)
    }
  ).then(
    function(query_templates) {
      var generate_dir = default_values.GENERATE_DIR
      if(typeof params['generate-dir'] === 'string' && params['generate-dir'].trim()) {
        generate_dir = params['generate-dir']
      }

      var processed_params = {}
      processed_params[constants.GENERATE_PARAM_NAME] = true
      processed_params[constants.CONFIGS_PARAM_NAME] = params.configs
      processed_params[constants.PIPELINES_PARAM_NAME] = params.pipelines
      processed_params[constants.QUERY_TEMPLATES_PARAM_NAME] = query_templates
      processed_params[constants.GENERATE_DIR_PARAM_NAME] = generate_dir
      
      return processed_params
    }
  )
}

module.exports.handle_apply_param = function(params) {
  var processed_params = {}
  
  if(typeof params[constants.APPLY_PARAM_NAME] !== 'string' || params[constants.APPLY_PARAM_NAME].length === 0) {
    if(typeof params[constants.GENERATE_AND_APPLY_PARAM_NAME] !== 'string' || params[constants.GENERATE_AND_APPLY_PARAM_NAME].length === 0) {
      return promise.reject("missing apply command")
    }
    processed_params[constants.APPLY_PARAM_NAME] = params[constants.GENERATE_AND_APPLY_PARAM_NAME]
  } else {
    processed_params[constants.APPLY_PARAM_NAME] = params[constants.APPLY_PARAM_NAME]  
  }
  
  if(typeof params[constants.BASEURL_PARAM_NAME] !== 'string' || params[constants.BASEURL_PARAM_NAME].length === 0) {
    return promise.reject("missing base url")
  } else {
    processed_params[constants.BASEURL_PARAM_NAME] = params[constants.BASEURL_PARAM_NAME]  
  }
  
  if(typeof params[constants.BASICAUTH_PARAM_NAME] === 'string' && params[constants.BASICAUTH_PARAM_NAME].length > 0) {
    processed_params[constants.BASICAUTH_PARAM_NAME] = params[constants.BASICAUTH_PARAM_NAME]
  }

  if(typeof params[constants.GENERATE_DIR_PARAM_NAME] === 'string' && params[constants.GENERATE_DIR_PARAM_NAME].length > 0) {
    processed_params[constants.GENERATE_DIR_PARAM_NAME] = params[constants.GENERATE_DIR_PARAM_NAME]
  }
  
  return promise.resolve(processed_params)
}

var _handle_config_params = function(params) {
   return _handle_file_list_params('config', params)
}

var _handle_pipeline_params = function(params) {
   return _handle_file_list_params('pipeline', params)
}

var _handle_query_templates_params = function(params) {
   return _handle_file_list_params('query-template', params)
}

var _handle_file_list_params = function(param_prefix, params) {
  var directory_name_param = param_prefix + 's-dir'
  var filename_array_param = param_prefix + 's' 
  var filename_param = param_prefix

  if(params[directory_name_param]) {
    return fs.fold_directory(params[directory_name_param], 
      function(acc, filename) {
        acc.push(params[directory_name_param] + '/' + filename)
        return acc
      },
      []
    )
  }
   
  if(params[filename_array_param]) {
    var split = params[filename_array_param].split(',')
    filename_array = split.reduce(
      function(acc, filename){ 
        var trimmed_filename = filename.trim()
        if(trimmed_filename !== '') {
          acc.push(trimmed_filename)  
        }
        return acc
      }, 
      []
    )
    return promise.resolve(filename_array)
  }

  if(params[filename_param]) {
    var filename_array = []

    var trimmed_filename = params[filename_param].trim()
    if(trimmed_filename !== '') {
      filename_array.push(trimmed_filename)  
    }
    
    return promise.resolve(filename_array)
  }

  return promise.resolve([])
}