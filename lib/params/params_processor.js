'use stric'
var constants = require('../misc/constants')
var default_values = require('../misc/default_values')

var promise = require('../facades/promise')
var clone = require('../facades/clone')

var handlers = require('./params_processor_handlers')

module.exports = function() {
  return params_processor_factory.get_instance()
};

var params_processor_factory = {
   instance : undefined,

   get_instance : function() {
      if (typeof this.instance === 'undefined' || this.instance === null) {
          this.instance = params_processor()
      }
      return this.instance 
   }
}

var params_processor = function() {
  return {
    process : function(params) {
      return _process(params);
    }
  }
}

var _process = function(params) {
  if(params.help === true) {
    return promise.resolve({ help : true })
  }

  if(params.version === true) {
    return promise.resolve({ version : true })
  }

  if(params[constants.GENERATE_PARAM_NAME] === true) {
    return handlers.handle_generate_param(params);
  }

  if(typeof params[constants.APPLY_PARAM_NAME] === 'string') {
    return handlers.handle_apply_param(params)
  }

  if(typeof params[constants.GENERATE_AND_APPLY_PARAM_NAME] === 'string') {
    return handlers.handle_generate_param(params).then(
      function(generate_params) {
        return handlers.handle_apply_param(params).then(
          function(apply_params) {
            return _merge_params(generate_params, apply_params)
          }
        )
      }
    )
  }

  return promise.reject("main param missing (processor)");
}

var _merge_params = function(generate_params, apply_params) {
  return Object.assign(clone(generate_params), clone(apply_params))
}