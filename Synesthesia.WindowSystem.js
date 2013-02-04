module.declare("Synesthesia:WindowSystem",
["Utilities", "Synesthesia:UILibrary", "Synesthesia:Graph"],
function () {

  var Utilities = module.require("Utilities");

  var Synesthesia = module.require("Synesthesia");
  var UILibrary = module.require("Synesthesia:UILibrary");
  var Graph = module.require("Synesthesia:Graph");

  var WindowSystem = (function () {
    function WindowSystem (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.ui = this.params.ui;

      this.container = document.createElement("div");
        Utilities.addClass(this.container, "Synesthesia_WindowSystem");

      this.node_windows = [];

      var canvas = document.createElement("canvas");
      this.container.appendChild(canvas);
      this.node_canvas = new WindowSystem.NodeCanvas({
        window_system: this,
        canvas: canvas
      });
      
      this.node_div = document.createElement("div");
      this.node_div.className = "Synesthesia_WindowSystem__node_window_container";
      this.container.appendChild(this.node_div);
    }

    WindowSystem.prototype.getElement = function () {
      return this.container;
    };

    WindowSystem.prototype.getUI = function () {
      return this.ui;
    };

    WindowSystem.prototype.getDimensions = function () {
      return {
        width: this.container.offsetWidth,
        height: this.container.offsetHeight
      };
    };

    WindowSystem.prototype.addWindow = function (node_window, params) {
      this.node_div.appendChild(
        node_window.getElement()
      );
        
      this.node_windows.push(node_window);

      for (var prop_name in params) {
        if (!params.hasOwnProperty(prop_name)) continue;
        node_window[prop_name] = params[prop_name];
      }
      node_window.reflow();
      this.node_canvas.addNodeWindow(node_window);
    };

    WindowSystem.prototype.removeWindow = function (node_window) {
      this.node_canvas.removeNodeWindow(node_window);

      this.node_div.removeChild(
        node_window.getElement()
      );

      this.node_windows.splice(
        this.node_windows.indexOf(node_window),
        1
      );
    };

    WindowSystem.prototype.bringToFront = function (node_window) {
      // Make the node window the last element in the container to move it to the front.
      if (this.node_div.children[this.node_div.children.length - 1] != node_window.getElement()) {
        this.node_div.removeChild(node_window.getElement());
        this.node_div.appendChild(node_window.getElement());
        this.draw();
      }
    };

    WindowSystem.prototype.draw = function () {
      this.node_canvas.draw();
    };

    return WindowSystem;
  })();

  WindowSystem.NodeCanvas = (function () {
    function NodeCanvas (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.window_system = this.params.window_system;

      this.canvas = this.params.canvas;
        this.canvas.className = "Synesthesia_WindowSystem_NodeCanvas__canvas";
        this.canvas.addEventListener("mousemove", (function (e) {
          this.draw();
        }).bind(this), false);
        this.canvas.addEventListener("mouseout", (function (e) {
          this.draw();
        }).bind(this), false);
      this.context = this.canvas.getContext("2d");

      this.node_windows = [];
      this.connections_map = new Utilities.Map();

      this.selected_endpoint = null;
      this.temporary_connection = null;
      this.temporary_endpoint = null;

      this.init();
    }

    NodeCanvas.prototype.init = function () {
      this.canvas.addEventListener("mousedown", this.handle_mousedown.bind(this), false);
      window.addEventListener("mousemove", this.handle_mousemove.bind(this), false);
      window.addEventListener("mouseup", this.handle_mouseup.bind(this), false);
      window.addEventListener("mouseout", this.handle_mouseup.bind(this), false);

      this.canvas.addEventListener("mousewheel", this.handle_mousewheel.bind(this), false);

      this.draw();
    };

    NodeCanvas.prototype.addNodeWindow = function (new_node_window) {
      this.node_windows.push(new_node_window);

      this.draw();
    };

    NodeCanvas.prototype.removeNodeWindow = function (rm_node_window) {
      this.node_windows.splice(
        this.node_windows.indexOf(rm_node_window),
        1
      );

      this.draw();
    };

    // Event handlers.

    NodeCanvas.prototype.handle_mousedown = function (e) {
      var canvas_pagePosition = Utilities.getPagePosition(this.canvas);
      var canvasX = e.pageX - canvas_pagePosition.left;
      var canvasY = e.pageY - canvas_pagePosition.top;

      var selectable_endpoint = this.getSelectableEndpointForPoint({
        x: canvasX, y: canvasY
      });

      if (selectable_endpoint) {
        this.selected_endpoint = selectable_endpoint;

        var edit_connection = this.selected_endpoint.getConnectionForPoint({
          x: canvasX, y: canvasY
        });

        if (edit_connection) {
          this.temporary_connection = edit_connection;
          edit_connection.from_endpoint.informDisconnected(edit_connection);
          edit_connection.to_endpoint.informDisconnected(edit_connection);
          if (selectable_endpoint.direction == "input") {
            this.temporary_endpoint = new WindowSystem.UIEndpoint({
              type: null,
              direction: "input"
            });
            this.temporary_endpoint.setPosition(canvasX - 10, canvasY - 10);
            this.selected_endpoint = edit_connection.from_endpoint;
            edit_connection.setToEndpoint(this.temporary_endpoint);
          } else if (this.selected_endpoint.direction == "output") {
            this.temporary_endpoint = new WindowSystem.UIEndpoint({
              type: null,
              direction: "output"
            });
            this.temporary_endpoint.setPosition(canvasX - 10, canvasY - 10);
            this.selected_endpoint = edit_connection.to_endpoint;
            edit_connection.setFromEndpoint(this.temporary_endpoint);
          }
        } else {
          // Correct direction.
          if (this.selected_endpoint.direction == "input") {
            this.temporary_endpoint = new WindowSystem.UIEndpoint({
              type: null,
              direction: "output"
            });
            this.temporary_endpoint.setPosition(canvasX - 10, canvasY - 10);
            this.temporary_connection = new WindowSystem.UIConnection({
              from_endpoint: this.temporary_endpoint,
              to_endpoint: this.selected_endpoint,
              descriptor: new Graph.ConnectionDescriptor({
                from_endpoint: this.temporary_endpoint.getDescriptor(),
                to_endpoint: this.selected_endpoint.getDescriptor()
              })
            });
          } else if (this.selected_endpoint.direction == "output") {
            this.temporary_endpoint = new WindowSystem.UIEndpoint({
              type: null,
              direction: "input"
            });
            this.temporary_endpoint.setPosition(canvasX - 10, canvasY - 10);
            this.temporary_connection = new WindowSystem.UIConnection({
              from_endpoint: this.selected_endpoint,
              to_endpoint: this.temporary_endpoint,
              descriptor: new Graph.ConnectionDescriptor({
                from_endpoint: this.selected_endpoint.getDescriptor(),
                to_endpoint: this.temporary_endpoint.getDescriptor()
              })
            });
          }
          this.connections_map.set(this.temporary_connection.getDescriptor(), this.temporary_connection);
        }
      }

      this.last_pageX = canvasX;
      this.last_pageY = canvasY;

      this.isMousedown = true;
    };

    NodeCanvas.prototype.handle_mousemove = function (e) {
      var canvas_pagePosition = Utilities.getPagePosition(this.canvas);
      var canvasX = e.pageX - canvas_pagePosition.left;
      var canvasY = e.pageY - canvas_pagePosition.top;

      var selectable_endpoint = this.getSelectableEndpointForPoint({
        x: canvasX, y: canvasY
      });
      this.unsetFlagAllEndpoints("hovering");
      this.unsetFlagAllEndpoints("selecting");
      if (selectable_endpoint) {
        if (this.selected_endpoint && this.selected_endpoint.canConnectTo(selectable_endpoint)) {
          selectable_endpoint.setFlag("hovering");
          selectable_endpoint.setFlag("selecting");
        } else if (!this.selected_endpoint) {
          selectable_endpoint.setFlag("hovering");
          selectable_endpoint.setFlag("selecting");
        }
      }

      if (this.temporary_endpoint) {
        this.temporary_endpoint.setPosition(canvasX - 10, canvasY - 10);
      }

      if (!this.isMousedown) return;

      //console.log("NodeCanvas mousemove pageX " + canvasX + " pageY " + canvasY);
      this.last_pageX = canvasX;
      this.last_pageY = canvasY;
    };

    NodeCanvas.prototype.handle_mouseup = function (e) {
      if (!this.isMousedown) return;

      var canvas_pagePosition = Utilities.getPagePosition(this.canvas);
      var canvasX = e.pageX - canvas_pagePosition.left;
      var canvasY = e.pageY - canvas_pagePosition.top;

      //if (e.toElement && e.toElement != document.childNodes[0]) return;

      var selectable_endpoint = this.getSelectableEndpointForPoint({
        x: canvasX, y: canvasY
      });
      var did_finalize_connection = false;
      if (selectable_endpoint && this.selected_endpoint && this.selected_endpoint.canConnectTo(selectable_endpoint)) {
        if (this.temporary_connection.to_endpoint == this.temporary_endpoint) {
          this.temporary_connection.setToEndpoint(selectable_endpoint);
        } else if (this.temporary_connection.from_endpoint == this.temporary_endpoint) {
          this.temporary_connection.setFromEndpoint(selectable_endpoint);
        }
        // Inform connected.
        this.temporary_connection.from_endpoint.informConnected(this.temporary_connection);
        this.temporary_connection.to_endpoint.informConnected(this.temporary_connection);
        did_finalize_connection = true;
      }

      //console.log("NodeCanvas mouseup pageX " + canvasX + " pageY " + canvasY);
      this.last_pageX = canvasX;
      this.last_pageY = canvasY;

      if (this.temporary_connection) {
        if (!did_finalize_connection) {
          this.temporary_connection.from_endpoint.informDisconnected(this.temporary_connection);
          this.temporary_connection.to_endpoint.informDisconnected(this.temporary_connection);
          this.connections_map.remove(this.temporary_connection.getDescriptor());
        }
        this.temporary_connection = null;
      }
      this.selected_endpoint = null;
      this.isMousedown = false;
    };

    NodeCanvas.prototype.handle_mousewheel = function (e) {
      var canvas_pagePosition = Utilities.getPagePosition(this.canvas);
      var canvasX = e.pageX - canvas_pagePosition.left;
      var canvasY = e.pageY - canvas_pagePosition.top;

      console.log("NodeCanvas mousewheel " + e.wheelDelta + " pageX " + canvasX + " pageY " + canvasY);
      this.last_pageX = canvasX;
      this.last_pageY = canvasY;
      e.preventDefault();
      e.stopPropagation();
    };

    NodeCanvas.prototype.getSelectableEndpointForPoint = function (point) {
      var closest_endpoint = null;
      var closest_endpoint_dist = null;
      for (var window_ix = 0; window_ix < this.node_windows.length; window_ix++) {
        var cur_window = this.node_windows[window_ix];

        var endpoints = cur_window.input_endpoints.concat(cur_window.output_endpoints);
        for (var i = 0; i < endpoints.length; i++) {
          var cur_endpoint = endpoints[i];
          if (cur_endpoint.isPointWithinBounds(point)) {
            var dist = cur_endpoint.distanceTo(point);
            if (!closest_endpoint || (closest_endpoint && dist < closest_endpoint_dist)) {
              closest_endpoint = cur_endpoint;
              closest_endpoint_dist = dist;
            }
          }
        }
      }
      return closest_endpoint;
    };

    NodeCanvas.prototype.unsetFlagAllEndpoints = function (state_name) {
      for (var window_ix = 0; window_ix < this.node_windows.length; window_ix++) {
        var cur_window = this.node_windows[window_ix];

        var endpoints = cur_window.input_endpoints.concat(cur_window.output_endpoints);
        for (var i = 0; i < endpoints.length; i++) {
          endpoints[i].unsetFlag(state_name);
        }
      }
    };

    // UI drawing.

    NodeCanvas.prototype.draw = function (params) {
      params = (typeof params !== "undefined" ? params : {});
      
      var dimensions = this.window_system.getDimensions();
      this.canvas.width = dimensions.width;
      this.canvas.height = dimensions.height;

      // draw windows (includes endpoints)

      var graph_connections_to_draw = new Utilities.Set();

      for (var window_ix = 0; window_ix < this.node_windows.length; window_ix++) {
        var cur_node_window = this.node_windows[window_ix];
        // Inform node that it should do it's own internal drawing now.
        cur_node_window.draw();
        // Ask node to draw endpoints.
        this.context.save();
          cur_node_window.drawEndpoints(this.canvas);
        this.context.restore();

        var cur_ui_manager = cur_node_window.getNodeUI();

        var input_endpoints = cur_ui_manager.getInputDescriptors();
        for (var input_name in input_endpoints) {
          graph_connections_to_draw.addAll(input_endpoints[input_name].getConnectionDescriptors());
        }

        var output_endpoints = cur_ui_manager.getOutputDescriptors();
        for (var output_name in output_endpoints) {
          graph_connections_to_draw.addAll(output_endpoints[output_name].getConnectionDescriptors());
        }
      }

      // draw connections

      if (this.temporary_connection) {
        graph_connections_to_draw.add(this.temporary_connection.getDescriptor());
      }

      graph_connections_to_draw = graph_connections_to_draw.toArray();

      for (var conn_ix = 0; conn_ix < graph_connections_to_draw.length; conn_ix++) {
        var cur_ui_connection = this.connections_map.get(graph_connections_to_draw[conn_ix]);
        cur_ui_connection.draw(this.canvas);
      }
    };

    return NodeCanvas;
  })();

  WindowSystem.NodeWindow = (function () {
    function NodeWindow (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.window_system = null

      this.node_ui = this.params.node_ui;

      this.draw_callback = this.params.draw_callback || function () {};

      this.element = null;
      this.content_div = null;

      this.x = this.params.x || 0;
      this.y = this.params.y || 0;

      this.width = this.params.width || 100;
      this.min_width = this.params.min_width || 100;
      this.max_width = this.params.max_width || Infinity;
      this.unbounded_width = this.width;

      this.height = this.params.height || 100;
      this.min_height = this.params.min_height || 100;
      this.max_height = this.params.max_height || Infinity;
      this.unbounded_height = this.height;

      // TODO: If use_flex is false, the window can't be resized even if resizable is set.
      this.use_flex = (typeof this.params.use_flex !== "undefined" ? !!this.params.use_flex : true);
      this.resizable = (typeof this.params.resizable !== "undefined" ? !!this.params.resizable : true);

      this.title = this.params.title || "Node";

      this.input_endpoints = this.node_ui.getInputDescriptorsArray().map((function (desc) {
        return new WindowSystem.UIEndpoint({
          descriptor: desc,
          node: this.node
        });
      }).bind(this));

      this.output_endpoints = this.node_ui.getOutputDescriptorsArray().map((function (desc) {
        return new WindowSystem.UIEndpoint({
          descriptor: desc,
          node: this.node
        });
      }).bind(this));

      this.build();
    }

    NodeWindow.prototype.getNodeUI = function () {
      return this.node_ui;
    };

    NodeWindow.prototype.attachWindowSystem = function (window_system) {
      this.window_system = window_system;
    };

    NodeWindow.prototype.getWindowSystem = function () {
      return this.window_system;
    };

    NodeWindow.prototype.setTitle = function (new_title) {
      this.title = new_title;
    };

    NodeWindow.prototype.getInputEndpoints = function () {
      return this.input_endpoints;
    };

    NodeWindow.prototype.getOutputEndpoints = function () {
      return this.output_endpoints;
    };

    NodeWindow.prototype.getEndpoints = function () {
      return this.input_endpoints.concat(this.output_endpoints);
    };

    NodeWindow.prototype.getInputEndpointIndex = function (endpoint) {
      return this.input_endpoints.indexOf(endpoint);
    };

    NodeWindow.prototype.getOutputEndpointIndex = function (endpoint) {
      return this.output_endpoints.indexOf(endpoint);
    };

    NodeWindow.prototype.draw = function () {
      this.draw_callback();
    };

    NodeWindow.prototype.getElement = function () {
      return this.element;
    };

    NodeWindow.prototype.getContentDiv = function () {
      return this.content_div;
    };

    NodeWindow.prototype.setTitle = function (new_title) {
      this.title_menu.setContent(
        document.createTextNode(new_title)
      );
    };

    NodeWindow.prototype.build = function () {
      this.element = document.createElement("div");
        this.element.className = "Synesthesia_WindowSystem_NodeWindow__main";
        if (!this.flex) {
          this.element.style.display = "block";
        }
        this.element.style.left = "" + this.x + "px";
        this.element.style.top = "" + this.y + "px";
        // This must be "click" otherwise it occurs before the
        // handler for any element in the window and the node
        // reordering prevents the click from occurring.
        this.element.addEventListener("click", (function () {
          this.window_system.bringToFront(this);
        }).bind(this), false);

      this.title_menu = new UILibrary.MenuItem({
        content: document.createTextNode(this.title),
        submenu: new UILibrary.Menu({
          items: [
            new UILibrary.MenuItem({
              content: document.createTextNode("Remove"),
              callback: (function () {
                this.window_system.getUI().destroyNodeWindow(this);
              }).bind(this)
            })
          ]
        })
      });

      this.menu = new UILibrary.Menu({
        self_closeable: false,
        type: "bar",
        hover: false,
        items: [
          this.title_menu
        ]
      });
        Utilities.addClass(this.menu.getElement(), "title");
      this.element.appendChild(this.menu.getElement());

      this.content_div = document.createElement("div");
        this.content_div.className = "content";
      this.element.appendChild(this.content_div);

      this._draggable = new UILibrary.Draggable({
        handle: this.menu.getElement(),
        cursor: "-webkit-grabbing",
        callback: this.handle_drag.bind(this)
      });


      if (this.resizable) {
        this.resize_grabber = document.createElement("div");
          this.resize_grabber.className = "resize_grabber";
        this.element.appendChild(this.resize_grabber);

        this._resizeable = new UILibrary.Draggable({
          handle: this.resize_grabber,
          cursor: "nwse-resize",
          callback_mousedown: this.handle_resize_mousedown.bind(this),
          callback_mousemove: this.handle_resize_mousemove.bind(this),
          callback_mouseup: this.handle_resize_mouseup.bind(this)
        });
      }

      // HACK: Work around for Chrome flex-box css width/height reporting bug.
      //var title_style = window.getComputedStyle(this.title_div);
      this.content_div.setAttribute("data-width", this.width);
      this.content_div.setAttribute("data-height", this.height - this.menu.getElement().offsetHeight);

      this.node_ui.informWindowPrepared(this);
    };

    NodeWindow.prototype.destroy = function () {
      // Disconnect UI endpoints.
      var endpoints = this.getEndpoints();
      for (var endpoint_ix = 0; endpoint_ix < endpoints.length; endpoint_ix++) {
        var cur_endpoint = endpoints[endpoint_ix];

        // Concat used to make a copy. Otherwise connections references
        // the actual array containing the connections for the current
        // endpoint which changes after the endpoint has been told it
        // was disconnected from the connection.
        // This should probably be done in getConnections...
        var connections = cur_endpoint.getConnections().concat([]);

        for (var connection_ix = 0; connection_ix < connections.length; connection_ix++) {
          var cur_connection = connections[connection_ix];

          cur_endpoint.informDisconnected(cur_connection);
          cur_connection.getOppositeEndpoint(cur_endpoint).informDisconnected(cur_connection);
        }
      }
    };

    NodeWindow.prototype.handle_drag = function (params) {
      var div_style = window.getComputedStyle(this.element);
      this.x = parseInt(div_style.left) + params.dx;
      this.y = parseInt(div_style.top) + params.dy;

      this.window_system.bringToFront(this);

      this.reflow();

      params.e.preventDefault();
    };

    NodeWindow.prototype.handle_resize_mousedown = function (params) {
      var div_style = window.getComputedStyle(this.element);
      this.unbounded_width = parseInt(div_style.width);
      this.unbounded_height = parseInt(div_style.height);
    };

    NodeWindow.prototype.handle_resize_mousemove = function (params) {
      this.unbounded_width += params.dx;
      this.unbounded_height += params.dy;

      var new_width = this.unbounded_width;
        new_width = Math.max(new_width, this.min_width);
        new_width = Math.min(new_width, this.max_width);
      this.width = new_width;
      var new_height = this.unbounded_height;
        new_height = Math.max(new_height, this.min_height);
        new_height = Math.min(new_height, this.max_height);
      this.height = new_height;

      // HACK: Work around for Chrome flex-box css width/height reporting bug.
      //var title_style = window.getComputedStyle(this.title_div);
      this.content_div.setAttribute("data-width", this.width);
      this.content_div.setAttribute("data-height", this.height - this.menu.getElement().offsetHeight);

      this.reflow();

      params.e.preventDefault();
    };

    NodeWindow.prototype.handle_resize_mouseup = function (params) {
      this.handle_resize_mousedown.apply(this, arguments);
    };

    NodeWindow.prototype.setZIndex = function (index) {
      this.element.style.zIndex = "" + index;
    };

    NodeWindow.prototype.reflow = function () {
      this.element.style.left = "" + this.x + "px";
      this.element.style.top = "" + this.y + "px";
      if (this.use_flex) {
        this.element.style.width = "" + this.width + "px";
        this.element.style.height = "" + this.height + "px";
        this.content_div.setAttribute("data-width", this.width);
        this.content_div.setAttribute("data-height", this.height - this.menu.getElement().offsetHeight);
      } else {
        var container_style = window.getComputedStyle(this.element);
        this.width = parseInt(container_style.getPropertyValue("width"));
        this.height = parseInt(container_style.getPropertyValue("height"));
      }

      this.window_system.draw();
    };

    NodeWindow.prototype.drawEndpoints = function (canvas) {
      // input endpoints
      var last_endpoint_bottom = 0;
      for (var endp_ix = 0; endp_ix < this.input_endpoints.length; endp_ix++) {
        var cur_endpoint = this.input_endpoints[endp_ix];

        var rel_x = -1 * cur_endpoint.width;
        var rel_y = last_endpoint_bottom;

        cur_endpoint.setPosition(this.x + rel_x, this.y + rel_y);
        cur_endpoint.draw(canvas);
        last_endpoint_bottom += cur_endpoint.height;
      }

      // output endpoints
      last_endpoint_bottom = 0;
      for (var endp_ix = 0; endp_ix < this.output_endpoints.length; endp_ix++) {
        var cur_endpoint = this.output_endpoints[endp_ix];

        var rel_x = this.width;
        var rel_y = last_endpoint_bottom;

        cur_endpoint.setPosition(this.x + rel_x, this.y + rel_y);
        cur_endpoint.draw(canvas);
      }
    };

    return NodeWindow;
  })();

  WindowSystem.UIEndpoint = (function () {
    function UIEndpoint (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Utilities.Flaggable.apply(this, arguments);

      this.descriptor = this.params.descriptor;

      this.node = this.params.node;

      this.name = (this.descriptor != undefined ? this.descriptor.getName() : this.params.name);
      this.type = (this.descriptor != undefined ? this.descriptor.getType() : this.params.type);
      this.direction = (this.descriptor != undefined ? this.descriptor.getDirection() : this.params.direction);

      this.x = 0;
      this.y = 0;
      this.width = 20;
      this.height = 20;

      this.connections = [];
    }

    UIEndpoint.prototype = Utilities.extend(
      new Utilities.Flaggable()
    );

    UIEndpoint.ColorMap = {
      initial: "rgba(0, 0, 0, 1)",
      notes: "rgba(128, 192, 128, 1)",
      AudioNode: "rgba(128, 128, 128, 1)",
      AudioParam: "rgba(128, 128, 256, 1)"
    };

    UIEndpoint.prototype.getDescriptor = function () {
      return this.descriptor;
    };

    UIEndpoint.prototype.getConnections = function () {
      return this.connections;
    };

    UIEndpoint.prototype.setPosition = function (x, y) {
      this.x = x;
      this.y = y;
    };

    UIEndpoint.prototype.getPosition = function () {
      return {x: this.x, y: this.y};
    };

    UIEndpoint.prototype.getPointForConnection = function (connection) {
      if (this.hasFlag("selecting")) {
        var connection_ix = this.connections.indexOf(connection);
        if (this.direction == "output") {
          return {
            x: this.x + this.width * (connection_ix + 1) + 10,
            y: this.y + 10
          };
        } else if (this.direction == "input") {
          return {
            x: this.x - this.width * (connection_ix + 1) + 10,
            y: this.y + 10
          };
        }
      } else {
        return {
          x: this.x + 10,
          y: this.y + 10
        }
      }
    };

    UIEndpoint.prototype.getConnectionForPoint = function (point) {
      var connection_ix = null;
      switch (this.direction) {
        case "output":
          connection_ix = Math.floor((point.x - this.x) / this.width - 1);
          break;
        case "input":
          connection_ix = Math.floor((this.x - point.x) / this.width);
          //console.log("INPUT #" + connection_ix);
          break;
      }

      //console.log("found connection " + connection_ix);
      if (connection_ix === null || connection_ix < 0 || connection_ix > (this.connections.length - 1)) {
        return null;
      } else {
        return this.connections[connection_ix];
      }
    };

    UIEndpoint.prototype.isPointWithinBounds = function (point) {
      if (!this.hasFlag("hovering")) {
        return this.distanceTo(point) < 10;
      } else {
        switch (this.direction) {
          case "input":
            return (
              (this.x - this.connections.length * this.width) <= point.x &&
              point.x <= (this.x + this.width) &&
              this.y <= point.y &&
              point.y <= (this.y + this.height)
            );
          case "output":
            return (
              this.x <= point.x &&
              point.x <= (this.x + this.width + this.connections.length * this.width) &&
              this.y <= point.y &&
              point.y <= (this.y + this.height)
            );
        }
      }
    };

    UIEndpoint.prototype.distanceTo = function (point) {
      return Math.sqrt(
        Math.pow(this.x + 10 - point.x, 2) + 
        Math.pow(this.y + 10 - point.y, 2)
      );
    };

    // Connections

    UIEndpoint.prototype.canConnectTo = function (other_endpoint) {
      return this.descriptor.canConnectTo(other_endpoint.getDescriptor());
    };

    UIEndpoint.prototype.informConnected = function (new_connection) {
      this.descriptor.informConnected(
        new_connection.getDescriptor()
      );
      this.connections.push(new_connection);
    };

    UIEndpoint.prototype.informDisconnected = function (rm_connection) {
      if (this.connections.indexOf(rm_connection) != -1) {
        this.descriptor.informDisconnected(
          rm_connection.getDescriptor()
        );
        this.connections.splice(
          this.connections.indexOf(rm_connection),
          1
        );
      }
    };

    // Drawing / positioning.

    UIEndpoint.prototype.draw = function (canvas) {
      var context = canvas.getContext("2d");
      context.save();

      var strokeStyle = UIEndpoint.ColorMap.initial;
      if (UIEndpoint.ColorMap[this.type]) {
        strokeStyle = UIEndpoint.ColorMap[this.type];
      }

      if (this.hasFlag("selecting") && this.connections.length > 0) {
        context.translate(this.x, this.y);

        // far semicircle
        context.beginPath();
        context.arc(
          10 + (this.direction == "output" ? 1 : -1) * (this.width * this.connections.length),
          10,
          5.5,
          (this.direction == "output" ? -1 : 1) * Math.PI / 2,
          (this.direction == "output" ? 1 : -1) * Math.PI / 2
        );
        context.strokeStyle = strokeStyle;
        context.lineWidth = (this.hasFlag("hovering") ? 3 : 2);
        context.stroke();

        // top line
        context.beginPath();
        context.moveTo(
          10 + (this.direction == "output" ? 1 : -1) * (this.width * this.connections.length),
          4.5
        );
        context.lineTo(
          10 * ((this.direction == "output" ? 1 : -1) + (this.direction == "input" ? 2 : 0)),
          4.5
        );
        context.stroke();

        // bottom line
        context.beginPath();
        context.moveTo(
          10 + (this.direction == "output" ? 1 : -1) * (this.width * this.connections.length),
          15.5
        );
        context.lineTo(
          10 * ((this.direction == "output" ? 1 : -1) + (this.direction == "input" ? 2 : 0)),
          15.5
        );
        context.stroke();

        // near semicircle
        context.beginPath();
        context.arc(
          10,
          10,
          5.5,
          (this.direction == "output" ? 1 : -1) * Math.PI / 2,
          (this.direction == "output" ? -1 : 1) * Math.PI / 2
        );
        context.strokeStyle = strokeStyle;
        context.lineWidth = (this.hasFlag("hovering") ? 3 : 2);
        context.stroke();
      } else {
        context.translate(this.x, this.y);
        context.beginPath();
        context.arc(
          10, 10,
          (this.hasFlag("hovering") ? 6 : 5),
          0, 2 * Math.PI
        );
        context.strokeStyle = strokeStyle;
        context.lineWidth = 2;
        context.stroke();
      }

      context.restore();
    };

    return UIEndpoint;
  })();

  WindowSystem.UIConnection = (function () {
    function UIConnection (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.descriptor = this.params.descriptor;

      this.from_endpoint = this.params.from_endpoint;
      this.to_endpoint = this.params.to_endpoint;
    }

    UIConnection.prototype.getDescriptor = function () {
      return this.descriptor;
    };

    UIConnection.prototype.getOppositeEndpoint = function (endpoint) {
      if (endpoint == this.from_endpoint) {
        return this.to_endpoint;
      } else if (endpoint == this.to_endpoint) {
        return this.from_endpoint;
      } else {
        return null;
      }
    };

    UIConnection.prototype.setFromEndpoint = function (from_endpoint) {
      this.from_endpoint = from_endpoint;
      this.descriptor.setFromEndpoint(
        this.from_endpoint.getDescriptor()
      );
    };

    UIConnection.prototype.setToEndpoint = function (to_endpoint) {
      this.to_endpoint = to_endpoint;
      this.descriptor.setToEndpoint(
        this.to_endpoint.getDescriptor()
      );
    };

    UIConnection.prototype.draw = function (canvas) {
      var context = canvas.getContext("2d");
      context.save();
        // Set color (based on from endpoint).
        var color = WindowSystem.UIEndpoint.ColorMap[this.from_endpoint.type];
        if (!color) {
          color = WindowSystem.UIEndpoint.ColorMap[this.to_endpoint.type];
        }
        context.fillStyle = color || "rgba(256, 0, 0, 1)";
        context.strokeStyle = color || "rgba(256, 0, 0, 1)";

        var start_point = this.from_endpoint.getPointForConnection(this);
        var end_point = this.to_endpoint.getPointForConnection(this);

        // Draw from circle.
        context.beginPath();
        context.arc(
          start_point.x,
          start_point.y,
          3,
          0, 2 * Math.PI
        );
        context.fill();

        var control1 = { x: 0, y:0 };
        var control2 = { x: 0, y:0 };
        var control3 = { x: 0, y:0 };
        var control4 = { x: 0, y:0 };
        if (end_point.x - start_point.x > 0) {
          control1 = {
            x: start_point.x + 0.25 * (end_point.x - start_point.x),
            y: start_point.y
          };
          control2 = {
            x: start_point.x + 0.4 * (end_point.x - start_point.x),
            y: start_point.y
          };
          control3 = {
            x: start_point.x + 0.6 * (end_point.x - start_point.x),
            y: end_point.y
          };
          control4 = {
            x: start_point.x + 0.75 * (end_point.x - start_point.x),
            y: end_point.y
          };
        } else {
          control1 = {
            x: start_point.x - 0.25 * (end_point.x - start_point.x),
            y: 0.5 * (end_point.y + start_point.y)
          };
          control2 = {
            x: start_point.x,
            y: 0.5 * (end_point.y + start_point.y)
          };
          control3 = {
            x: end_point.x,
            y: 0.5 * (end_point.y + start_point.y)
          };
          control4 = {
            x: start_point.x + 1.25 * (end_point.x - start_point.x),
            y: 0.5 * (end_point.y + start_point.y)
          };
        }

        context.beginPath();
        context.moveTo(
          start_point.x,
          start_point.y
        );
        context.bezierCurveTo(
          control1.x, control1.y,
          control2.x, control2.y,
          (start_point.x + end_point.x) / 2,
          (start_point.y + end_point.y) / 2
        );
        context.bezierCurveTo(
          control3.x, control3.y,
          control4.x, control4.y,
          end_point.x,
          end_point.y
        );
        context.lineWidth = 2;
        context.stroke();

        // Draw to circle.
        context.beginPath();
        context.arc(
          end_point.x,
          end_point.y,
          3,
          0, 2 * Math.PI
        );
        context.fill();
      context.restore();
    };

    return UIConnection;
  })();

  return WindowSystem;
});
