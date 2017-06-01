'use stric'
var constants = require('../../misc/constants')
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')

var handler_for_assets = require('./apply_handler_for_assets')
var handler_for_create = require('./apply_handler_for_create')
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
    function(post_actions) {
      return _apply_post_actions(es_setup, post_actions, generated_assets.configs, constants.UPDATE_POST_ACTION)
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
    function(post_actions) {
      return _apply_post_actions(es_setup, post_actions, generated_assets.configs, constants.REINDEX_POST_ACTION)
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
    function(post_actions) {
      return _apply_post_actions(es_setup, post_actions, generated_assets.configs)  
    }
  ).then(
    es_setup.esclient_releaser_on_success
  ).catch(
    es_setup.esclient_releaser_on_error
  )
}

var _put_assets_handler = function(es_setup, generated_assets) {
  return handler_for_assets.put_configs(es_setup, generated_assets.configs).then(
    function(post_actions_generated_by_configs) {
      return handler_for_assets.put_pipelines(es_setup, generated_assets.configs, generated_assets.pipelines).then(
        function(post_actions_generated_by_pipelines) {
          return _choose_post_actions(post_actions_generated_by_configs, post_actions_generated_by_pipelines) 
        }
      )
    }
  ).then(
    function(post_actions_from_previous_puts) {
      return handler_for_assets.put_query_templates(es_setup, generated_assets.configs, generated_assets.query_templates).then(
        function(post_actions_generated_by_query_templates) {
          return _choose_post_actions(post_actions_from_previous_puts, post_actions_generated_by_query_templates)
        }
      )
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
    }
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

var _choose_post_actions = function(post_actions1, post_actions2) {
  var choosen_post_actions = {}
  
  for (var property in post_actions1) {
    if (post_actions1.hasOwnProperty(property)) {
      var config_name = property
      
      var post_action1 = post_actions1[config_name]
      var post_action2 = post_actions2[config_name]
  
      var choosen_post_action = ""
      if(post_action1 === constants.REINDEX_POST_ACTION || post_action2 === constants.REINDEX_POST_ACTION) {
        choosen_post_action = constants.REINDEX_POST_ACTION
      } else if(post_action1 === constants.UPDATE_POST_ACTION || post_action2 === constants.UPDATE_POST_ACTION) {
        choosen_post_action = constants.UPDATE_POST_ACTION
      }

      choosen_post_actions[config_name] = choosen_post_action
    }
  }

  return choosen_post_actions
}

var _apply_post_actions = function(es_setup, post_actions, configs, forced_post_action) {
  var promise_chain = promise.resolve()

  for (var property in configs) {
    if (configs.hasOwnProperty(property)) {
      var config_name = property
      var config = configs[config_name]
      var post_action = typeof forced_post_action !== 'undefined' ? forced_post_action : post_actions[config_name]
      
      promise_chain = _apply_post_action(promise_chain, es_setup, post_action, config_name, config)          
    }
  }

  return promise_chain
}

var _apply_post_action = function(promise_chain, es_setup, post_action, config_name, config) {
  return promise_chain.then(
    function() {
      switch(post_action) {

        case constants.UPDATE_POST_ACTION :
          return _update_handler(es_setup, config_name, config)
        
        case constants.REINDEX_POST_ACTION :
          return _reindex_handler(es_setup, config_name, config)
          
        default:
          return promise.resolve()
        
      }
    }
  )
}

var _update_handler = function(es_setup, config_name, config) {
  return promise.resolve().then(
    function() {
      console.log(console_colors.FGWHITE, "")
      console.log(console_colors.FGWHITE, "Updating '"+config_name+"'")
    }
  ).then(
    function() {
      return handler_for_create.create_index(es_setup, config_name, config, false).then(
        function() {
          return handler_for_update.update_by_query_with_pipeline(es_setup, config_name, config)
        }
      )
    }
  )
}

var _reindex_handler = function(params, config_name, config) {
  return promise.resolve().then(
    function() {
      console.log(console_colors.FGWHITE, "")
      console.log(console_colors.FGWHITE, "Reindexing '"+config_name+"'")
    }
  ).then(
    function() {
      return handler_for_create.create_index(es_setup, config_name, config, true).then(
        function() {
          return handler_for_reindex.reindex_with_pipeline(es_setup, config_name, config)
        }
      ) 
    }
  )
}
