'use stric'
var constants = require('../../misc/constants')
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')

var handler_for_put_assets = require('./apply_handler_for_put_assets')
var handler_for_apply = require('./apply_handler_for_apply')
var handler_for_reindex = require('./apply_handler_for_reindex')
var handler_for_update = require('./apply_handler_for_update')

var elasticsearch = require('elasticsearch')

module.exports.put_only = function(params, generated_assets) {
  es_setup = _setup_esclient(params)
  return _put_assets_handler(es_setup, generated_assets).then(
    es_setup.esclient_releaser_on_success
  ).catch(
    es_setup.esclient_releaser_on_error
  )
}

module.exports.put_and_update = function(params, generated_assets) {
  es_setup = _setup_esclient(params)
  return _put_assets_handler(es_setup, generated_assets).then(
    function() {
      return _apply_configs(es_setup, generated_assets.configs, constants.UPDATE_POST_ACTION)
    }
  ).then(
    es_setup.esclient_releaser_on_success
  ).catch(
    es_setup.esclient_releaser_on_error
  )
}

module.exports.put_and_reindex = function(params, generated_assets) {
  es_setup = _setup_esclient(params)
  return _put_assets_handler(es_setup, generated_assets).then(
    function() {
      return _apply_configs(es_setup, generated_assets.configs, constants.REINDEX_POST_ACTION)
    }
  ).then(
    es_setup.esclient_releaser_on_success
  ).catch(
    es_setup.esclient_releaser_on_error
  )
}

module.exports.put_and_auto = function(params, generated_assets) {
  es_setup = _setup_esclient(params)
  return _put_assets_handler(es_setup, generated_assets).then(
    function() {
      return _apply_configs(es_setup, generated_assets.configs)  
    }
  ).then(
    es_setup.esclient_releaser_on_success
  ).catch(
    es_setup.esclient_releaser_on_error
  )
}

var _put_assets_handler = function(es_setup, generated_assets) {
  return promise.resolve().then(
    function() {
      return handler_for_put_assets.put_configs(es_setup, generated_assets.configs)
    }
  ).then(
    function() {
      return handler_for_put_assets.put_pipelines(es_setup, generated_assets.configs, generated_assets.pipelines)
    }
  ).then(
    function() {
      return handler_for_put_assets.put_query_templates(es_setup, generated_assets.configs, generated_assets.query_templates)
    }
  )
}

var _setup_esclient = function(params) {
  var esclient = new elasticsearch.Client({
    host: params.base_url,
    httpAuth: params.basic_auth,
    log: 'info',
    ssl: {
      rejectUnauthorized: false
    },
    requestTimeout : 7200000, // 2H
    keepAlive : false
  });

  var esclient_releaser_on_success = function(arg) {
    esclient.close()
    return promise.resolve(arg)
  }

  var esclient_releaser_on_error = function(arg) {
    esclient.close()
    return promise.reject(arg)
  }

  return { 
    esclient : esclient, 
    esclient_releaser_on_success : esclient_releaser_on_success, 
    esclient_releaser_on_error : esclient_releaser_on_error 
  }
}

var _apply_configs = function(es_setup, configs, forced_post_action) {
  var promise_chain = promise.resolve()

  for (var property in configs) {
    if (configs.hasOwnProperty(property)) {
      var config_name = property
      var config = configs[config_name]
      
      promise_chain = _apply_config(promise_chain, es_setup, config_name, config, forced_post_action)          
    }
  }

  return promise_chain
}

var _apply_config = function(promise_chain, es_setup, config_name, config, forced_post_action) {
  var use_forced_post_action = typeof forced_post_action === 'string' && forced_post_action.trim() !== ''
  return promise_chain.then(
    function() {
      console.log(console_colors.FGBLUE, "")
      console.log(console_colors.FGBLUE, "APPLYING '"+config_name+"' CONFIGURATION ...")
      return promise.resolve()
    }
  ).then(
    function() {
      return handler_for_apply.apply_index_config(es_setup, config_name, config)
    }
  ).then(
    function(update_index_config_result) {
      var post_action =  use_forced_post_action ? forced_post_action : update_index_config_result.post_action
      var current_index_version = update_index_config_result.current_version
      switch(post_action) {

        case constants.UPDATE_POST_ACTION :
          return _update_handler(es_setup, config_name, config)
        
        case constants.REINDEX_POST_ACTION :
          return _reindex_handler(es_setup, config_name, config, current_index_version)
          
        default:
          return promise.resolve() 
      }
    }
  ).then(
    function() {
      console.log(console_colors.FGBLUE, "APPLYING '"+config_name+"' CONFIGURATION DONE!")
      console.log(console_colors.FGBLUE, "")
      
      return promise.resolve()
    }
  )
}

var _update_handler = function(es_setup, config_name, config) {
  return promise.resolve().then(
    function() {
      console.log(console_colors.FGWHITE, "  Updating '"+config_name+"' ...")
    }
  ).then(
    function() {
      return handler_for_update.update_by_query_with_pipeline(es_setup, config_name, config)
    }
  ).then(
    function() {
      console.log(console_colors.FGWHITE, "  '"+config_name+"' updated!")
    }
  )
}

var _reindex_handler = function(params, config_name, config, current_index_version) {
  return promise.resolve().then(
    function() {
      console.log(console_colors.FGWHITE, "  Reindexing '"+config_name+"' with version '"+current_index_version+"' ...")
    }
  ).then(
    function() {
      return handler_for_reindex.reindex_with_pipeline(es_setup, config_name, config, current_index_version)
    }
  ).then(
    function(new_current_version) {
      console.log(console_colors.FGWHITE, "  '"+config_name+"' reindexed with version '"+new_current_version+"'")
    }
  )

}
