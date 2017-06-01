'use stric'
var constants = require('../misc/constants')
var default_values = require('../misc/default_values')

var promise = require('../facades/promise')
var generate_handler = require('./generate/generate_handler')
var apply_handler = require('./apply/apply_handler')

module.exports = function() {
  return commands_executor_factory.get_instance()
};

var commands_executor_factory = {
   instance : undefined,

   get_instance : function() {
      if (typeof this.instance === 'undefined' || this.instance === null) {
          this.instance = commands_executor()
      }
      return this.instance 
   }
}

var commands_executor = function() {
  return {
    execute : function(params) {
      return _execute(params);
    }
  }
}

var _execute = function(params) {
  var primise_chain = promise.resolve()
  var is_a_valid_chain = false

  if(params[constants.GENERATE_PARAM_NAME]) {
    is_a_valid_chain = true
    primise_chain = primise_chain.then(
      function() {
        return generate_handler.handle(params)
      }
    ) 
  }

  if(params[constants.APPLY_PARAM_NAME]) {
    is_a_valid_chain = true
    primise_chain = primise_chain.then(
      function(generated_assets) {
        return apply_handler.handle(params, generated_assets)
      }
    ) 
  }

  if(is_a_valid_chain) {
    return primise_chain  
  } else {
    return promise.reject("main param missing (executor)")
  }
}
