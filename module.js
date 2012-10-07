(function () {

  var modules = {};

  function check_modules () {
    var changes = false;

    to_next_module: for (var mod_ix in modules) {
      cur_module = modules[mod_ix];

      if (cur_module.processed) continue;

      for (var req_ix = 0; req_ix < cur_module.requirements.length; req_ix++) {
        var req_name = cur_module.requirements[req_ix];
        if (!modules[req_name]) {
          console.log("module: not found: " + req_name);
          continue to_next_module;
        }
        if (!modules[req_name].processed) {
          console.log("module: not processed: " + req_name);
          continue to_next_module;
        }
      }

      console.log("module: processing: " + cur_module.name);

      try {
        cur_module.exports = cur_module.callback();
      } catch (e) {
        if (e.stack) {
          console.error("module: processing " + cur_module.name + " failed:\n" + e.stack.toString());
        } else {
          console.error("module: processing " + cur_module.name + " failed:");
          console.error(e);
        }
        continue;
      };

      changes = true;
      cur_module.processed = true;
    }

    if (changes) check_modules();
  };

  window.module = function (name, requirements, callback) {
    modules[name] = {
      name: name,
      requirements: requirements,
      callback: callback,
      exports: {},
      processed: false
    };

    check_modules();
  };

  window.require = function (name) {
    return modules[name].exports;
  };

})();
