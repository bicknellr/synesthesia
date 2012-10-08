module("Synesthesia.UI",
["Utilities", "Synesthesia", "Synesthesia.AudioNode"],
function () {

  var Utilities = require("Utilities");

  var Synesthesia = require("Synesthesia");

  Synesthesia.UI = (function () {
    function UI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.running = false;

      this.node_ordering = [];
      this.nodes = new Utilities.Map();

      this.node_canvas = new Synesthesia.UI.NodeCanvas({
        canvas: this.params.node_canvas
      });
      this.node_canvas.useMap(this.nodes);

      this.node_div = this.params.node_div;
      this.node_div.className = "Synesthesia_UI__node_div";
    }

    UI.prototype.addNode = function (new_node, params) {
      var params = (typeof params !== "undefined" ? params : {});

      new_node.attachUI(this);

      var node_canvas = document.createElement("canvas");
        node_canvas.width = params.width;
        node_canvas.height = params.height;

      var div = document.createElement("div");
      this.node_div.appendChild(div);
      new_node.setContainer(div);
        
      var node_props = {
        canvas: node_canvas,
        node_div: this.node_div
      };
      this.node_ordering.push(new_node);
      this.nodes.set(new_node, node_props);

      new_node.reflow();
    };

    UI.prototype.bringToFront = function (node) {
      var index = this.node_ordering.indexOf(node);
      this.node_ordering.push(
        this.node_ordering.splice(index, 1)[0]
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
      this.node_canvas.draw({
        with_ordering: this.node_ordering
      });
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

  Synesthesia.UI.Node = (function () {
    function Node (params) {
      if (!params) return; // INTERFACE

      this.params = (typeof params !== "undefined" ? params : {});

      this.UI = null

      this.x = this.params.x || 0;
      this.y = this.params.y || 0;

      this.width = this.params.width || 200;
      this.height = this.params.height || 150;

      this.title = "Node";
    }

    Node.prototype.getInputDescriptors = function () {
      throw new Error("Synesthesia.UI.Node(.getInputDescriptors): Not implemented.");
    };

    Node.prototype.getOutputDescriptors = function () {
      throw new Error("Synesthesia.UI.Node(.getOutputDescriptors): Not implemented.");
    };

    Node.prototype.attachUI = function (UI) {
      this.UI = UI;
    };

    Node.prototype.draw = function () {
      throw new Error("Synesthesia.UI.Drawable(.draw): Not implemented.");
    };

    Node.prototype.setContainer = function (div) {
      this._container = div;
        this._container.className = "Synesthesia_UI_Node__main";
        this._container.style.left = "" + this.x + "px";
        this._container.style.top = "" + this.y + "px";
        this._container.addEventListener("mousedown", (function () {
          this.UI.bringToFront(this);
        }).bind(this), false);

      var title = document.createElement("div");
        title.className = "title";
        title.innerHTML = this.title;
      this._container.appendChild(title);

      this.div = document.createElement("div");
      this._container.appendChild(this.div);

      var resize_grabber = document.createElement("div");
        resize_grabber.className = "resize_grabber";
      this._container.appendChild(resize_grabber);

      this._draggable = new Synesthesia.UI.Draggable({
        handle: title,
        callback: this.handle_drag.bind(this)
      });

      this._resizeable = new Synesthesia.UI.Draggable({
        handle: resize_grabber,
        callback: this.handle_resize.bind(this)
      });

      //throw new Error("Synesthesia.UI.Node(.attachDiv): Not implemented.");

      this.informPrepared();
    };

    Node.prototype.handle_drag = function (params) {
      var div_style = window.getComputedStyle(this._container);
      this.x = parseInt(div_style.left) + params.dx;
      this.y = parseInt(div_style.top) + params.dy;

      this.UI.bringToFront(this);

      this.reflow();

      params.event.preventDefault();
    };

    Node.prototype.handle_resize = function (params) {
      var div_style = window.getComputedStyle(this._container);
      this.width = parseInt(div_style.width) + params.dx;
      this.height = parseInt(div_style.height) + params.dy;

      this.reflow();

      params.event.preventDefault();
    };

    Node.prototype.setZIndex = function (index) {
      this._container.style.zIndex = "" + index;
    };

    Node.prototype.reflow = function () {
      this._container.style.left = "" + this.x + "px";
      this._container.style.top = "" + this.y + "px";
      this._container.style.width = "" + Math.max(this.width, 200) + "px";
      this._container.style.height = "" + Math.max(this.height, 150) + "px";
    };

    return Node;
  })();

  Synesthesia.UI.NodeCanvas = (function () {
    function NodeCanvas (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.canvas = this.params.canvas;
      this.canvas.className = "Synesthesia_UI_NodeCanvas__canvas";
      this.context = this.canvas.getContext("2d");

      this.node_map = null;

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

    // Node managment.

    NodeCanvas.prototype.useMap = function (map) {
      this.node_map = map;
    };

    // UI drawing.

    NodeCanvas.prototype.draw = function (params) {
      params = (typeof params !== "undefined" ? params : {});
      if (!this.node_map) return;
      
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      var nodes = params.with_ordering || this.node_map.getKeys();
      for (var node_ix = 0; node_ix < nodes.length; node_ix++) {
        var cur_node = nodes[node_ix];
        var cur_node_props = this.node_map.get(cur_node);

        cur_node.setZIndex(node_ix);
        cur_node.draw();

        var inputs_desc = cur_node.getInputDescriptors();
        for (var input_ix = 0; input_ix < inputs_desc.length; input_ix++) {
          this.context.beginPath();
          this.context.arc(
            cur_node.x - 10,
            cur_node.y + input_ix * 20 + 10,
            5,
            0, 2 * Math.PI
          );
          this.context.strokeStyle = "rgba(0, 0, 0, 1)";
          this.context.lineWidth = 2;
          this.context.stroke();
        }

        var outputs_desc = cur_node.getOutputDescriptors();
        for (var output_ix = 0; output_ix < outputs_desc.length; output_ix++) {
          this.context.beginPath();
          this.context.arc(
            cur_node.x + cur_node.width + 10,
            cur_node.y + output_ix * 20 + 10,
            5,
            0, 2 * Math.PI
          );
          this.context.strokeStyle = "rgba(0, 0, 0, 1)";
          this.context.lineWidth = 2;
          this.context.stroke();
        }
      }
    };

    return NodeCanvas;
  })();

});
