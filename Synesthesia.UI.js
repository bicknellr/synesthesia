module.declare("Synesthesia:UI",
["Utilities", "Synesthesia:UILibrary", "Synesthesia:WindowSystem"],
function () {

  var Utilities = module.require("Utilities");

  var UILibrary = module.require("Synesthesia:UILibrary");
  var WindowSystem = module.require("Synesthesia:WindowSystem");

  var UI = (function () {
    function UI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.running = false;

      this.nodes = [];

      this.container = this.params.container;
        Utilities.addClass(this.container, "Synesthesia_UI");

      this.mainmenu_menubar = new UILibrary.Menu({
        self_closeable: false,
        type: "bar",
        hover: false,
        items: [
          new UILibrary.MenuItem({
            content: document.createTextNode("Synesthesia"),
            submenu: new UILibrary.Menu({
              items: [
                new UILibrary.MenuItem({
                  content: document.createTextNode("About Synesthesia"),
                  callback: (function () {

                  }).bind(this)
                }),
                new UILibrary.MenuItem({
                  content: document.createTextNode("Preferences"),
                  submenu: new UILibrary.Menu({
                    position: "right",
                    items: [
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Audio Preferences..."),
                        callback: (function () {

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("UI Preferences"),
                        submenu: new UILibrary.Menu({
                          position: "right",
                          items: [
                            new UILibrary.MenuItem({
                              content: document.createTextNode("Color Scheme..."),
                              callback: (function () {

                              }).bind(this)
                            }),
                            new UILibrary.MenuItem({
                              content: document.createTextNode("Font Preferences..."),
                              callback: (function () {

                              }).bind(this)
                            }),
                          ]
                        })
                      }),
                    ]
                  })
                })
              ]
            })
          }),
          new UILibrary.MenuItem({
            content: document.createTextNode("File"),
            submenu: new UILibrary.Menu({
              items: [
                new UILibrary.MenuItem({
                  content: document.createTextNode("New Project..."),
                  callback: (function () {

                  }).bind(this)
                })
              ]
            })
          })
        ]
      });
        Utilities.addClass(this.mainmenu_menubar.getElement(), "mainmenu");
      this.container.appendChild(this.mainmenu_menubar.getElement());

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
