'use stric'
var console_colors = require('../../misc/console_colors')

var promise = require('../../facades/promise')
var fs = require('../../facades/fs')()

var commands_commons = require('../_commons/commons.js')

module.exports.handle_objs = function(objs_filenames, configs, processor, post_processor, handler) {
  var _valid_processor = typeof processor === 'function' ? processor : function(obj_filename, obj, obj_config) { return obj }
  var _valid_post_processor = typeof post_processor === 'function' ? post_processor : function(generated_objs, configs) { return generated_objs }
  var _valid_handler = typeof handler === 'function' ? handler : _handler
  
  var promise_chain = promise.resolve({})
  
  objs_filenames.forEach(function(obj_filename){
    var suffix = ".json";
    if(obj_filename.indexOf(suffix, this.length - suffix.length) >= 0) {
      promise_chain = promise_chain.then(
        function(generated_objs) {
          return _valid_handler(obj_filename, configs, _valid_processor).then(
            function(obj) {
              var obj_name = fs.get_filename(obj_filename, true)
              generated_objs[obj_name] = obj
              return generated_objs
            }
          ).catch(
            function(error) {
              console.error(console_colors.FGRED,"")
              console.error("File '"+obj_filename+"' skipped due to: ", error)
              return generated_objs
            }
          )  
        }
      )
    }
  })

  promise_chain = promise_chain.then(
    function(generated_objs) {
      return _valid_post_processor(generated_objs, configs)
    }
  )

  return promise_chain
}

var _handler = function(obj_filename, configs, processor) {
  return fs.read_file(obj_filename).then(
    function(file_content) {
      var obj = JSON.parse(file_content)
      
      var obj_name = fs.get_filename(obj_filename, true)
      var obj_config = commands_commons.get_config_for_obj(obj_name, configs).config

      return processor(obj_filename, obj, obj_config)
    }
  )
}