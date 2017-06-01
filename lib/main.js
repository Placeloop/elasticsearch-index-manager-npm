'use stric'
var constants = require('./misc/constants')
var default_values = require('./misc/default_values')
var cc = require('./misc/console_colors')

var promise = require('./facades/promise')

var pkg = require('../package.json')

var params_processor = require('./params/params_processor')()
var commands_executor = require('./commands/commands_executor')()


module.exports = function() {
  return main_factory.get_instance()
};

var main_factory = {
   instance : undefined,

   get_instance : function() {
      if (typeof this.instance === 'undefined' || this.instance === null) {
          this.instance = main()
      }
      return this.instance 
   }
}

var main = function() {
  return {
    execute : function(params) {
      return _execute(params)
    }
  }
}

var _execute = function(params) {
  return params_processor.process(params).then(
    function(processed_params) {
      if(processed_params.help) {
        _print_help();
        return promise.resolve(true)
      }

      if(processed_params.version) {
        _print_version();
        return promise.resolve(true)
      }

      console.log("")
      console.log("Executing with params: \n" + JSON.stringify(processed_params, null, 2))

      return commands_executor.execute(processed_params)
    }
  ).catch(
    function(params_processor_error) {
      console.error(cc.FGRED, 'ERROR : ' + params_processor_error)
      return promise.reject(params_processor_error)
    }
  ) 
}

var _print_help = function() {
  console.log("")

  console.log("Usage: ")
  console.log("")

  console.log("  '--"+constants.GENERATE_PARAM_NAME+"': generate the index template for the given configs/configs in ./generated")
  console.log("    '--"+constants.CONFIG_PARAM_PREFIX+"s-dir' : directory with the config/config to be processed")
  console.log("    '--"+constants.CONFIG_PARAM_PREFIX+"s'     : list of 'fullpath+filename' of the configs/configs to be processed")
  console.log("    '--"+constants.CONFIG_PARAM_PREFIX+"'     : 'fullpath+filename' of the config/config to be processed")
  console.log("")
  console.log("")

  console.log("  '--"+constants.APPLY_PARAM_NAME+"'   : apply the generated assets in ./generated to the given elasticsearch instace")
  console.log("    '--"+constants.BASEURL_PARAM_NAME+"'    : directory with the config/config to be processed")
  console.log("    '--"+constants.BASICAUTH_PARAM_NAME+"'  : 'username:password' to be use as Basic HTTP Auth")
  console.log("")
  console.log("")
  
  console.log("  '--"+constants.GENERATE_AND_APPLY_PARAM_NAME+"' : shortcut to '--generate ... && --apply ...'")
  console.log("")
}

var _print_version = function() {
  console.log("")
  console.log(pkg.name + ' | ' + pkg.version)
  console.log("")
}