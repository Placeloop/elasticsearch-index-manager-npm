'use stric'
var elasticsearch_index_manager = require('./lib/main')

module.exports = function() {
  return elasticsearch_index_manager_factory.get_instance();
};

var elasticsearch_index_manager_factory = {

   get_instance : function() {
       return elasticsearch_index_manager(); 
   }

};