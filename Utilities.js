module("Utilities", [], function () {
  // Utilities

  var copy_properties = function (source, destination, properties) {
    if (properties) {
      for (var i = 0; i < properties.length; i++) {
        destination[properties[i]] = source[properties[i]];
      }
    } else {
      for (var prop_name in source) {
        destination[prop_name] = source[prop_name];
      }
    }
  };

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

  // Doesn't really work with a * rule...
  var CursorManager = (function () {
    function CursorManager () {
      this.lock_key = null;
      this.old_value = null;
    }

    CursorManager.prototype.acquire = function (cursor_type) {
      if (this.lock_key) return false;
      this.lock_key = new Object();
      this.old_value = document.body.style.getPropertyValue("cursor");
      document.body.style.setProperty("cursor", "" + cursor_type, "important");
      return this.lock_key;
    };

    CursorManager.prototype.release = function (lock_key) {
      if (this.lock_key != lock_key) return false;
      document.body.style.setProperty("cursor", this.old_value);
      this.lock_key = null;
      this.old_value = null;
    };

    return CursorManager;
  })();

  return {
    copy_properties: copy_properties,

    extend: extend,
    conforms: conforms,
    overrides: overrides,

    Map: Map,

    CursorManager: new CursorManager()
  };

});
