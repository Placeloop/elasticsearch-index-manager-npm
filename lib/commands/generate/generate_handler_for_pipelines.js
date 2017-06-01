'use stric'
var clone = require('../../facades/clone')

var generic_handler = require('./generic_generate_handler_for_obj')

module.exports.handle_pipelines = function(pipelines_filenames, configs) {
 return generic_handler.handle_objs(pipelines_filenames, configs, _handle_pipeline, _generate_and_merge_pipeline_for_configs)
}

var _handle_pipeline = function(pipeline_filename, pipeline, pipeline_config) {
  if(pipeline.processors === null || !Array.isArray(pipeline.processors)) {
    pipeline.processors = []
  }

  if(typeof pipeline_config !== 'undefined' && pipeline_config !== null) {
    return _validate_pipeline_for_config(pipeline, pipeline_config)
  } else {
    return pipeline
  }
}

var _validate_pipeline_for_config = function(pipeline, pipeline_config) {
  // TODO
  return pipeline
}

var _generate_and_merge_pipeline_for_configs = function(generated_pipelines, configs) {

  var cloned_pipelines = clone(generated_pipelines)

  for (var property in configs) {
    if (configs.hasOwnProperty(property)) {
      var config_name = property
      
      var generated_pipeline = _generate_pipeline_for_config(configs[config_name])
      var existent_pipeline  = cloned_pipelines[config_name]
      
      var pipeline = _merge_pipelines(generated_pipeline, existent_pipeline)
      
      cloned_pipelines[config_name] = pipeline
    }
  }

  return cloned_pipelines
}

var _generate_pipeline_for_config = function(config) {
  // TODO
  return { "processors" : [] }
}

var _merge_pipelines = function(generated_pipeline, existent_pipeline) {
  if(typeof existent_pipeline === 'undefined') {
    return generated_pipeline
  }

  var cloned_existent = clone(existent_pipeline)
  cloned_existent.processors = generated_pipeline.processors.concat(existent_pipeline.processors)

  return cloned_existent
}