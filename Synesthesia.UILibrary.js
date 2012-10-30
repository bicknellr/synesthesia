module.declare("Synesthesia:UILibrary",
["Utilities"],
function () {
  
  var Utilities = module.require("Utilities");

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

  return UILibrary;
});
