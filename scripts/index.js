var program = require('commander');
var npm = require('npm');
var packageJSON = require( process.cwd() + '/package.json');
var getModulePrefixes = require('./libs/get-module-prefixes');
var q = require('q');
var modulesPrefixes =  getModulePrefixes(packageJSON);
var getFrameworkInstance = {
  commander: function (program) {
    return program;
  },
  vorpal: function (Program) {
    return new Program();
  }
};


function commular() {
  var deferred = q.defer();
  npm.load({
    loaded: false
  }, function(error) {
    if(error) {
      return deferred.reject(err);
    }
    npm.commands.ls([], true, function(err, data) {
      var keys;
      var customCLI = packageJSON.cli;
      var framework = customCLI || "commander";
      if (err) {
        return deferred.reject(err);
      }
      keys = Object.keys(data.dependencies || data._dependencies);

      try{
        keys.forEach(function(dependency) {
          var cli;
          if(dependency === framework) {
            cli = require(framework);
            program = getFrameworkInstance[framework](cli);
            throw new Error('CLI Framework resolved as: ' + framework);
          }
        });
      }catch(er){
        if(commular.debug) {
          console.log('\n', er.message, '\n');
        }
      }

      program
        .version(packageJSON.version);

      keys.forEach(function(dependency) {
        modulesPrefixes.forEach(function (prefix) {
          if (dependency.indexOf( prefix + '-') === 0) {
            require(dependency).command(program);
          }
        });
      });
      program.parse(process.argv);
      deferred.resolve(program);
    });
  });
  return deferred.promise;
}
commular.getProgram = function () {
  return program;
};

module.exports = commular;
