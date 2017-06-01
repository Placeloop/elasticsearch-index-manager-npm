'use stric'
var constants = require('../../misc/constants')
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')

var dispatcher = require('./apply_handler_dispatcher')

module.exports.handle = function(params, generated_assets) {
  
  var valid_generated_assets = generated_assets
  if(typeof valid_generated_assets === 'undefined' || valid_generated_assets === null) {
    valid_generated_assets = _load_generated_data_from_dir(params[constants.GENERATE_DIR_PARAM_NAME])
  }

  if(_is_an_empty_object(valid_generated_assets.configs) && 
    _is_an_empty_object(valid_generated_assets.pipelines) && 
    _is_an_empty_object(valid_generated_assets.query_templates)) {
    return promise.reject("invalid generated assets")
  }

  var handler = dispatcher[params[constants.APPLY_PARAM_NAME]] 
  if(typeof handler !== 'function') {
    return promise.reject("invalid apply command '"+params[constants.APPLY_PARAM_NAME]+"'")
  }

  console.log(console_colors.FGWHITE, "")
  console.log("==================== APPLY STARTS =====================")

  var handler_params = { 
    base_url : params[constants.BASEURL_PARAM_NAME], 
    basic_auth : params[constants.BASICAUTH_PARAM_NAME] 
  }

  return handler(handler_params, valid_generated_assets).then(
    function() {
      console.log(console_colors.FGWHITE, "")
      console.log("==================== APPLY ENDS =====================")
    }
  )
}

var _load_generated_data_from_dir = function(directory) {
  // TODO
  return promise.resolve({})
}

var _is_an_empty_object = function(obj) {
  if(typeof obj === 'undefined' || obj === null) {
    return true
  }

  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
      return false            
    }
  }
  return true
}