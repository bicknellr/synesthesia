module("Synesthesia.UI", ["Synesthesia", "Utilities"], function () {

  var Synesthesia = require("Synesthesia");

  Synesthesia.UI = (function () {
    function UI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.canvas = this.params.canvas;

      this.context = this.canvas.getContext("2d");


      this.nodes = [];
    }

    UI.prototype.addNode = function (new_node) {
      this.nodes.push({
        node: new_node,
        x: 0, y: 0,
        width: 100, height: 100
      });
    };

    UI.prototype.draw = function () {
      for (var node_ix = 0; node_ix < this.nodes.length; node_ix++) {
        var cur_node = this.nodes[node_ix];
        
        var node_canvas = document.createElement("canvas");
        node_canvas.width = cur_node.width;
        node_canvas.height = cur_node.height;
        
        cur_node.node.draw(node_canvas);

        this.context.drawImage(
          node_canvas,
          0, 0, node_canvas.width, node_canvas.height,
          cur_node.x, cur_node.y, node_canvas.width, node_canvas.height
        );
      }
    };

    return UI;
  })();

  Synesthesia.UI.Drawable = (function () {
    function Drawable (params) {
      if (!params) return; // INTERFACE

      this.params = (typeof params !== "undefined" ? params : {});
    }

    Drawable.prototype.draw = function (canvas) {
      var ctx = canvas.getContext("2d");

      var width = 3;
      var styles = [
        "rgba(64, 64, 64, 1)",
        "rgba(255, 0, 0, 1)"
      ];
      var style_index = 0;
      for (var i = 0; i < canvas.width; i += width) {
        ctx.fillStyle = styles[style_index];
        ctx.fillRect(i, 0, i + width, canvas.height);
        style_index = (style_index + 1) % styles.length;
      }

      //throw new Error("Synesthesia.UI.Drawable(.draw): Not implemented.");
    };

    return Drawable;
  })();

});
