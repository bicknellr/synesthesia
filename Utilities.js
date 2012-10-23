module.declare("Utilities", [], function () {
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

  var getPagePosition = function (element) {
    var cur_element = element;
    var cur_left = element.offsetLeft;
    var cur_top = element.offsetTop;
    while (cur_element.offsetParent != document.body) {
      cur_element = cur_element.offsetParent;
      cur_left += cur_element.offsetLeft;
      cur_top += cur_element.offsetTop;
    }
    return { top: cur_top, left: cur_left };
  };

  var addClass = function (element, new_class) {
    if (element.className.split(" ").indexOf(new_class) != -1) return;
    element.className = element.className + " " + new_class;
  };

  var removeClass = function (element, rm_class) {
    element.className = element.className.replace(rm_class, "").replace(/(\s\s+)/g, " ").replace(/^\s+|\s+$/g, "");
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

  var range = function (n) {
    var output = [];
    for (var i = 0; i < n; i++) {
      output.push(i);
    }
    return output;
  };

  /*
    'source' refers to a key that should be associated with a listener.
    When the value is updated, the source key indicates which listener not to call.
    Generally, the source should be the object for which the listener does updating
    for that object based upon the new value.
  */
  var SynchronizedValue = (function () {
    function SynchronizedValue (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.value = null;

      this.listeners = [];
    }

    SynchronizedValue.prototype.setValue = function (source, new_value) {
      this.value = new_value;
      for (var i = 0; i < this.listeners.length; i++) {
        if (this.listeners[i].source == source) continue;

        this.listeners[i].listener(this.value);
      }
    };

    SynchronizedValue.prototype.getValue = function () {
      return this.value;
    };

    SynchronizedValue.prototype.addListener = function (new_source, new_listener) {
      this.listeners.push({
        source: new_source,
        listener: new_listener
      });
    };

    SynchronizedValue.prototype.removeListener = function (rm_listener) {
      this.listeners.splice(this.listeners.indexOf(rm_listener), 1);
    };

    return SynchronizedValue;
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

  var Flaggable = (function () {
    function Flaggable () {
      this._flags = [];
    }

    Flaggable.prototype.setFlag = function (flag) {
      this._flags.push(flag);
    };

    Flaggable.prototype.hasFlag = function (flag) {
      return this._flags.indexOf(flag) != -1;
    };

    Flaggable.prototype.unsetFlag = function (flag) {
      while (this._flags.indexOf(flag) != -1) {
        this._flags.splice(
          this._flags.indexOf(flag),
          1
        );
      }
    };

    return Flaggable;
  })();

  return {
    copy_properties: copy_properties,

    extend: extend,
    conforms: conforms,
    overrides: overrides,

    getPagePosition: getPagePosition,
    addClass: addClass,
    removeClass: removeClass,

    Flaggable: Flaggable,
    Map: Map,
    SynchronizedValue: SynchronizedValue,

    range: range,

    CursorManager: new CursorManager()
  };

});
