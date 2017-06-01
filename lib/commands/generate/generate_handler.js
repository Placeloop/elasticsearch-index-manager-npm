'use stric'
var constants = require('../../misc/constants')
var default_values = require('../../misc/default_values')
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')
var clone = require('../../facades/clone')
var fs = require('../../facades/fs')()

var configs_handler = require('./generate_handler_for_configs')
var pipelines_handler = require('./generate_handler_for_pipelines')
var query_templates_handler = require('./generate_handler_for_query_templates')

module.exports.handle = function(params) {
  var cloned_params = clone(params)

  return promise.resolve().then(
    function() {

      console.log(console_colors.FGWHITE, "")
      console.log("==================== GENERATION STARTS =====================")
      
      var configs_filenames = cloned_params[constants.CONFIGS_PARAM_NAME]
      var pipelines_filenames = cloned_params[constants.PIPELINES_PARAM_NAME]
      var query_templates_filenames = cloned_params[constants.QUERY_TEMPLATES_PARAM_NAME]

      return _handle_files(configs_filenames, pipelines_filenames, query_templates_filenames).then(
        function(generated_assets) {
          var generate_dir = cloned_params[constants.GENERATE_DIR_PARAM_NAME]
          
          var promise_chain = promise.resolve()
          if(generate_dir !== '') {
            promise_chain = promise_chain.then(
              function() {
                return _store_generated_assets(generated_assets, generate_dir)
              }
            ) 
          }
          
          promise_chain = promise_chain.then(
            function() {
              console.log(console_colors.FGWHITE, "")
              console.log("==================== GENERATION ENDS =====================")
              return generated_assets
            }
          )

          return promise_chain 
        }
      )
    }
  )
}

var _handle_files = function(configs_filenames, pipelines_filenames, query_templates_filenames) {
  return configs_handler.handle_configs(configs_filenames).then(
    function(generated_configs_asso_array) {
      return pipelines_handler.handle_pipelines(pipelines_filenames, generated_configs_asso_array).then(
        function(generated_pipelines_asso_array) {
          return query_templates_handler.handle_query_templates(query_templates_filenames, generated_configs_asso_array).then(
            function(generated_query_templates_asso_array) {
              return { 
                configs : generated_configs_asso_array,
                pipelines : generated_pipelines_asso_array,
                query_templates : generated_query_templates_asso_array
              }
            }
          )
        }
      ) 
    }
  )
}

var _store_generated_assets = function(generated_assets, generate_dir) {
  var generate_configs_dir = generate_dir+"/configs"
  var generate_pipelines_dir = generate_dir+"/pipelines"
  var generate_query_templates_dir = generate_dir+"/query_templates"

  var promise_chain = promise.resolve(false)

  if(fs.exists(generate_dir)) {
    promise_chain = promise_chain.then(
      function() {
        console.log(console_colors.FGYELLOW, "")
        console.log("WARNING: directory '" + generate_dir + "' cleaned")
        return fs.delete_directory(generate_dir, true);
      }
    )  
  }

  promise_chain = promise_chain.then(
    function() {
      console.log(console_colors.FGWHITE, "")
      console.log("Creating directories in '" + generate_dir + "'")
    }
  )
  
  promise_chain = _create_directory(promise_chain, generate_dir)
  promise_chain = _create_directory(promise_chain, generate_configs_dir)
  promise_chain = _create_directory(promise_chain, generate_pipelines_dir)
  promise_chain = _create_directory(promise_chain, generate_query_templates_dir)

  promise_chain = promise_chain.then(
    function() {
      console.log(console_colors.FGWHITE, "")
      console.log("Storing assets in '" + generate_dir + "'")
    }
  )

  promise_chain = _store_asset(promise_chain, generate_configs_dir, generated_assets.configs)
  promise_chain = _store_asset(promise_chain, generate_pipelines_dir, generated_assets.pipelines)
  promise_chain = _store_asset(promise_chain, generate_query_templates_dir, generated_assets.query_templates)

  return promise_chain
}

var _create_directory = function(promise_chain, directory) {
  return promise_chain.then(
    function() {
      console.log("Creating directory '" + directory + "'")
      return fs.mkdir(directory)
    }
  )
}

var _store_asset = function(promise_chain, directory, assets_asso_array) {
  for (var property in assets_asso_array) {
    if (assets_asso_array.hasOwnProperty(property)) {
      (function(asset_name){
        promise_chain = promise_chain.then(
          function() {
            var path_to_file = directory + "/" + asset_name + ".json"
            var file_content = JSON.stringify(assets_asso_array[asset_name], null, 2)
            return fs.write_file(path_to_file, file_content).then(
              function() {
                console.log("Asset '" + asset_name + "' stored in '"+path_to_file+"'")
              }
            ).catch(
              function(error) {
                console.error(console_colors.FGRED, "")
                console.error("Asset '" + asset_name + "' was not stored in '"+path_to_file+"' due to: ", error)
                return promise.resolve()
              }
            )
          }
        )
      })(property)              
    }
  }

  return promise_chain
}