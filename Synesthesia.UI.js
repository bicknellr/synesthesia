module("Synesthesia:UI",
["Utilities", "Synesthesia:WindowSystem"],
function () {

  var Utilities = require("Utilities");

  var WindowSystem = require("Synesthesia:WindowSystem");

  var UI = (function () {
    function UI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.running = false;

      this.nodes = [];

      this.container = this.params.container;

      this.window_system = new WindowSystem({
        container: this.container
      });
    }

    UI.prototype.getContainer = function () {
      return this.container;
    };

    UI.prototype.getWindowSystem = function () {
      return this.window_system;
    };

    UI.prototype.addNode = function (new_node, params) {
      var params = (typeof params !== "undefined" ? params : {});

      new_node.getWindow().attachWindowSystem(this.window_system);
      this.window_system.addWindow(new_node.getWindow(), params);
    };

    return UI;
  })();

  return UI;
});
