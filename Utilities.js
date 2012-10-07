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

    return Map;
  })();

  return {
    extend: extend,
    Map: Map
  };

});
