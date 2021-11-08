'use strict'
var promise = require('./promise')
var fs = require('fs')
var rimraf = require("rimraf")
var path = require('path')
var util = require('util')

module.exports = function() {
    return fs_facade_factory.get_instance()
}

var fs_facade_factory = {
   instance : undefined,

   get_instance : function() {
       
       if (typeof this.instance === 'undefined' || this.instance === null) {
           this.instance = fs_facade()
       }
       return this.instance 
   }
}

var fs_facade = function() {
    
    return {

        exists : function(file_or_directory) {
          return _exists(file_or_directory)
        }, 

        mkdir : function(directory) {
          return _mkdir_if_needed(directory)
        },

        delete_directory : function(directory, force) {
          return _delete_directory_if_needed(directory, force)
        },        

        fold_directory : function(directory, folder, initial) {
          return _fold_directory(directory, folder, initial)
        },

        read_file : function(file) {
          return _read_file(file)
        },

        write_file : function(file, content) {
          return _write_file(file, content)
        },

        copy_file : function(src, dest) {
          return _copy_file(src, dest)
        },

        move_file : function(src, dest) {
          return _copy_file(src, dest, true)
        },

        delete_file : function(file) {
          return _delete_file(file)
        },

        get_filename : function(path_to_file, exclude_extention) {
          return _get_filename(path_to_file, exclude_extention)
        }
    }
}

var _exists = function(file_or_directory) {
  return fs.existsSync(file_or_directory) 
}

var _mkdir_if_needed = function(directory) {
  if(!_exists(directory)) {
    fs.mkdirSync(directory)
    return true
  }
  return false
}

var _delete_directory_if_needed = function(directory, force) {
  if(!_exists(directory)) {
    return promise.resolve(false)
  }

  var is_a_directory = fs.lstatSync(directory).isDirectory()
  if(!is_a_directory) {
    return promise.reject("'"+directory+"' is not a directory")
  }

  if(force === true) {
    return _recursive_delete(directory)
  }

  try {
    fs.rmdirSync(directory)
    return promise.resolve(true)
  } catch(delete_empty_directory_error) {
    return promise.reject(delete_empty_directory_error)
  } 
}

var _recursive_delete = function(directory) {
  return util.promisify(rimraf)(directory).then(
    function() {
      return true
    }
  )
}

var _fold_directory = function(directory, folder, initial) {
  return util.promisify(fs.readdir, fs)(directory).then(
    function(content) {
      var promise_chain = promise.resolve(initial)
      
      content.forEach(
        function(file, index) {
          promise_chain = promise_chain.then(
            function(acc) {
              return folder(acc, file)
            }
          )
        }
      )

      return promise_chain;
    }
  )
}

var _read_file = function(file) {
  try {
    var content = fs.readFileSync(file, 'utf8')
    return promise.resolve(content)  
  }catch(error) {
    return promise.reject(error)
  }
}

var _write_file = function(file, content) {
  return util.promisify(fs.writeFile, fs)(file, content).then(
    function() {
      return true
    }
  )
}

var _delete_file = function(file) {
  try {
    fs.unlinkSync(file)
    return promise.resolve(true)
  }catch(error) {
    return promise.reject(error)
  }
}

var _copy_file = function(src, dest, delete_src) {
  return new promise(
    function(resolve, reject) {
      var rs = fs.createReadStream(src)
      rs.on("error", function(rs_error) {
        reject(rs_error)
      })
      
      var ws = fs.createWriteStream(destFile)
      ws.on("error", function(ws_error) {
        return reject(ws_error)
      })
      ws.on("close", function() {
        if(delete_src === true) {
          fs.unlinkSync(src)
        }

        resolve(true)
      })

      rs.pipe(ws)
    }
  )
}

var _get_filename = function(path_to_file, exclude_extention) {
  var extention_to_be_excluded = exclude_extention ? path.extname(path_to_file) : undefined
  var filename = path.basename(path_to_file, extention_to_be_excluded)
  return filename
}