module.declare("Synesthesia:UI",
["Utilities", "Synesthesia:UILibrary", "Synesthesia:WindowSystem", "Synesthesia:NodeLibrary"],
function () {

  var Utilities = module.require("Utilities");

  var UILibrary = module.require("Synesthesia:UILibrary");
  var WindowSystem = module.require("Synesthesia:WindowSystem");

  var NodeLibrary = module.require("Synesthesia:NodeLibrary");

  var UI = (function () {
    function UI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.synesthesia = this.params.synesthesia;

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
                    alert("Add an about page?");
                  }).bind(this)
                }),
                new UILibrary.MenuItem({
                  content: document.createTextNode("Preferences"),
                  callback: (function () {
                    alert("Add preferences.");
                  }).bind(this)
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
                    alert("This should clear everything out.");
                  }).bind(this)
                })
              ]
            })
          }),
          new UILibrary.MenuItem({
            content: document.createTextNode("Node"),
            submenu: new UILibrary.Menu({
              items: [
                new UILibrary.MenuItem({
                  content: document.createTextNode("New..."),
                  submenu: new UILibrary.Menu({
                    position: "right",
                    items: [
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Keyboard Input"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.KeyboardInput({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Main Output"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.MainOutput({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createElement("hr"),
                        callback: (function () {

                          return false;

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Oscilloscope"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.Oscilloscope({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createElement("hr"),
                        callback: (function () {

                          return false;

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Oscillator"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.Oscillator({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createElement("hr"),
                        callback: (function () {

                          return false;

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Gain"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.Gain({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Delay"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.Delay({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Biquad Filter"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.BiquadFilter({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Panner"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.Panner({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Dynamics Compressor"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.DynamicsCompressor({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("Live Input"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.LiveInput({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      }),
                      new UILibrary.MenuItem({
                        content: document.createTextNode("File Stream"),
                        callback: (function () {

                          this.addNode(
                            new NodeLibrary.FileStream({
                              synesthesia: this.synesthesia
                            }),
                            {x: 10, y: 10}
                          );

                        }).bind(this)
                      })
                    ]
                  })
                })
              ]
            })
          }),
          new UILibrary.MenuItem({
            content: document.createTextNode("View"),
            submenu: new UILibrary.Menu({
              items: [
                new UILibrary.MenuItem({
                  content: document.createTextNode("Graph"),
                  callback: (function () {

                    this.slideview.gotoView("windowsystem");

                  }).bind(this)
                }),
                new UILibrary.MenuItem({
                  content: document.createTextNode("Envelope Editor"),
                  callback: (function () {

                    this.slideview.gotoView("envelopeeditor");

                  }).bind(this)
                })
              ]
            })
          }),
        ]
      });
        Utilities.addClass(this.mainmenu_menubar.getElement(), "mainmenu");
      this.container.appendChild(this.mainmenu_menubar.getElement());

      this.windowsystem = new WindowSystem({
        container: this.windowsystem_container
      });
      var windowsystem_element = this.windowsystem.getElement();
        //Utilities.addClass(windowsystem_element, "windowsystem");
      //this.container.appendChild(windowsystem_element);

      this.envelopeeditor = new UILibrary.EnvelopeEditor();
      
      this.slideview = new UILibrary.SlideView({
        views: [
          { name: "windowsystem",
            element: windowsystem_element
          },
          { name: "envelopeeditor",
            element: this.envelopeeditor.getElement()
          }
        ]
      });
        Utilities.addClass(this.slideview.getElement(), "slideview");
      this.container.appendChild(this.slideview.getElement());

      this.windowsystem.draw();
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
