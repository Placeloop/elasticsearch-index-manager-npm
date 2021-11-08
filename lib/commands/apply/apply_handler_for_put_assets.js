'use strict'
var constants = require('../../misc/constants')
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')

var commands_commons = require('../_commons/commons.js')

module.exports.put_configs = function (es_setup, configs) {
  return _put_assets(es_setup, "configs", configs, configs, _put_config)
}

module.exports.put_pipelines = function (es_setup, configs, pipelines) {
  return _put_assets(es_setup, "pipelines", configs, pipelines, _put_pipeline)
}

module.exports.put_query_templates = function (es_setup, configs, query_templates) {
  return _put_assets(es_setup, "query_templates", configs, query_templates, _put_query_template) 
}

var _put_assets = function (es_setup, asset_kind, configs, assets, putter) {
  var esclient = es_setup.esclient
  
  var promise_chain = promise.resolve().then(
    function() {
      console.log(console_colors.FGBLUE, "STARTING PUTTING " + asset_kind + " ...")
    }
  )

  var post_actions = {}
  for(var property in assets) {
    if(assets.hasOwnProperty(property)) {
      var asset_name = property
      var next_asset = assets[asset_name]
      var config_with_name = commands_commons.get_config_for_obj(asset_name, configs)

      promise_chain = putter(esclient, promise_chain, config_with_name, asset_name, next_asset).then(
        function(putter_post_action) {
          post_actions[putter_post_action.post_action_for] = putter_post_action.post_action
          return post_actions
        }
      )
    }
  }

  promise_chain = promise_chain.then(
    function(post_actions) {
      console.log(console_colors.FGBLUE, "PUTTING " + asset_kind + " DONE!\n")
      return typeof post_actions !== 'undefined' ? post_actions : {}
    }
  )

  return promise_chain
}

var _put_config = function(esclient, promise_chain, config_with_name, config_name, next_config) {
  return promise_chain.then(
    function() {
      console.log(console_colors.FGWHITE, "  Getting config: '"+config_name+"' ...")
      return esclient.indices.getIndexTemplate({ name : config_name }, { ignore: [404] }).then(
        function(previous_config) {
          console.log(console_colors.FGWHITE, "    Config '"+config_name+"' obtained")
          console.log(console_colors.FGWHITE, "    Putting config '"+config_name+"' ...")
          return esclient.indices.putIndexTemplate({ name : config_name, create : false, body : next_config }).then(
            function() {
              console.log(console_colors.FGWHITE, "    Config '"+config_name+"' put")
              var post_action = _calculate_post_action_for_config(config_with_name, previous_config, next_config)
              console.log(console_colors.FGYELLOW, "    Post action due to / thanks to '"+config_name+"' = '["+post_action.post_action_for+", "+post_action.post_action+"]'")
              return post_action
            }
          )
        }
      )
    }
  )
}

var _calculate_post_action_for_config = function(config_with_name, previous_config, next_config) {
  // TODO
  return { post_action_for : config_with_name.name, post_action : "" }
}

var _put_pipeline = function(esclient, promise_chain, config_with_name, pipeline_name, next_pipeline) {
  return promise_chain.then(
    function() {
      console.log(console_colors.FGWHITE, "  Getting pipeline: '"+pipeline_name+"' ...")
      return esclient.ingest.getPipeline({ id : pipeline_name }, { ignore: [404] }).then(
        function(previous_pipeline) {
          console.log(console_colors.FGWHITE, "    Pipeline '"+pipeline_name+"' obtained")
          console.log(console_colors.FGWHITE, "    Putting pipeline '"+pipeline_name+"' ...")
          return esclient.ingest.putPipeline({ id : pipeline_name, body : next_pipeline }).then(
            function() {
              console.log(console_colors.FGWHITE, "    Pipeline '"+pipeline_name+"' put")
              var post_action = _calculate_post_action_for_pipeline(config_with_name, previous_pipeline, next_pipeline)
              console.log(console_colors.FGYELLOW, "    Post action due to / thanks to '"+pipeline_name+"' = '["+post_action.post_action_for+", "+post_action.post_action+"]'")
              return post_action
            }
          )
        }
      )
    }
  ) 
}

var _calculate_post_action_for_pipeline = function(config_with_name, previous_pipeline, next_pipeline) {
  // TODO
   return { post_action_for : config_with_name.name, post_action : "" }
}

var _put_query_template = function(esclient, promise_chain, config_with_name, query_template_name, next_query_template) {
  return promise_chain.then(
    function() {
      console.log(console_colors.FGWHITE, "  Getting query template: '"+query_template_name+"' ...")
      return esclient.getScript({ id : query_template_name}, { ignore : [404] }).then(
        function(previous_query_template) {
          console.log(console_colors.FGWHITE, "    Query template '"+query_template_name+"' obtained")
          console.log(console_colors.FGWHITE, "    Putting query_template '"+query_template_name+"' ...")
          return esclient.putScript({ id : query_template_name, body : next_query_template }).then(
            function() {
              console.log(console_colors.FGWHITE, "    Query template '"+query_template_name+"' put")
              var post_action = _calculate_post_action_for_query_template(config_with_name, previous_query_template ,next_query_template)
              console.log(console_colors.FGYELLOW, "    Post action due to / thanks to '"+query_template_name+"' = '["+post_action.post_action_for+", "+post_action.post_action+"]'")
              return post_action
            }
          )
        }
      )
    }
  )
}

var _calculate_post_action_for_query_template = function(config_with_name, previous_query_template, next_query_template) {
  // TODO
  return { post_action_for : config_with_name.name, post_action : "" }
}