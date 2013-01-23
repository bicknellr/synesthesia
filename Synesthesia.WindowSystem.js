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

      this.container = document.createElement("div");
        Utilities.addClass(this.container, "Synesthesia_WindowSystem");

      this.nodes = [];

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
        
      this.nodes.push(node_window);

      for (var prop_name in params) {
        if (!params.hasOwnProperty(prop_name)) continue;
        node_window[prop_name] = params[prop_name];
      }
      node_window.reflow();
      this.node_canvas.addNodeWindow(node_window);
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
      this.connections = [];

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
            this.temporary_endpoint = new WindowSystem.Endpoint({
              type: null,
              direction: "input"
            });
            this.temporary_endpoint.setPosition(canvasX - 10, canvasY - 10);
            this.selected_endpoint = edit_connection.from_endpoint;
            edit_connection.setToEndpoint(this.temporary_endpoint);
          } else if (this.selected_endpoint.direction == "output") {
            this.temporary_endpoint = new WindowSystem.Endpoint({
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
            this.temporary_endpoint = new WindowSystem.Endpoint({
              type: null,
              direction: "output"
            });
            this.temporary_endpoint.setPosition(canvasX - 10, canvasY - 10);
            this.temporary_connection = new WindowSystem.Connection({
              from_endpoint: this.temporary_endpoint,
              to_endpoint: this.selected_endpoint,
              descriptor: new Graph.Connection({
                from_endpoint: this.temporary_endpoint.getDescriptor(),
                to_endpoint: this.selected_endpoint.getDescriptor()
              })
            });
          } else if (this.selected_endpoint.direction == "output") {
            this.temporary_endpoint = new WindowSystem.Endpoint({
              type: null,
              direction: "input"
            });
            this.temporary_endpoint.setPosition(canvasX - 10, canvasY - 10);
            this.temporary_connection = new WindowSystem.Connection({
              from_endpoint: this.selected_endpoint,
              to_endpoint: this.temporary_endpoint,
              descriptor: new Graph.Connection({
                from_endpoint: this.selected_endpoint.getDescriptor(),
                to_endpoint: this.temporary_endpoint.getDescriptor()
              })
            });
          }
          this.connections.push(this.temporary_connection);
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
          this.connections.splice(
            this.connections.indexOf(this.temporary_connection),
            1
          );
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

      for (var window_ix = 0; window_ix < this.node_windows.length; window_ix++) {
        var cur_node_window = this.node_windows[window_ix];
        // Inform node that it should do it's own internal drawing now.
        cur_node_window.draw();
        // Ask node to draw endpoints.
        this.context.save();
          cur_node_window.drawEndpoints(this.canvas);
        this.context.restore();
      }

      // draw connections

      for (var conn_ix = 0; conn_ix < this.connections.length; conn_ix++) {
        var cur_connection = this.connections[conn_ix];
        cur_connection.draw(this.canvas);
      }
    };

    return NodeCanvas;
  })();

  WindowSystem.NodeWindow = (function () {
    function NodeWindow (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.window_system = null

      this.node = this.params.node;

      this.draw_callback = this.params.draw_callback || function () {};

      this.element = null;

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

      this.input_endpoints = this.node.getInputDescriptorsArray().map((function (desc) {
        return new WindowSystem.Endpoint({
          descriptor: desc,
          node: this.node
        });
      }).bind(this));

      this.output_endpoints = this.node.getOutputDescriptorsArray().map((function (desc) {
        return new WindowSystem.Endpoint({
          descriptor: desc,
          node: this.node
        });
      }).bind(this));

      this.build();
    }

    NodeWindow.prototype.getNode = function () {
      return this.node;
    };

    NodeWindow.prototype.attachWindowSystem = function (window_system) {
      this.window_system = window_system;
    };

    NodeWindow.prototype.setTitle = function (new_title) {
      this.title = new_title;
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
      this.title_div.innerHTML = this.title;
      this.draw_callback();
    };

    NodeWindow.prototype.getElement = function () {
      return this.element;
    };

    NodeWindow.prototype.build = function () {
      this.element = document.createElement("div");
        this.element.className = "Synesthesia_WindowSystem_NodeWindow__main";
        if (!this.use_flex) {
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

      this.title_div = document.createElement("div");
        this.title_div.className = "title";
        this.title_div.innerHTML = this.title;
      this.element.appendChild(this.title_div);

      this.div = document.createElement("div");
        this.div.className = "content";
      this.element.appendChild(this.div);

      this._draggable = new UILibrary.Draggable({
        handle: this.title_div,
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
      this.div.setAttribute("data-width", this.width);
      this.div.setAttribute("data-height", this.height - this.title_div.offsetHeight);

      this.node.informWindowPrepared(this.div);

      this.node.draw();
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
      this.div.setAttribute("data-width", this.width);
      this.div.setAttribute("data-height", this.height - this.title_div.offsetHeight);

      this.reflow();

      this.node.draw();

      params.e.preventDefault();
    };

    NodeWindow.prototype.handle_resize_mouseup = function (params) {
      this.handle_resize_mousedown.apply(this, arguments);

      this.node.draw();
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
        this.div.setAttribute("data-width", this.width);
        this.div.setAttribute("data-height", this.height - this.title_div.offsetHeight);
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
        last_endpoint_bottom += cur_endpoint.height;
      }
    };

    return NodeWindow;
  })();

  WindowSystem.Endpoint = (function () {
    function Endpoint (params) {
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

    Endpoint.prototype = Utilities.extend(
      new Utilities.Flaggable()
    );

    Endpoint.ColorMap = {
      initial: "rgba(0, 0, 0, 1)",
      "Number": "rgba(192, 32, 32, 1)",
      notes: "rgba(128, 192, 128, 1)",
      AudioNode: "rgba(128, 128, 128, 1)",
      AudioParam: "rgba(128, 128, 255, 1)",
      Envelope: "rgba(128, 0, 192, 1)",
      Trigger: "rgba(192, 64, 64, 1)"
    };

    Endpoint.prototype.getDescriptor = function () {
      return this.descriptor;
    };

    Endpoint.prototype.setPosition = function (x, y) {
      this.x = x;
      this.y = y;
    };

    Endpoint.prototype.getPosition = function () {
      return {x: this.x, y: this.y};
    };

    Endpoint.prototype.getPointForConnection = function (connection) {
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

    Endpoint.prototype.getConnectionForPoint = function (point) {
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

    Endpoint.prototype.isPointWithinBounds = function (point) {
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

    Endpoint.prototype.distanceTo = function (point) {
      return Math.sqrt(
        Math.pow(this.x + 10 - point.x, 2) + 
        Math.pow(this.y + 10 - point.y, 2)
      );
    };

    // Connections

    Endpoint.prototype.canConnectTo = function (other_endpoint) {
      return this.descriptor.canConnectTo(other_endpoint.getDescriptor());
    };

    Endpoint.prototype.informConnected = function (new_connection) {
      this.descriptor.informConnected(
        new_connection.getDescriptor()
      );
      this.connections.push(new_connection);
    };

    Endpoint.prototype.informDisconnected = function (rm_connection) {
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

    Endpoint.prototype.draw = function (canvas) {
      var context = canvas.getContext("2d");
      context.save();

      var descriptor = this.getDescriptor();

      var strokeStyle = Endpoint.ColorMap.initial;
      if (Endpoint.ColorMap[this.type]) {
        strokeStyle = Endpoint.ColorMap[this.type];
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
        if (descriptor.getFlow()) {
          if (
            (descriptor.getFlow() == "passive" && descriptor.getDirection() == "input") || 
            (descriptor.getFlow() == "active" && descriptor.getDirection() == "output")
          ) {
            context.translate(this.x, this.y);
            context.beginPath();
              // Dot
              context.beginPath();
                context.arc(
                  10.5 + 7 * Math.cos(Math.PI),
                  10 + 7 * Math.sin(Math.PI),
                  (this.hasFlag("hovering") ? 2 : 1.5),
                  0,
                  2 * Math.PI
                );
              context.fillStyle = strokeStyle;
              context.fill();

              // Arrow
              context.beginPath();
                context.moveTo(
                  10 + 7 * Math.cos(-Math.PI / 2),
                  10 + 7 * Math.sin(-Math.PI / 2)
                );
                context.lineTo(
                  10 + 7 * Math.cos(0),
                  10 + 7 * Math.sin(0)
                );
                context.lineTo(
                  10 + 7 * Math.cos(Math.PI / 2),
                  10 + 7 * Math.sin(Math.PI / 2)
                );
              context.strokeStyle = strokeStyle;
              context.lineWidth = (this.hasFlag("hovering") ? 3 : 2);
              context.stroke();
            context.strokeStyle = strokeStyle;
            context.lineJoin = "round";
            context.lineCap = "round";
            context.lineWidth = 2;
            context.stroke();
          } else {
            context.translate(this.x, this.y);
            context.beginPath();
              // Dot
              context.beginPath();
                context.arc(
                  9.5 + 7 * Math.cos(0),
                  10 + 7 * Math.sin(0),
                  (this.hasFlag("hovering") ? 2 : 1.5),
                  0,
                  2 * Math.PI
                );
              context.fillStyle = strokeStyle;
              context.fill();

              // Arrow
              context.beginPath();
                context.moveTo(
                  10 + 7 * Math.cos(-Math.PI / 2),
                  10 + 7 * Math.sin(-Math.PI / 2)
                );
                context.lineTo(
                  10 + 7 * Math.cos(Math.PI),
                  10 + 7 * Math.sin(Math.PI)
                );
                context.lineTo(
                  10 + 7 * Math.cos(Math.PI / 2),
                  10 + 7 * Math.sin(Math.PI / 2)
                );
              context.strokeStyle = strokeStyle;
              context.lineWidth = (this.hasFlag("hovering") ? 3 : 2);
              context.stroke();
            context.strokeStyle = strokeStyle;
            context.lineJoin = "round";
            context.lineCap = "round";
            context.lineWidth = 2;
            context.stroke();
          }
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
      }

      context.restore();
    };

    return Endpoint;
  })();

  WindowSystem.Connection = (function () {
    function Connection (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.descriptor = this.params.descriptor;

      this.from_endpoint = this.params.from_endpoint;
      this.to_endpoint = this.params.to_endpoint;
    }

    Connection.prototype.getDescriptor = function () {
      return this.descriptor;
    };

    Connection.prototype.getOppositeEndpoint = function (endpoint) {
      if (endpoint == this.from_endpoint) {
        return this.to_endpoint;
      } else if (endpoint == this.to_endpoint) {
        return this.from_endpoint;
      } else {
        return null;
      }
    };

    Connection.prototype.setFromEndpoint = function (from_endpoint) {
      this.from_endpoint = from_endpoint;
      this.descriptor.setFromEndpoint(
        this.from_endpoint.getDescriptor()
      );
    };

    Connection.prototype.setToEndpoint = function (to_endpoint) {
      this.to_endpoint = to_endpoint;
      this.descriptor.setToEndpoint(
        this.to_endpoint.getDescriptor()
      );
    };

    Connection.prototype.draw = function (canvas) {
      var context = canvas.getContext("2d");
      context.save();
        // Set color (based on from endpoint).
        var color = WindowSystem.Endpoint.ColorMap[this.from_endpoint.type];
        if (!color) {
          color = WindowSystem.Endpoint.ColorMap[this.to_endpoint.type];
        }
        context.fillStyle = color || "rgba(255, 0, 0, 1)";
        context.strokeStyle = color || "rgba(255, 0, 0, 1)";

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
            x: start_point.x + 0.5 * (end_point.x - start_point.x),
            y: start_point.y
          };
          control3 = {
            x: start_point.x + 0.5 * (end_point.x - start_point.x),
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

    return Connection;
  })();

  return WindowSystem;
});
