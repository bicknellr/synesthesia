module.declare("Synesthesia:UILibrary",
["Utilities", "Synesthesia:Envelope"],
function () {
  
  var Utilities = module.require("Utilities");

  var Envelope = module.require("Synesthesia:Envelope");

  var UILibrary = {};

  UILibrary.Draggable = (function () {
    function Draggable (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.handle = this.params.handle;
        this.handle.addEventListener("mousedown", this.handle_mousedown.bind(this), false);
        window.addEventListener("mousemove", this.handle_mousemove.bind(this), false);
        window.addEventListener("mouseup", this.handle_mouseup.bind(this), false);

      this.callback = this.params.callback || function () {};
      this.callback_mousedown = this.params.callback_mousedown || function () {};
      this.callback_mousemove = this.params.callback_mousemove || function () {};
      this.callback_mouseup = this.params.callback_mouseup || function () {};

      this.cursor = this.params.cursor || null;
    };

    Draggable.prototype.handle_mousedown = function (e) {
      this.last_pageX = e.pageX;
      this.last_pageY = e.pageY;

      if (this.cursor) {
        this.cursor_lock_key = Utilities.CursorManager.acquire(this.cursor);
      }

      this.callback_mousedown({
        e: e,
        x: e.pageX, y: e.pageY
      })

      this.isMousedown = true;
    };

    Draggable.prototype.handle_mousemove = function (e) {
      if (!this.isMousedown) return;

      this.callback({
        e: e,
        x: e.pageX, y: e.pageY,
        dx: e.pageX - this.last_pageX,
        dy: e.pageY - this.last_pageY
      });
      this.callback_mousemove({
        e: e,
        x: e.pageX, y: e.pageY,
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

      if (this.cursor_lock_key) {
        Utilities.CursorManager.release(this.cursor_lock_key);
        this.cursor_lock_key = null;
      }

      this.isMousedown = false;

      this.callback_mouseup({
        e: e,
        x: e.pageX, y: e.pageY,
        dx: e.pageX - this.last_pageX,
        dy: e.pageY - this.last_pageY
      });

      e.stopPropagation();
    };
    
    return Draggable;
  })();

  UILibrary.DragValue = (function () {
    function DragValue (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Utilities.Flaggable.apply(this, arguments);

      this.element = document.createElement("div");
        this.element.className = "Synesthesia_UILibrary_DragValue";
        this.value_span = document.createElement("span");
        this.element.appendChild(this.value_span);
      this.element.addEventListener("dblclick", this.handle_dblclick.bind(this), false);

      this.min_value = this.params.min_value || 0;
      this.max_value = (this.params.max_value !== "undefined" ? this.params.max_value : 1);
      this.value = this.params.value || 0;
      this.unbounded_value = this.params.value || 0;
      this.digits = this.params.digits || 0;

      this.sensitivity = this.params.sensitivity || 0.01;
      this.direction_lock = this.params.direction_lock || "horizontal";
      this.align = this.params.align || "left";

      this.cursor = this.params.cursor || (this.direction_lock == "vertical" ? "ns-resize" : "ew-resize");
      this.element.style.cursor = this.cursor;
      
      this.callback = this.params.callback || function () {};
      this.string_format = this.params.string_format || function (str) { return "" + str; };

      this.draggable = new UILibrary.Draggable({
        handle: this.element,
        cursor: this.cursor,
        callback_mousemove: this.handle_drag.bind(this),
      });

      this.sync_value = null;
      if (this.params.sync_value) {
        this.setSyncValue(this.params.sync_value);
      } else {
        this.setValue(this.value);
      }
    }

    DragValue.prototype = Utilities.extend(
      new Utilities.Flaggable()
    );

    DragValue.prototype.getElement = function () {
      return this.element;
    };

    DragValue.prototype.handle_drag = function (e) {
      //console.log("dx " + e.dx + " dy " + e.dy);
      this.unbounded_value = this.sensitivity * (this.direction_lock == "vertical" ? -e.dy : e.dx) + this.unbounded_value;
      this.unbounded_value = Math.min(this.max_value, this.unbounded_value);
      this.unbounded_value = Math.max(this.min_value, this.unbounded_value);
      this.setValue(
        this.unbounded_value
      );
    };

    DragValue.prototype.handle_dblclick = function (e) {
      if (this.hasFlag("editing")) return;
      this.setFlag("editing");

      this.element_input = document.createElement("div");

      var style = window.getComputedStyle(this.element);
      var value_input = document.createElement("input");
        Utilities.copy_properties(
          style, value_input.style,
          [ "fontFamily",
            "fontSize",
            "color",
            "width"
          ]
        );
      value_input.style.borderWidth = "0px";
      value_input.style.margin = "0px";
      value_input.style.padding = "0px";
      // TODO: Accept enter as completion of editing.
      var confirm_listener = function (e) {
        if (!this.hasFlag("editing")) return;

        var new_value = parseFloat(value_input.value);
        if (isNaN(new_value)) {
          new_value = this.min_value;
        }
        this.setValue(new_value);
        this.element.replaceChild(
          this.value_span,
          this.element_input
        );
        this.unsetFlag("editing");
      };
      value_input.addEventListener("blur", confirm_listener.bind(this), false);

      if (this.sync_value) {
        value_input.value = this.sync_value.getValue();
      } else {
        value_input.value = this.value;
      }

      this.element_input.appendChild(
        value_input
      );
      this.element.replaceChild(
        this.element_input,
        this.value_span
      );

      value_input.select();
    };

    DragValue.prototype.setSyncValue = function (new_sync_value) {
      this.sync_value = new_sync_value;
      this.sync_value.addListener(this, (function (new_value) {
        this.setValue(new_value);
      }).bind(this));
      this.setValue(this.sync_value.getValue());
    };

    DragValue.prototype.setValue = function (new_value) {
      this.unbounded_value = new_value;
      new_value = Math.min(this.max_value, new_value);
      new_value = Math.max(this.min_value, new_value);
      new_value = Math.round(new_value * Math.pow(10, this.digits)) / Math.pow(10, this.digits);

      this.value_span.innerHTML = "" + this.string_format(new_value.toFixed(this.digits));
      if (this.sync_value) {
        this.sync_value.setValue(this, new_value);
      } else {
        this.value = new_value;
      }
      this.callback(this.value);
    };

    DragValue.prototype.getValue = function () {
      return this.value;
    };

    return DragValue;
  })();

  /*
    Does this really need to be called DragValueTable?
    Maybe it should just be a generic table building object.
  */
  UILibrary.DragValueTable = (function () {
    function DragValueTable (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.values = this.params.values;

      this.stack = this.params.stack || false;

      this.element = (this.stack && this.stack == "horizontal" ? document.createElement("div") : document.createElement("table"));

      for (var i = 0; i < this.values.length; i++) {
        this.pushValue(this.values[i].label, this.values[i].drag_value);
      }
    }

    DragValueTable.prototype.getElement = function () {
      return this.element;
    };

    DragValueTable.prototype.pushValue = function (label, drag_value) {
      if (!this.stack) {
        var new_row = document.createElement("tr");
          
          var label_td = document.createElement("td");
            label_td.style.padding = "4px";
            label_td.style.width = "50%";
            label_td.appendChild(document.createTextNode(label));
          new_row.appendChild(label_td);

          var drag_value_td = document.createElement("td");
            drag_value_td.style.width = "50%";
            var drag_value_element = drag_value.getElement();
              drag_value_element.style.width = "-webkit-calc(100% - 8px)";
            drag_value_td.appendChild(drag_value_element);
          new_row.appendChild(drag_value_td);

        this.element.appendChild(new_row);
      } else if (this.stack == "vertical") {
        var label_tr = document.createElement("tr");
          var label_td = document.createElement("td");
            label_td.style.padding = "4px";
            label_td.style.width = "100%";
            label_td.appendChild(document.createTextNode(label));
          label_tr.appendChild(label_td);
        this.element.appendChild(label_tr);

        var drag_value_tr = document.createElement("tr");
          var drag_value_td = document.createElement("td");
            drag_value_td.style.width = "100%";
            var drag_value_element = drag_value.getElement();
              drag_value_element.style.width = "-webkit-calc(100% - 8px)";
            drag_value_td.appendChild(drag_value_element);
          drag_value_tr.appendChild(drag_value_td);
        this.element.appendChild(drag_value_tr);
      } else if (this.stack == "horizontal") {
        this.element.style.display = "-webkit-flex";

        var label_div = document.createElement("div");
          label_div.style.webkitFlex = "1 0 0";
          label_div.style.padding = "4px";
          label_div.style.width = "100%";
          label_div.style.textAlign = "right";
          label_div.appendChild(document.createTextNode(label));
        this.element.appendChild(label_div);

        var drag_value_element = drag_value.getElement();
          drag_value_element.style.webkitFlex = "1 0 0";
        this.element.appendChild(drag_value_element);
      }
    };

    return DragValueTable;
  })();

  UILibrary.RadioGroup = (function () {
    function RadioGroup (params) {
      this.params = (typeof params !== "undefined" ? params : {});
      
      this.element = document.createElement("div");
        this.element.className = "Synesthesia_UILibrary_RadioGroup";

      this.callback_select = this.params.callback_select || function () {};

      this.options = [];
      if (this.options) {
        for (var i = 0; i < this.params.options.length; i++) {
          this.addOption(this.params.options[i]);  
        }
      }
    }

    RadioGroup.prototype.getElement = function () {
      return this.element;
    };

    RadioGroup.prototype.getOptions = function () {
      return [].concat(this.options);
    };

    RadioGroup.prototype.addOption = function (new_option) {
      this.options.push(new_option);
      
      var option_element = document.createElement("div");
        if (!!new_option.selected) {
          option_element.className = "radio_option selected";
        } else {
          option_element.className = "radio_option";
        };
        option_element.appendChild(document.createTextNode(new_option.label));
        option_element.addEventListener("click", (function () {
          this.selectOption(new_option);
        }).bind(this), false);
      new_option.element = option_element;
      this.element.appendChild(option_element);
    };

    RadioGroup.prototype.selectOption = function (option_to_select) {
      this.options.forEach(function (option) {
        if (option != option_to_select) {
          option.selected = false;
          option.element.className = "radio_option";
        }
      });
      option_to_select.selected = true;
      option_to_select.element.className = "radio_option selected";
      this.callback_select(option_to_select);
    };

    RadioGroup.prototype.getSelectedOption = function () {
      return this.options.filter(function (option) {
        return option.selected;
      })[0];
    };

    return RadioGroup;
  })();

  UILibrary.LabeledDiv = (function () {
    function LabeledDiv (params) {
      this.params = (typeof params !== "undefined" ? params : {});
      
      this.element = document.createElement("div");
        this.element.className = "Synesthesia_UILibrary_LabeledDiv";

      this.label_div = document.createElement("div");
        this.label_div.className = "label";
        this.label_div.appendChild(
          document.createTextNode(this.params.label)
        );
      this.element.appendChild(this.label_div);

      this.element.appendChild(this.params.content);
    }

    LabeledDiv.prototype.getElement = function () {
      return this.element;
    };

    return LabeledDiv;
  })();

  /*
    The scaling part of this (of all things) needs to be rewritten.
  */
  UILibrary.ScalableGraph = (function () {
    function ScalableGraph (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Utilities.Flaggable.apply(this, arguments);

      this.canvas = document.createElement("canvas");
      this.context = this.canvas.getContext("2d");

      this.x_min = this.params.x_min || 0;
      this.x_max = this.params.x_max || 0;
      this.y_min = this.params.y_min || 0;
      this.y_max = this.params.y_max || 0;

      this.graph_function = this.params.graph_function || function (a) {
        return Utilities.range(a.length);
      };

      this.scale_x_func = this.params.scale_x_func || function (x) { return x; };
      this.scale_x_func_inv = this.params.scale_x_func_inv || function (x) { return x; };
      this.scale_y_func = this.params.scale_y_func || function (y) { return y; };
      this.scale_y_func_inv = this.params.scale_y_func_inv || function (y) { return y; };

      this.draw();
    }

    ScalableGraph.prototype = Utilities.extend(
      new Utilities.Flaggable()
    );

    ScalableGraph.prototype.getElement = function () {
      return this.canvas;
    };

    ScalableGraph.prototype.setDimensions = function (width, height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.draw();
    };

    ScalableGraph.prototype.draw = function () {
      var context = this.context;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Draw grid.
      context.save();
        var x_points = Utilities.range(this.canvas.width).map(
          (function (x) {
            return this.scale_x_func(x / parseInt(this.canvas.width));
          }).bind(this)
        );
        var frame_points = this.graph_function(x_points);
        context.beginPath();
          for (var x = 0; x < frame_points.length; x++) {
            if (isNaN(frame_points[x])) continue;

            var y = this.scale_y_func_inv(frame_points[x]);
            y = (-1 * y + this.y_max) / (this.y_max - this.y_min) * this.canvas.height;

            if (x == 0) {
              context.moveTo(-0.5, y);
              context.lineTo(0.5, y);
            } else if (x == frame_points.length - 1) {
              context.lineTo(x + 1.5, y);
            } else {
              context.lineTo(x + 0.5, y);
            }
          }
        context.lineWidth = 2;
        context.strokeStyle = "rgba(128, 128, 128, 1)";
        context.stroke();
      context.restore();
    };

    return ScalableGraph;
  })();

  UILibrary.MenuItem = (function () {
    function MenuItem (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.content = this.params.content;
      this.callback = this.params.callback || function () {};
      this.submenu = this.params.submenu || null;

      this.element = document.createElement("div");
        Utilities.addClass(this.element, "Synesthesia_UILibrary_MenuItem");
        this.element.appendChild(this.content);
    }

    MenuItem.prototype.getElement = function () {
      return this.element;
    };

    MenuItem.prototype.contains = function (test_element) {
      if (this.element == test_element || this.element.contains(test_element)) {
        return true;
      }

      if (this.submenu && this.submenu.contains(test_element)) {
          return true;
      }

      return false;
    };

    MenuItem.prototype.getMenu = function () {
      return this.submenu;
    };

    MenuItem.prototype.launch = function () {
      return this.callback();
    };

    MenuItem.prototype.open = function () {
      if (this.submenu) {
        this.submenu.openWithTargetElement(this.element);
        Utilities.addClass(this.element, "open");
      }
    };

    MenuItem.prototype.close = function () {
      if (this.submenu) {
        this.submenu.close();
        Utilities.removeClass(this.element, "open");
      }
    };

    return MenuItem;
  })();

  UILibrary.Menu = (function () {
    function Menu (params) {
      this.params = (typeof params !== "undefined" ? params : {});
      
      this.parent_menu = this.params.parent_menu || null;
      this.self_closeable = (typeof this.params.self_closeable !== "undefined" ? this.params.self_closeable : true);

      this.type = this.params.type || "dropdown";
      this.label = this.params.label;
      this.items = this.params.items;

      this.position = this.params.position || "below";
      this.hover = (typeof this.params.hover !== "undefined" ? this.params.hover : true);

      this.element = document.createElement("div");
        Utilities.addClass(this.element, "Synesthesia_UILibrary_Menu");
        Utilities.addClass(this.element, this.type);

      for (var item_ix = 0; item_ix < this.items.length; item_ix++) {
        var cur_item = this.items[item_ix];

        var cur_item_element = cur_item.getElement();
          Utilities.addClass(cur_item_element, "item");

        if (cur_item.getMenu()) {
          cur_item.getMenu().setParentMenu(this);
        }

        cur_item_element.addEventListener("click", ((function (cur_item) {
          return function (e) {
            if (cur_item.getMenu()) {
              if (cur_item.getMenu().isOpen()) {
                cur_item.close();
              } else {
                cur_item.open();
              }
            } else {
              var close_to_root = cur_item.launch();
              if (typeof close_to_root === "undefined") {
                this.closeToRoot();
              } else {
                if (close_to_root) {
                  this.closeToRoot();
                }
              }
            }
          };
        })(cur_item)).bind(this));

        cur_item_element.addEventListener("mouseover", ((function (cur_item) {
          return function (e) {
            var do_open = false;

            for (var i = 0; i < this.items.length; i++) {
              if (this.hover || (this.items[i].getMenu() && this.items[i].getMenu().isOpen())) {
                do_open = true;
                this.items[i].close();
              }
            }

            if (do_open) {
              cur_item.open();
            }
          };
        })(cur_item)).bind(this));

        this.element.appendChild(cur_item_element);
      }

      window.addEventListener("mousedown", (function (e) {
        var close_all = true;
        for (var i = 0; i < this.items.length; i++) {
          if (this.items[i].contains(e.target)) {
            close_all = false;
          }
        }

        if (close_all) {
          for (var i = 0; i < this.items.length; i++) {
            this.items[i].close();
          }
        }
      }).bind(this));
    }

    Menu.prototype.getElement = function () {
      return this.element;
    };

    Menu.prototype.setParentMenu = function (parent_menu) {
      this.parent_menu = parent_menu;
    };

    Menu.prototype.contains = function (test_element) {
      if (this.element == test_element || this.element.contains(test_element)) {
        return true;
      }

      for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].contains(test_element)) {
          return true;
        }
      }

      return false;
    };

    Menu.prototype.isOpen = function () {
      return document.body.contains(this.element);
    };

    Menu.prototype.openWithTargetElement = function (target_element) {
      // Don't try adding it if it's already there.
      if (document.body.contains(this.element)) return false;

      var target_position = Utilities.getPagePosition(target_element);
      var target_style = window.getComputedStyle(target_element);
      var new_left = 0;
      var new_top = 0;
      switch (this.position) {
        case "below":
          new_top = target_position.top + target_element.offsetHeight;
            new_top += parseInt(target_style.getPropertyValue("border-top-width"));
            new_top += parseInt(target_style.getPropertyValue("border-bottom-width"));
          new_left = target_position.left;
            new_left += parseInt(target_style.getPropertyValue("border-left-width"));
          break;
        case "right":
          new_top = target_position.top;
            new_top += parseInt(target_style.getPropertyValue("border-top-width"));
          new_left = target_position.left + target_element.offsetWidth;
            new_left += parseInt(target_style.getPropertyValue("border-left-width"));
            new_left += parseInt(target_style.getPropertyValue("border-right-width"));
          break;
      }
      this.element.style.left = "" + new_left + "px";
      this.element.style.top = "" + new_top + "px";
 
      document.body.appendChild(this.element);
    };
    
    Menu.prototype.close = function () {
      // Don't try removing it if it's already gone.
      if (!document.body.contains(this.element)) return false;

      for (var i = 0; i < this.items.length; i++) {
        this.items[i].close();
      }

      if (this.self_closeable) {
        document.body.removeChild(this.element);
      }
    };

    Menu.prototype.closeToRoot = function () {
      this.close();
      if (this.parent_menu) {
        this.parent_menu.closeToRoot();
      }
    };

    return Menu;
  })();

  UILibrary.SlideView = (function () {
    function SlideView (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.views = this.params.views || [];
        
      this.default_view = this.params.default_view || (this.views[0] ? this.views[0].name : false) || null;
      
      this.element = null;
      this.build();
    }

    SlideView.prototype.build = function () {
      this.element = document.createElement("div");
        Utilities.addClass(this.element, "Synesthesia_UILibrary_SlideView");

      for (var view_ix = 0; view_ix < this.views.length; view_ix++) {
        var cur_view = this.views[view_ix];

        Utilities.addClass(cur_view.element, "view");

        this.element.appendChild(cur_view.element);
      }

      this.gotoView(this.default_view);
    }

    SlideView.prototype.getElement = function () {
      return this.element;
    };

    SlideView.prototype.gotoView = function (view_name) {
      var before_open = true;

      for (var view_ix = 0; view_ix < this.views.length; view_ix++) {
        var cur_view = this.views[view_ix];

        Utilities.removeClass(cur_view.element, "before");
        Utilities.removeClass(cur_view.element, "after");

        if (cur_view.name == view_name) {
          before_open = false;
        } else if (before_open) {
          Utilities.addClass(cur_view.element, "before");
        } else {
          Utilities.addClass(cur_view.element, "after");
        }
      }
    };

    return SlideView;
  })();

  UILibrary.EnvelopePathDisplay = (function () {
    function EnvelopePathDisplay (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.canvas = null;

      this.width = this.params.width || 300;
      this.height = this.params.height || 150;
      this.x_min = this.params.x_min || 0;
      this.x_max = this.params.x_max || 1;
      this.y_min = this.params.y_min || 0;
      this.y_max = this.params.y_max || 1;

      this.point_radius = this.params.point_radius || 3;

      this.initial_color = this.params.initial_color || "rgba(0, 128, 255, 1)";
      this.selected_color = this.params.selected_color || "rgba(255, 192, 64, 1)";

      this.path = null;
      this.selected_points = [];

      this.build();
      this.draw();
    }

    EnvelopePathDisplay.prototype.getElement = function () {
      return this.canvas;
    };

    EnvelopePathDisplay.prototype.build = function () {
      this.canvas = document.createElement("canvas");
        Utilities.addClass(this.canvas, "Synesthesia_UILibrary_EnvelopePathDisplay");
        this.canvas.width = this.width;
        this.canvas.height = this.height;

      this.draw();
    };

    EnvelopePathDisplay.prototype.setPath = function (new_path) {
      this.path = new_path;

      this.draw();
    };

    EnvelopePathDisplay.prototype.selectPoint = function (point) {
      this.selected_points.push(point);
    };

    EnvelopePathDisplay.prototype.deselectPoint = function (point) {
      while (this.selected_points.indexOf(point) != -1) {
        this.selected_points.splice(
          this.selected_points.indexOf(point),
          1
        );
      }
    };

    EnvelopePathDisplay.prototype.getSelectedPoints = function () {
      return [].concat(this.selected_points);
    };

    EnvelopePathDisplay.prototype.setSelectedPoints = function (points) {
      var path_points = this.path.getPoints();
      this.selected_points = points.filter(
        function (point) {
          return (path_points.indexOf(point) != -1);
        }
      );
    };

    EnvelopePathDisplay.prototype.setDisplayParameters = function (params) {
      var param_list = ["width", "height", "x_min", "x_max", "y_min", "y_max", "initial_color", "selected_color"];
      for (var i = 0; i < param_list.length; i++) {
        var cur_param = param_list[i];
        if (params.hasOwnProperty(cur_param)) {
          this[cur_param] = params[cur_param];
        }
      }

      this.draw();
    };

    // params.point is {x: Number, y: Number} not Envelope.Point
    EnvelopePathDisplay.prototype.convertToDisplayCoords = function (params) {
      var new_x = (params.point.x - params.x_min) / (params.x_max - params.x_min) * params.width;
      var new_y = params.height - (params.point.y - params.y_min) / (params.y_max - params.y_min) * params.height;
      return {x: new_x, y: new_y};
    };

    EnvelopePathDisplay.prototype.draw = function () {
      //console.log("EnvelopePathDisplay(.draw)");
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      if (this.path == null) return;

      var ctx = this.canvas.getContext("2d");
      ctx.save();

        var path_points = this.path.getPoints();

        for (var point_ix = 1; point_ix < path_points.length; point_ix++) {
          var cur_point_l = path_points[point_ix - 1];
          var cur_point_r = path_points[point_ix];

          var display_coords_l = this.convertToDisplayCoords({
            point: {x: cur_point_l.getTime(), y: cur_point_l.getValue()},
            x_min: this.x_min, x_max: this.x_max,
            y_min: this.y_min, y_max: this.y_max,
            width: this.canvas.width,
            height: this.canvas.height
          });
          var display_coords_r = this.convertToDisplayCoords({
            point: {x: cur_point_r.getTime(), y: cur_point_r.getValue()},
            x_min: this.x_min, x_max: this.x_max,
            y_min: this.y_min, y_max: this.y_max,
            width: this.canvas.width,
            height: this.canvas.height
          });

          ctx.beginPath();
            ctx.moveTo(display_coords_l.x, display_coords_l.y);
            ctx.lineTo(display_coords_r.x, display_coords_r.y);

          ctx.lineWidth = this.point_radius * (2 / 3);
          if (this.selected_points.indexOf(cur_point_r) == -1) {
            ctx.strokeStyle = this.initial_color;
          } else {
            ctx.strokeStyle = this.selected_color;
          }
          ctx.stroke();
        }

        for (var point_ix = 0; point_ix < path_points.length; point_ix++) {
          var cur_point = path_points[point_ix];

          var display_coords = this.convertToDisplayCoords({
            point: {x: cur_point.getTime(), y: cur_point.getValue()},
            x_min: this.x_min, x_max: this.x_max,
            y_min: this.y_min, y_max: this.y_max,
            width: this.canvas.width,
            height: this.canvas.height
          });

          ctx.beginPath();
            ctx.arc(display_coords.x, display_coords.y, this.point_radius + 2, 0, 2 * Math.PI);
          ctx.globalCompositeOperation = "destination-out";
          ctx.fill();
        }

        for (var point_ix = 0; point_ix < path_points.length; point_ix++) {
          var cur_point = path_points[point_ix];

          var display_coords = this.convertToDisplayCoords({
            point: {x: cur_point.getTime(), y: cur_point.getValue()},
            x_min: this.x_min, x_max: this.x_max,
            y_min: this.y_min, y_max: this.y_max,
            width: this.canvas.width,
            height: this.canvas.height
          });

          ctx.beginPath();
            ctx.arc(display_coords.x, display_coords.y, this.point_radius + 1, 0, 2 * Math.PI);
          ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(64, 64, 64, 0.5)";
          ctx.fill();

          ctx.beginPath();
            ctx.arc(display_coords.x, display_coords.y, this.point_radius, 0, 2 * Math.PI);
          ctx.globalCompositeOperation = "source-over";
          if (this.selected_points.indexOf(cur_point) == -1) {
            ctx.fillStyle = this.initial_color;
          } else {
            ctx.fillStyle = this.selected_color;
          }
          ctx.fill();
        }

      ctx.restore();
    };

    return EnvelopePathDisplay;
  })();

  UILibrary.EnvelopePathsEditor = (function () {
    function EnvelopePathsEditor (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.element = null;

      this.width = this.params.width || 500;
      this.height = this.params.height || 300;
      this.x_min = this.params.x_min || 0;
      this.x_max = this.params.x_max || 1;
      this.y_min = this.params.y_min || 0;
      this.y_max = this.params.y_max || 1;

      this.selection_radius = this.params.selection_radius || 5;
      this.selection_parameters = null;
      this.selection_map = new Utilities.Map();
      this.selection_map_stage = new Utilities.Map();
      this.selection_map_deselect_stage = new Utilities.Map();

      this.paths = [];
      this.display_map = new Utilities.Map();

      this.build();

      // DEBUGGING ONLY!
      var TEST_PATH_1 = new Envelope.Path();
        for (var i = 0; i <= 25; i++) {
          TEST_PATH_1.addPoint(
            new Envelope.Point({
              time: (1 / i),
              value: (1 / i) * (1 / i),
              transition: Envelope.Point.Transition.LINEAR
            })
          );
        }
      this.addPath(TEST_PATH_1);
      var TEST_PATH_2 = new Envelope.Path();
      this.addPath(TEST_PATH_2);
        for (var i = 0; i <= 25; i++) {
          var new_point = new Envelope.Point({
            time: i * (1 / 25),
            value: 1 - i * (1 / 25) * i * (1 / 25),
            transition: Envelope.Point.Transition.LINEAR
          });

          TEST_PATH_2.addPoint(new_point);
        }

      this.draw();
    }

    EnvelopePathsEditor.prototype.getElement = function () {
      return this.element;
    };

    EnvelopePathsEditor.prototype.build = function () {
      this.element = document.createElement("div");
        Utilities.addClass(this.element, "Synesthesia_UILibrary_EnvelopePathsEditor");
        this.element.style.width = "" + this.width + "px";
        this.element.style.height = "" + this.height + "px";

      this.selection_overlay = document.createElement("canvas");
        this.selection_overlay.style.position = "absolute";
        this.selection_overlay.style.top = "0px";
        this.selection_overlay.style.left = "0px";
        this.selection_overlay.width = this.width;
        this.selection_overlay.height = this.height;

      this.element.appendChild(this.selection_overlay);

      this.element.addEventListener("mousedown", this.handle_mousedown.bind(this));
      this.element.addEventListener("mousemove", this.handle_mousemove.bind(this));
      this.element.addEventListener("mouseup", this.handle_mouseup.bind(this));
      this.element.addEventListener("mouseout", this.handle_mouseup.bind(this));
    };

    EnvelopePathsEditor.prototype.handle_mousedown = function (e) {
      var element_page_position = Utilities.getPagePosition(this.element);
      var graph_x = e.pageX - element_page_position.left;
      var graph_y = e.pageY - element_page_position.top;

      var selectable_point = this.getSelectablePointWithinRadius({
        x: graph_x, y: graph_y,
        radius: this.selection_radius
      });

      this.selection_params = {
        x: graph_x, y: graph_y,
        shiftKey: e.shiftKey,
        start_point_params: selectable_point
      };

      this.draw();
    };

    EnvelopePathsEditor.prototype.handle_mousemove = function (e) {
      var element_page_position = Utilities.getPagePosition(this.element);
      var graph_x = e.pageX - element_page_position.left;
      var graph_y = e.pageY - element_page_position.top;

      // set up selection_map_stage
      for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
        var cur_path = this.paths[path_ix];
        this.selection_map_stage.set(cur_path, []);
        this.selection_map_deselect_stage.set(cur_path, []);
      }
      
      // Get the selectable point under the mouse if any.
      var selectable_point = this.getSelectablePointWithinRadius({
        x: graph_x, y: graph_y,
        radius: this.selection_radius
      });

      if (this.selection_params && !this.selection_params.start_point_params.point) {
        // If we didn't start by mousedown on a point.

        // Draw the selection box.
        var overlay_ctx = this.selection_overlay.getContext("2d");
        overlay_ctx.save();
          overlay_ctx.clearRect(0, 0, this.selection_overlay.width, this.selection_overlay.height);

          overlay_ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          overlay_ctx.fillRect(
            this.selection_params.x - 0.5, this.selection_params.y - 0.5,
            graph_x - this.selection_params.x, graph_y - this.selection_params.y
          );

          overlay_ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          overlay_ctx.strokeRect(
            this.selection_params.x - 0.5, this.selection_params.y - 0.5,
            graph_x - this.selection_params.x, graph_y - this.selection_params.y
          );
        overlay_ctx.restore();

        if (!this.selection_params.shiftKey) {
          // If we aren't using shift selection.
          
          // Deselect all currently selected points.
          for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
            var cur_path = this.paths[path_ix];
            this.selection_map.set(cur_path, []);
          }
        }

        // Find and stage the points within the box.
        this.selection_map_stage = this.getPathToPointsWithinBoundsMap({
          x_min: Math.min(this.selection_params.x, graph_x), y_min: Math.min(this.selection_params.y, graph_y),
          x_max: Math.max(this.selection_params.x, graph_x), y_max: Math.max(this.selection_params.y, graph_y)
        });

        if (this.selection_params.shiftKey) {
          // If we are using shift selection.

          // Move already selected points that are within the selection
          // bounds to the deselect stage.
          for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
            var cur_path = this.paths[path_ix];
            
            var path_selected_points = this.selection_map.get(cur_path) || [];
            var path_select_stage = this.selection_map_stage.get(cur_path) || [];
            var path_deselect_stage = this.selection_map_deselect_stage.get(cur_path) || [];
            for (var point_ix = 0; point_ix < path_select_stage.length; point_ix++) {
              var cur_point = path_select_stage[point_ix];

              if (path_selected_points.indexOf(cur_point) != -1) {
                // If the staged point is already selected.

                // Move it to the deselect stage.
                path_deselect_stage.push(cur_point);
                path_select_stage[point_ix] = null;
              }
            }
            path_select_stage.filter(
              function (point) {
                return point != null;
              }
            );
            this.selection_map_stage.set(cur_path, path_select_stage);
            this.selection_map_deselect_stage.set(cur_path, path_deselect_stage);
          }
        }
        
      } else if (selectable_point.point) {
        // If we're hovering over a point.

        // Stage the point.
        var staged_points_for_path = this.selection_map_stage.get(selectable_point.path);
        staged_points_for_path.push(selectable_point.point);
      }

      this.draw();
    };

    EnvelopePathsEditor.prototype.handle_mouseup = function (e) {
      var element_page_position = Utilities.getPagePosition(this.element);
      var graph_x = e.pageX - element_page_position.left;
      var graph_y = e.pageY - element_page_position.top;
      
      // Destroy the selection box, if any.
      var overlay_ctx = this.selection_overlay.getContext("2d");
      overlay_ctx.save();
        overlay_ctx.clearRect(0, 0, this.selection_overlay.width, this.selection_overlay.height);
      overlay_ctx.restore();

      // Get the selectable point under the mouse if any.
      var selectable_point = this.getSelectablePointWithinRadius({
        x: graph_x, y: graph_y,
        radius: this.selection_radius
      });

      if (this.selection_params && !this.selection_params.shiftKey && selectable_point.point) {
        // If they didn't push shift and we're clicking a point.

        // Select only that point.
        for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
          var cur_path = this.paths[path_ix];
          this.selection_map.set(cur_path, []);
        }
        this.selection_map.get(selectable_point.path).push(selectable_point.point);
      } else {
        // Select the staged points.
        for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
          var cur_path = this.paths[path_ix];

          var selected_points = this.selection_map.get(cur_path);
          if (!selected_points) {
            selected_points = [];
            this.selection_map.set(cur_path, selected_points);
          }
          // Add points in the select map and stage.
          var selected_points = (this.selection_map.get(cur_path) || []).concat(this.selection_map_stage.get(cur_path) || []);
          // Remove points in the deselect stage.
          var deselected_points = (this.selection_map_deselect_stage.get(cur_path) || []);
          deselected_points.forEach(
            function (deselect_point) {
              while (selected_points.indexOf(deselect_point) != -1) {
                selected_points.splice(
                  selected_points.indexOf(deselect_point),
                  1
                );
              }
            }
          );

          this.selection_map.set(cur_path, selected_points);
        }
      }
      this.selection_map_stage.set(cur_path, []);
      this.selection_map_deselect_stage.set(cur_path, []);

      this.selection_params = null;
      this.draw();
    };

    EnvelopePathsEditor.prototype.addPath = function (new_path) {
      if (this.paths.indexOf(new_path) != -1) return;

      this.paths.push(new_path);

      var new_display = new UILibrary.EnvelopePathDisplay();
        new_display.setPath(new_path);

      this.display_map.set(new_path, new_display);

      if (this.display_map.getKeys().length != 1) {
        new_display.getElement().style.position = "absolute";
        new_display.getElement().style.top = "0px";
        new_display.getElement().style.left = "0px";
        new_display.setDisplayParameters({
          initial_color: "rgba(255, 0, 128, 1)"
        });
      }
      
      this.element.insertBefore(
        new_display.getElement(),
        this.selection_overlay
      );
    };

    EnvelopePathsEditor.prototype.removePath = function (rm_path) {
      while (this.paths.indexOf(rm_path) != -1) {
        this.paths.splice(this.paths.indexOf(rm_path), 1);
      }
    };

    // bounds : {x_min: Number, y_min: Number, x_max: Number, y_max: Number}
    EnvelopePathsEditor.prototype.getPathToPointsWithinBoundsMap = function (bounds) {
      var path_to_bounded_points_map = new Utilities.Map();
      for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
        var cur_path = this.paths[path_ix];

        var valid_points = [];

        var path_points = cur_path.getPoints();
        for (var point_ix = 0; point_ix < path_points.length; point_ix++) {
          var cur_point = path_points[point_ix];
          var cur_point_coords = this.display_map.get(cur_path).convertToDisplayCoords({
            point: {x: cur_point.getTime(), y: cur_point.getValue()},
            width: this.width, height: this.height,
            x_min: this.x_min, x_max: this.x_max,
            y_min: this.y_min, y_max: this.y_max
          });

          if (
            bounds.x_min <= cur_point_coords.x &&
            cur_point_coords.x <= bounds.x_max &&
            bounds.y_min <= cur_point_coords.y &&
            cur_point_coords.y <= bounds.y_max
          ) {
            valid_points.push(cur_point);
          }
        }

        path_to_bounded_points_map.set(cur_path, valid_points);
      }

      return path_to_bounded_points_map;
    };

    // point : {x: Number, y: Number, radius: Number}
    EnvelopePathsEditor.prototype.getSelectablePointWithinRadius = function (point) {
      var nearest_point = null;
      var nearest_point_path = null;
      var nearest_point_distance = -1;

      for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
        var cur_path = this.paths[path_ix];

        var path_points = cur_path.getPoints();
        for (var point_ix = 0; point_ix < path_points.length; point_ix++) {
          var cur_point = path_points[point_ix];
          var cur_point_coords = this.display_map.get(cur_path).convertToDisplayCoords({
            point: {x: cur_point.getTime(), y: cur_point.getValue()},
            width: this.width, height: this.height,
            x_min: this.x_min, x_max: this.x_max,
            y_min: this.y_min, y_max: this.y_max
          });

          var point_distance = Math.sqrt(Math.pow(point.x - cur_point_coords.x, 2) + Math.pow(point.y - cur_point_coords.y, 2));

          if (point_distance < point.radius) {
            if (nearest_point == null || point_distance < nearest_point_distance) {
              nearest_point = cur_point;
              nearest_point_path = cur_path;
              nearest_point_distance = point_distance;
            }
          }
        }
      }

      return {point: nearest_point, path: nearest_point_path};
    };

    EnvelopePathsEditor.prototype.draw = function () {
      for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
        var cur_path = this.paths[path_ix];

        var cur_display = this.display_map.get(cur_path);

        // Add points in the select map and stage.
        var selected_points = (this.selection_map.get(cur_path) || []).concat(this.selection_map_stage.get(cur_path) || []);
        // Remove points in the deselect stage.
        var deselected_points = (this.selection_map_deselect_stage.get(cur_path) || []);
        deselected_points.forEach(
          function (deselect_point) {
            while (selected_points.indexOf(deselect_point) != -1) {
              selected_points.splice(
                selected_points.indexOf(deselect_point),
                1
              );
            }
          }
        );

        cur_display.setSelectedPoints(selected_points);

        cur_display.setDisplayParameters({
          width: this.width, height: this.height,
          x_min: this.x_min, x_max: this.x_max,
          y_min: this.y_min, y_max: this.y_max
        });

        cur_display.draw();
      }
    };

    return EnvelopePathsEditor;
  })();

  return UILibrary;
});
