module.declare("Synesthesia:UI",
["Utilities", "Synesthesia:WindowSystem"],
function () {

  var Utilities = module.require("Utilities");

  var WindowSystem = module.require("Synesthesia:WindowSystem");

  var UI = (function () {
    function UI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.running = false;

      this.nodes = [];

      this.container = this.params.container;
        Utilities.addClass(this.container, "Synesthesia_UI");

      this.mainmenu_container = document.createElement("div");
        Utilities.addClass(this.mainmenu_container, "mainmenu");
        this.mainmenu_container.appendChild(document.createTextNode("TEST"));
      this.container.appendChild(this.mainmenu_container);

      this.windowsystem_container = document.createElement("div");
        Utilities.addClass(this.windowsystem_container, "windowsystem");
      this.container.appendChild(this.windowsystem_container);
      this.windowsystem = new WindowSystem({
        container: this.windowsystem_container
      });
    }

    UI.prototype.getContainer = function () {
      return this.container;
    };

    UI.prototype.getWindowSystem = function () {
      return this.windowsystem;
    };

    UI.prototype.addNode = function (new_node, params) {
      var params = (typeof params !== "undefined" ? params : {});

      new_node.getWindow().attachWindowSystem(this.windowsystem);
      this.windowsystem.addWindow(new_node.getWindow(), params);
    };

    return UI;
  })();

  return UI;
});
