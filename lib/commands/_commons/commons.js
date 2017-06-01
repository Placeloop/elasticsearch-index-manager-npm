module.exports.get_config_for_obj = function(obj_name, configs) {
  // The config of the obj can be found thanks to the obj prefix
  // Example:
  //   "./configs/user.json" will generate a config called "user"
  //   "./pipelines/user.json" is a pipeline that will be validate with the "user" config
  //
  // To handle configs with the same prefix, we keep the config with the longer name that match the obj prefix
  // Example:
  //   "./configs/user.json" will generate a config called "user"
  //   "./configs/user_extented_data.json" will generate a config called "user_extended_data"
  //   "./pipelines/user_extended_data.json" prefix match with "user" and "user_extended_data"
  // The config "user_extended_data" will be kept because its name is longer than "user"
    
  var obj_config_name = ""
  var obj_config = undefined
  if(typeof configs === 'undefined' || configs === null) {
    return { name  : "", config : undefined }
  }

  for (var property in configs) {
    if (configs.hasOwnProperty(property)) {
      var config_name = property
      if(obj_name.indexOf(config_name) === 0 && obj_config_name.length <= config_name.length) {
        obj_config_name = config_name
        obj_config = configs[config_name]
      }            
    }
  }

  return { name  : obj_config_name, config : obj_config }
}