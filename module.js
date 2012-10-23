(function () {

  window.modules = {};

  function check_modules () {
    var changes = false;

    to_next_module: for (var mod_ix in modules) {
      cur_module = modules[mod_ix];

      if (cur_module.processed) continue;

      for (var req_ix = 0; req_ix < cur_module.dependencies.length; req_ix++) {
        var req_name = cur_module.dependencies[req_ix];
        if (!modules[req_name]) {
          console.log("module: Dependency '" + req_name + "' for '" + cur_module.name + "' not found.");
          continue to_next_module;
        }
        if (!modules[req_name].processed) {
          console.log("module: Dependency '" + req_name + "' for '" + cur_module.name + "' not processed.");
          continue to_next_module;
        }
      }

      console.log("module: Processing '" + cur_module.name + "'.");

      try {
        cur_module.exports = cur_module.callback.apply(window);
      } catch (e) {
        if (e.stack) {
          console.error("module: Processing '" + cur_module.name + "' failed:\nStack:\n" + e.stack.toString() + "\nError:\n" + e.toString());
        } else {
          console.error("module: Processing '" + cur_module.name + "' failed:");
          console.error(e);
        }
        continue to_next_module;
      };

      changes = true;
      cur_module.processed = true;
    }

    if (changes) check_modules();
  };

  window.module = function (name, dependencies, callback) {
    modules[name] = {
      name: name,
      dependencies: dependencies,
      callback: callback,
      exports: {},
      processed: false
    };

    check_modules();
  };

  window.require = function (name) {
    if (!modules[name]) {
      throw new Error("module: Unsatisfied dependency (" + name + ") requested!");
    }
    return modules[name].exports;
  };

})();
