module("Synesthesia.UI",
["Utilities", "Synesthesia", "Synesthesia.Graph"],
function () {

  var Utilities = require("Utilities");

  var Synesthesia = require("Synesthesia");

  Synesthesia.UI = (function () {
    function UI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.running = false;

      this.nodes = [];

      this.node_canvas = new Synesthesia.UI.NodeCanvas({
        canvas: this.params.node_canvas
      });

      this.node_div = this.params.node_div;
      this.node_div.className = "Synesthesia_UI__node_window_container";
    }

    UI.prototype.addNode = function (new_node, params) {
      var params = (typeof params !== "undefined" ? params : {});

      new_node.getWindow().attachUI(this);
      this.addNodeWindow(new_node.getWindow(), params);
      this.node_canvas.addNodeWindow(new_node.getWindow());
    };

    UI.prototype.addNodeWindow = function (node_window, params) {
      var div = document.createElement("div");
      this.node_div.appendChild(div);
      node_window.setContainer(div);
        
      this.nodes.push(node_window);

      for (var prop_name in params) {
        if (!params.hasOwnProperty(prop_name)) continue;
        node_window[prop_name] = params[prop_name];
      }
      node_window.reflow();
    };

    UI.prototype.bringToFront = function (node) {
      var index = this.nodes.indexOf(node);
      this.nodes.push(
        this.nodes.splice(index, 1)[0]
      );
    };

    UI.prototype.start = function () {
      this.running = true;
      this.step();
    };

    UI.prototype.step = function () {
      this.draw();
      if (this.running) {
        Synesthesia.requestAnimationFrame(this.step.bind(this), this.canvas);
      }
    };

    UI.prototype.stop = function () {
      this.running = false;
    };

    UI.prototype.draw = function () {
      for (var node_ix = 0; node_ix < this.nodes.length; node_ix++) {
        this.nodes[node_ix].setZIndex(node_ix);
      }
      this.node_canvas.draw();
    };

    return UI;
  })();

  Synesthesia.UI.Draggable = (function () {
    function Draggable (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.handle = this.params.handle;
      this.callback = this.params.callback;

      this.init();
    }

    Draggable.prototype.init = function () {
      this.handle.addEventListener("mousedown", this.handle_mousedown.bind(this), false);
      window.addEventListener("mousemove", this.handle_mousemove.bind(this), false);
      window.addEventListener("mouseup", this.handle_mouseup.bind(this), false);
    };

    Draggable.prototype.handle_mousedown = function (e) {
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;

      this.isMousedown = true;
    };

    Draggable.prototype.handle_mousemove = function (e) {
      if (!this.isMousedown) return;

      this.callback({
        event: e,
        dx: e.pageX - this.last_pageX,
        dy: e.pageY - this.last_pageY
      });

      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;
    };
    
    Draggable.prototype.handle_mouseup = function (e) {
      if (!this.isMousedown) return;

      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;

      this.isMousedown = false;

      e.stopPropagation();
    };
    
    return Draggable;
  })();

  Synesthesia.UI.NodeWindow = (function () {
    function NodeWindow (params) {
      if (!params) return; // INTERFACE

      this.params = (typeof params !== "undefined" ? params : {});

      this.UI = null

      this.node = params.node;

      this.x = this.params.x || 0;
      this.y = this.params.y || 0;

      this.width = this.params.width || 200;
      this.height = this.params.height || 150;

      this.title = this.params.title || "Node";

      this.input_endpoints = this.node.getInputDescriptors().map((function (desc) {
        return new Synesthesia.UI.Endpoint({
          descriptor: desc,
          node: this.node
        });
      }).bind(this));

      this.output_endpoints = this.node.getOutputDescriptors().map((function (desc) {
        return new Synesthesia.UI.Endpoint({
          descriptor: desc,
          node: this.node
        });
      }).bind(this));
    }

    NodeWindow.prototype.getNode = function () {
      return this.node;
    };

    NodeWindow.prototype.attachUI = function (UI) {
      this.UI = UI;
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
      this.node.draw();
    };

    NodeWindow.prototype.setContainer = function (div) {
      this._container = div;
        this._container.className = "Synesthesia_UI_NodeWindow__main";
        this._container.style.left = "" + this.x + "px";
        this._container.style.top = "" + this.y + "px";
        this._container.addEventListener("mousedown", (function () {
          this.UI.bringToFront(this);
        }).bind(this), false);

      this.title_div = document.createElement("div");
        this.title_div.className = "title";
        this.title_div.innerHTML = this.title;
      this._container.appendChild(this.title_div);

      this.div = document.createElement("div");
      this._container.appendChild(this.div);

      this.resize_grabber = document.createElement("div");
        this.resize_grabber.className = "resize_grabber";
      this._container.appendChild(this.resize_grabber);

      this._draggable = new Synesthesia.UI.Draggable({
        handle: this.title_div,
        callback: this.handle_drag.bind(this)
      });

      this._resizeable = new Synesthesia.UI.Draggable({
        handle: this.resize_grabber,
        callback: this.handle_resize.bind(this)
      });

      this.node.informWindowPrepared(this.div);
    };

    NodeWindow.prototype.handle_drag = function (params) {
      var div_style = window.getComputedStyle(this._container);
      this.x = parseInt(div_style.left) + params.dx;
      this.y = parseInt(div_style.top) + params.dy;

      this.UI.bringToFront(this);

      this.reflow();

      params.event.preventDefault();
    };

    NodeWindow.prototype.handle_resize = function (params) {
      var div_style = window.getComputedStyle(this._container);
      this.width = Math.max(parseInt(div_style.width) + params.dx, 100);
      this.height = Math.max(parseInt(div_style.height) + params.dy, 100);

      this.reflow();

      params.event.preventDefault();
    };

    NodeWindow.prototype.setZIndex = function (index) {
      this._container.style.zIndex = "" + index;
    };

    NodeWindow.prototype.reflow = function () {
      this._container.style.left = "" + this.x + "px";
      this._container.style.top = "" + this.y + "px";
      this._container.style.width = "" + this.width + "px";
      this._container.style.height = "" + this.height + "px";
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

  Synesthesia.UI.Endpoint = (function () {
    function Endpoint (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.descriptor = this.params.descriptor;

      this.node = this.params.node;

      this.name = (this.descriptor != undefined ? this.descriptor.getName() : this.params.name);
      this.type = (this.descriptor != undefined ? this.descriptor.getType() : this.params.type);
      this.direction = (this.descriptor != undefined ? this.descriptor.getDirection() : this.params.direction);

      this.x = 0;
      this.y = 0;
      this.width = 20;
      this.height = 20;

      this.states = [];

      this.connections = [];
    }

    Endpoint.ColorMap = {
      initial: "rgba(0, 0, 0, 1)",
      AudioNode: "rgba(128, 128, 128, 1)",
      notes: "rgba(256, 128, 128, 1)",
      envelope: "rgba(128, 128, 256, 1)"
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
      if (this.hasState("selecting")) {
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
      if (!this.hasState("hovering")) {
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

    Endpoint.prototype.addState = function (new_state) {
      this.states.push(new_state);
    };

    Endpoint.prototype.hasState = function (check_state) {
      return (this.states.indexOf(check_state) != -1);
    };

    Endpoint.prototype.removeState = function (rm_state) {
      while (this.states.indexOf(rm_state) != -1) {
        this.states.splice(this.states.indexOf(rm_state), 1);
      }
    };

    // Connections

    Endpoint.prototype.canConnectTo = function (other_endpoint) {
      return this.descriptor.canConnectTo(other_endpoint.descriptor);
    };

    Endpoint.prototype.informConnected = function (new_connection) {
      this.descriptor.informConnected(
        new_connection.getDescriptor()
      );
      this.connections.push(new_connection);
    };

    Endpoint.prototype.informDisconnected = function (rm_connection) {
      if (this.connections.indexOf(rm_connection) != -1) {
        // TODO: COMPLETE AFTER FINISHING GRAPH.CONNECTION
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

      var strokeStyle = Endpoint.ColorMap.initial;
      if (Endpoint.ColorMap[this.type]) {
        strokeStyle = Endpoint.ColorMap[this.type];
      }

      if (this.hasState("selecting") && this.connections.length > 0) {
        context.save();
          context.translate(this.x, this.y);

          // far semicircle
          context.beginPath();
          context.arc(
            10 + (this.direction == "output" ? 1 : -1) * (this.width * this.connections.length),
            10,
            5,
            (this.direction == "output" ? -1 : 1) * Math.PI / 2,
            (this.direction == "output" ? 1 : -1) * Math.PI / 2
          );
          context.strokeStyle = strokeStyle;
          context.lineWidth = (this.hasState("hovering") ? 3 : 2);
          context.stroke();

          // top line
          context.beginPath();
          context.moveTo(
            10 + (this.direction == "output" ? 1 : -1) * (this.width * this.connections.length),
            5
          );
          context.lineTo(
            10 * ((this.direction == "output" ? 1 : -1) + (this.direction == "input" ? 2 : 0)),
            5
          );
          context.stroke();

          // bottom line
          context.beginPath();
          context.moveTo(
            10 + (this.direction == "output" ? 1 : -1) * (this.width * this.connections.length),
            15
          );
          context.lineTo(
            10 * ((this.direction == "output" ? 1 : -1) + (this.direction == "input" ? 2 : 0)),
            15
          );
          context.stroke();

          // near semicircle
          context.beginPath();
          context.arc(
            10,
            10,
            5,
            (this.direction == "output" ? 1 : -1) * Math.PI / 2,
            (this.direction == "output" ? -1 : 1) * Math.PI / 2
          );
          context.strokeStyle = strokeStyle;
          context.lineWidth = (this.hasState("hovering") ? 3 : 2);
          context.stroke();

        context.restore();
      } else {
        context.save();
          context.translate(this.x, this.y);
          context.beginPath();
          context.arc(
            10, 10,
            5,
            0, 2 * Math.PI
          );
          context.strokeStyle = strokeStyle;
          context.lineWidth = (this.hasState("hovering") ? 3 : 2);
          context.stroke();
        context.restore();
      }
    };

    return Endpoint;
  })();

  Synesthesia.UI.Connection = (function () {
    function Connection (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.descriptor = this.params.descriptor;

      this.from_endpoint = this.params.from_endpoint;
      this.to_endpoint = this.params.to_endpoint;
      
      /*
      console.log("UI.Connection created:");
      console.log(this.from_endpoint);
      console.log(this.to_endpoint);
      */
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
        var color = Synesthesia.UI.Endpoint.ColorMap[this.from_endpoint.type];
        if (!color) {
          color = Synesthesia.UI.Endpoint.ColorMap[this.to_endpoint.type];
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
            x: start_point.x - 0.5 * (end_point.x - start_point.x),
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
            x: start_point.x + 1.5 * (end_point.x - start_point.x),
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
        context.lineWidth = 1;
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

  Synesthesia.UI.NodeCanvas = (function () {
    function NodeCanvas (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.canvas = this.params.canvas;
      this.canvas.className = "Synesthesia_UI_NodeCanvas__canvas";
      this.context = this.canvas.getContext("2d");

      this.node_windows = [];
      this.connections = [];

      this.selected_endpoint = null;
      this.temporary_connection = null;
      this.temporary_endpoint = null;

      this.init();
    }

    NodeCanvas.prototype.init = function () {
      window.addEventListener("resize", this.handle_resize.bind(this), false);
      
      this.canvas.addEventListener("mousedown", this.handle_mousedown.bind(this), false);
      window.addEventListener("mousemove", this.handle_mousemove.bind(this), false);
      window.addEventListener("mouseup", this.handle_mouseup.bind(this), false);
      window.addEventListener("mouseout", this.handle_mouseup.bind(this), false);

      this.canvas.addEventListener("mousewheel", this.handle_mousewheel.bind(this), false);

      this.handle_resize();
    };

    NodeCanvas.prototype.addNodeWindow = function (new_node_window) {
      this.node_windows.push(new_node_window);
    };

    // Event handlers.

    NodeCanvas.prototype.handle_resize = function () {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      this.draw();
    };

    NodeCanvas.prototype.handle_mousedown = function (e) {
      //console.log("NodeCanvas mousedown pageX " + e.pageX + " pageY " + e.pageY);
      var selectable_endpoint = this.getSelectableEndpointForPoint({
        x: e.pageX, y: e.pageY
      });
      if (selectable_endpoint) {
        this.selected_endpoint = selectable_endpoint;

        var edit_connection = this.selected_endpoint.getConnectionForPoint({
          x: e.pageX, y: e.pageY
        });
        /*
        console.log("edit connection:");
        console.log(edit_connection);
        */
        if (edit_connection) { // are we attempting to edit a connection?
          //console.log("edit input");

          this.temporary_connection = edit_connection;
          edit_connection.from_endpoint.informDisconnected(edit_connection);
          edit_connection.to_endpoint.informDisconnected(edit_connection);
          if (selectable_endpoint.direction == "input") {
            this.temporary_endpoint = new Synesthesia.UI.Endpoint({
              type: null,
              direction: "input"
            });
            this.temporary_endpoint.setPosition(e.pageX - 10, e.pageY - 10);
            this.selected_endpoint = edit_connection.from_endpoint;
            edit_connection.setToEndpoint(this.temporary_endpoint);
          } else if (this.selected_endpoint.direction == "output") {
            this.temporary_endpoint = new Synesthesia.UI.Endpoint({
              type: null,
              direction: "output"
            });
            this.temporary_endpoint.setPosition(e.pageX - 10, e.pageY - 10);
            this.selected_endpoint = edit_connection.to_endpoint;
            edit_connection.setFromEndpoint(this.temporary_endpoint);
          }
        } else {
          // Correct direction.
          if (this.selected_endpoint.direction == "input") {
            this.temporary_endpoint = new Synesthesia.UI.Endpoint({
              type: null,
              direction: "output"
            });
            this.temporary_endpoint.setPosition(e.pageX - 10, e.pageY - 10);
            this.temporary_connection = new Synesthesia.UI.Connection({
              from_endpoint: this.temporary_endpoint,
              to_endpoint: this.selected_endpoint,
              descriptor: new Synesthesia.Graph.Connection({
                from_endpoint: this.temporary_endpoint.getDescriptor(),
                to_endpoint: this.selected_endpoint.getDescriptor()
              })
            });
          } else if (this.selected_endpoint.direction == "output") {
            this.temporary_endpoint = new Synesthesia.UI.Endpoint({
              type: null,
              direction: "input"
            });
            this.temporary_endpoint.setPosition(e.pageX - 10, e.pageY - 10);
            this.temporary_connection = new Synesthesia.UI.Connection({
              from_endpoint: this.selected_endpoint,
              to_endpoint: this.temporary_endpoint,
              descriptor: new Synesthesia.Graph.Connection({
                from_endpoint: this.selected_endpoint.getDescriptor(),
                to_endpoint: this.temporary_endpoint.getDescriptor()
              })
            });
          }
          this.connections.push(this.temporary_connection);
        }
      }

      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;

      this.isMousedown = true;
    };

    NodeCanvas.prototype.handle_mousemove = function (e) {
      var selectable_endpoint = this.getSelectableEndpointForPoint({
        x: e.pageX, y: e.pageY
      });
      this.removeStateAllEndpoints("hovering");
      this.removeStateAllEndpoints("selecting");
      if (selectable_endpoint) {
        if (this.selected_endpoint && this.selected_endpoint.canConnectTo(selectable_endpoint)) {
          selectable_endpoint.addState("hovering");
          selectable_endpoint.addState("selecting");
        } else if (!this.selected_endpoint) {
          selectable_endpoint.addState("hovering");
          selectable_endpoint.addState("selecting");
        }
      }

      if (this.temporary_endpoint) {
        this.temporary_endpoint.setPosition(e.pageX - 10, e.pageY - 10);
      }

      if (!this.isMousedown) return;

      //console.log("NodeCanvas mousemove pageX " + e.pageX + " pageY " + e.pageY);
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;
    };

    NodeCanvas.prototype.handle_mouseup = function (e) {
      if (!this.isMousedown) return;

      var selectable_endpoint = this.getSelectableEndpointForPoint({
        x: e.pageX, y: e.pageY
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
        //console.log(this.temporary_connection);
        did_finalize_connection = true;
      }

      //console.log("NodeCanvas mouseup pageX " + e.pageX + " pageY " + e.pageY);
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;

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
      console.log("NodeCanvas mousewheel " + e.wheelDelta + " pageX " + e.pageX + " pageY " + e.pageY);
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;
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

    NodeCanvas.prototype.removeStateAllEndpoints = function (state_name) {
      for (var window_ix = 0; window_ix < this.node_windows.length; window_ix++) {
        var cur_window = this.node_windows[window_ix];

        var endpoints = cur_window.input_endpoints.concat(cur_window.output_endpoints);
        for (var i = 0; i < endpoints.length; i++) {
          endpoints[i].removeState(state_name);
        }
      }
    };

    // UI drawing.

    NodeCanvas.prototype.draw = function (params) {
      params = (typeof params !== "undefined" ? params : {});
      
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

});
