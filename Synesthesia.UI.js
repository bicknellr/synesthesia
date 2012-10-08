module("Synesthesia.UI",
["Utilities", "Synesthesia", "Synesthesia.AudioNode"],
function () {

  var Utilities = require("Utilities");

  var Synesthesia = require("Synesthesia");

  Synesthesia.UI = (function () {
    function UI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.running = false;

      this.nodes = [];
      this.endpoints = [];
      this.connections = [];

      this.node_canvas = new Synesthesia.UI.NodeCanvas({
        canvas: this.params.node_canvas
      });
      this.node_canvas.setDrawables({
        nodes: this.nodes,
        endpoints: this.endpoints,
        connections: this.connections
      });

      this.node_div = this.params.node_div;
      this.node_div.className = "Synesthesia_UI__node_window_container";
    }

    UI.prototype.addNode = function (new_node, params) {
      var params = (typeof params !== "undefined" ? params : {});

      new_node.getWindow().attachUI(this);
      this.addNodeWindow(new_node.getWindow(), params);
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
          parent_window: this,
          node: this.node,
          name: desc.name,
          type: desc.type
        });
      }).bind(this));

      this.output_endpoints = this.node.getOutputDescriptors().map((function (desc) {
        return new Synesthesia.UI.Endpoint({
          parent_window: this,
          node: this.node,
          name: desc.name,
          type: desc.type
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

    NodeWindow.prototype.draw = function () {
      this.title_div.innerHTML = this.title;
      this.node.draw();
      //throw new Error("Synesthesia.UI.Drawable(.draw): Not implemented.");
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

      //throw new Error("Synesthesia.UI.NodeWindow(.attachDiv): Not implemented.");

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
      for (var endp_ix = 0; endp_ix < this.input_endpoints.length; endp_ix++) {
        var cur_endpoint = this.input_endpoints[endp_ix];
        cur_endpoint.drawWithParams(canvas, {
          x: this.x - 10,
          y: this.y + 10 + 20 * endp_ix
        });
      }

      // output endpoints
      for (var endp_ix = 0; endp_ix < this.output_endpoints.length; endp_ix++) {
        var cur_endpoint = this.output_endpoints[endp_ix];
        cur_endpoint.drawWithParams(canvas, {
          x: this.x + this.width + 10,
          y: this.y + 10 + 20 * endp_ix
        });
      }
    };

    return NodeWindow;
  })();

  Synesthesia.UI.Endpoint = (function () {
    function Endpoint (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.node = params.node;
      this.name = params.name;
    }

    Endpoint.prototype.drawWithParams = function (canvas, params) {
      var context = canvas.getContext("2d");
      context.save();
        context.beginPath();
        context.arc(
          params.x, params.y,
          5,
          0, 2 * Math.PI
        );
        context.strokeStyle = "rgba(0, 0, 0, 1)";
        context.lineWidth = 2;
        context.stroke();
      context.restore();
    };

    return Endpoint;
  })();

  Synesthesia.UI.NodeCanvas = (function () {
    function NodeCanvas (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.canvas = this.params.canvas;
      this.canvas.className = "Synesthesia_UI_NodeCanvas__canvas";
      this.context = this.canvas.getContext("2d");

      this.node_map = null;

      this.drawables = {};

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

    NodeCanvas.prototype.setDrawables = function (new_drawables) {
      this.drawables = new_drawables;
    };

    // Event handlers.

    NodeCanvas.prototype.handle_resize = function () {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      this.draw();
    };

    NodeCanvas.prototype.handle_mousedown = function (e) {
      console.log("NodeCanvas mousedown pageX " + e.pageX + " pageY " + e.pageY);
      this.isMousedown = true;
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;
    };

    NodeCanvas.prototype.handle_mousemove = function (e) {
      if (!this.isMousedown) return;

      console.log("NodeCanvas mousemove pageX " + e.pageX + " pageY " + e.pageY);
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;
    };

    NodeCanvas.prototype.handle_mouseup = function (e) {
      if (!this.isMousedown) return;

      console.log("NodeCanvas mouseup pageX " + e.pageX + " pageY " + e.pageY);
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;

      this.isMousedown = false;
    };

    NodeCanvas.prototype.handle_mousewheel = function (e) {
      console.log("NodeCanvas mousewheel " + e.wheelDelta + " pageX " + e.pageX + " pageY " + e.pageY);
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;
      e.preventDefault();
      e.stopPropagation();
    };

    // UI drawing.

    NodeCanvas.prototype.draw = function (params) {
      params = (typeof params !== "undefined" ? params : {});
      
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      var drawNode = (function (cur_node) {
        cur_node.setZIndex(node_ix);
        // Inform node that it should do it's own internal drawing now.
        cur_node.draw();
        // Ask node to draw endpoints.
        this.context.save();
          cur_node.drawEndpoints(this.canvas);
        this.context.restore();
      }).bind(this);

      if (this.drawables.nodes) {
        for (var node_ix = 0; node_ix < this.drawables.nodes.length; node_ix++) {
          var cur_node = this.drawables.nodes[node_ix];
          drawNode(cur_node);
        }
      }
    };

    return NodeCanvas;
  })();

});
