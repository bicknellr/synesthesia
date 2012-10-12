module("Utilities", [], function () {
  // Utilities

  var extend = function () {
    var root = new Object();
    for (var i = 0; i < arguments.length; i++) {
      var obj = arguments[i];
      for (var prop in obj) {
        root[prop] = obj[prop];
      }
    }
    
    root._ancestors = [];
    for (var i = 0; i < arguments.length; i++) {
      root._ancestors.push(arguments[i].constructor);
    }
    root._extends = function (ancestor) {
      return (root._ancestors.indexOf(ancestor) != -1);
    };

    return root;
  };

  var Map = (function () {
    function Map () {
      this.keys = [];
      this.values = [];
    }

    Map.prototype.set = function (k, v) {
      if (this.keys.indexOf(k) != -1) {
        this.values[this.keys.indexOf(k)] = v;
      } else {
        this.keys.push(k);
        this.values.push(v);
      }
    };

    Map.prototype.get = function (k, v) {
      return this.values[this.keys.indexOf(k)];
    };

    Map.prototype.remove = function (k) {
      var index = this.keys.indexOf(k);
      if (index == -1) return null;

      this.keys.splice(index, 1);
      return this.values.splice(index, 1);
    };

    Map.prototype.getKeys = function () {
      return this.keys.concat([]);
    };

    return Map;
  })();

  var conforms = function (model_constructor, test_object) {
    var model_object = model_constructor.prototype;

    // Does the test object have properties of matching type to all the model object's properties?
    for (var prop_name in model_object) {
      if (!test_object[prop_name] || (typeof test_object[prop_name] != typeof model_object[prop_name])) {
        return false;
      }
    }

    return true;
  };

  var overrides = function (model_constructor, test_object) {
    if (!conforms(model_constructor, test_object)) {
      return false;
    }

    var model_object = model_constructor.prototype;

    // Does the test object have a new implementation for all properties of the model?
    for (var prop_name in model_object) {
      if (test_object[prop_name] == model_constructor.prototype[prop_name]) {
        return false;
      }
    }

    return true;
  };

  return {
    extend: extend,
    Map: Map,
    conforms: conforms,
    overrides: overrides
  };

});
