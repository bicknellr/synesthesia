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

  UILibrary.GridCanvas = (function () {
    function GridCanvas (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.canvas = document.createElement("canvas");
      this.context = this.canvas.getContext("2d");

      if (this.params.width_sync) {
        this.width_sync = this.params.width_sync;
      } else {
        this.width_sync = new Utilities.SynchronizedValue();
      }
      this.width_sync.addListener(this, (function (new_value) {
        this.canvas.width = new_value;
      }).bind(this));
      if (this.width_sync.getValue()) {
        this.canvas.width = this.width_sync.getValue();
      } else {
        this.width_sync.setValue(null, 0);
      }

      if (this.params.height_sync) {
        this.height_sync = this.params.height_sync;
      } else {
        this.height_sync = new Utilities.SynchronizedValue();
      }
      this.height_sync.addListener(this, (function (new_value) {
        this.canvas.height = new_value;
      }).bind(this));
      if (this.height_sync.getValue()) {
        this.canvas.height = this.height_sync.getValue();
      } else {
        this.height_sync.setValue(null, 0);
      }

      if (this.params.x_min_sync) {
        this.x_min_sync = this.params.x_min_sync;
      } else {
        this.x_min_sync = new Utilities.SynchronizedValue();
      }
      this.x_min_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.x_min_sync.getValue()) {
        this.x_min_sync.setValue(this, 0);
      }

      if (this.params.x_max_sync) {
        this.x_max_sync = this.params.x_max_sync;
      } else {
        this.x_max_sync = new Utilities.SynchronizedValue();
      }
      this.x_max_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.x_max_sync.getValue()) {
        this.x_max_sync.setValue(this, 1);
      }

      if (this.params.y_min_sync) {
        this.y_min_sync = this.params.y_min_sync;
      } else {
        this.y_min_sync = new Utilities.SynchronizedValue();
      }
      this.y_min_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.y_min_sync.getValue()) {
        this.y_min_sync.setValue(this, 0);
      }

      if (this.params.y_max_sync) {
        this.y_max_sync = this.params.y_max_sync;
      } else {
        this.y_max_sync = new Utilities.SynchronizedValue();
      }
      this.y_max_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.y_max_sync.getValue()) {
        this.y_max_sync.setValue(this, 1);
      }

      this.build();
    }

    GridCanvas.prototype.setupSyncValuesFromParams = function (values_and_defaults) {

    };

    GridCanvas.prototype.getElement = function () {
      return this.canvas;
    };

    GridCanvas.prototype.build = function () {
      Utilities.addClass(this.canvas, "Synesthesia_UILibrary_GridCanvas");
    };

    /*
      params: {
        point: {x: Number, y: Number},
        x_min: Number, x_max: Number,
        y_min: Number, y_max: Number,
        width: Number, height: Number
      }
    */
    GridCanvas.prototype.convertToDisplayCoords = function (params) {
      return {
        x: (params.point.x - params.x_min) / (params.x_max - params.x_min) * params.width,
        y: params.height - (params.point.y - params.y_min) / (params.y_max - params.y_min) * params.height
      };
    };


    GridCanvas.prototype.draw = function () {
      // Clear canvas.
      this.canvas.width = this.canvas.width;
      this.canvas.height = this.canvas.height;

      this.context.save();

        // Draw x grid lines.
        var x_div_minor = Math.pow(10, Math.floor(Math.log(this.x_max_sync.getValue() - this.x_min_sync.getValue()) / Math.log(10)) - 1);
        var x_div_major = Math.pow(10, Math.floor(Math.log(this.x_max_sync.getValue() - this.x_min_sync.getValue()) / Math.log(10)));
        console.log("x_div_minor " + x_div_minor);
        console.log("x_div_major " + x_div_major);

        var x_start = 0;
        while (x_start >= this.x_min_sync.getValue()) {
          x_start -= x_div_minor;
        }
        x_start += x_div_minor;

        for (var x = x_start; x <= this.x_max_sync.getValue(); x += x_div_minor) {
          var display_coords = this.convertToDisplayCoords({
              point: {x: x, y: 0},
              width: this.canvas.width, height: this.canvas.height,
              x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
              y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue()
          });

          display_coords.x = Math.floor(display_coords.x) + 0.5;

          this.context.beginPath();
            this.context.moveTo(display_coords.x, 0);
            this.context.lineTo(display_coords.x, this.canvas.height);
          if (x % x_div_major == 0) {
            this.context.strokeStyle = "rgba(128, 64, 64, 1)";
          } else {
            this.context.strokeStyle = "rgba(64, 64, 64, 1)";
          }
          this.context.stroke();
        }

        // Draw y grid lines.
        var y_div_minor = Math.pow(10, Math.floor(Math.log(this.y_max_sync.getValue() - this.y_min_sync.getValue()) / Math.log(10)) - 1);
        var y_div_major = Math.pow(10, Math.floor(Math.log(this.y_max_sync.getValue() - this.y_min_sync.getValue()) / Math.log(10)));
        console.log("y_div_minor " + y_div_minor);
        console.log("y_div_major " + y_div_major);

        var y_start = 0;
        while (y_start >= this.y_min_sync.getValue()) {
          y_start -= y_div_minor;
        }
        y_start += y_div_minor;

        for (var y = y_start; y <= this.y_max_sync.getValue(); y += y_div_minor) {
          var display_coords = this.convertToDisplayCoords({
              point: {x: 0, y: y},
              width: this.canvas.width, height: this.canvas.height,
              x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
              y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue()
          });

          display_coords.y = Math.floor(display_coords.y) + 0.5;

          this.context.beginPath();
            this.context.moveTo(0, display_coords.y);
            this.context.lineTo(this.canvas.width, display_coords.y);
          if (y % y_div_major == 0) {
            this.context.strokeStyle = "rgba(128, 64, 64, 1)";
          } else {
            this.context.strokeStyle = "rgba(64, 64, 64, 1)";
          }
          this.context.stroke();
        }

      this.context.restore();
    };

    return GridCanvas;
  })();

  UILibrary.EnvelopePathDisplay = (function () {
    function EnvelopePathDisplay (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.canvas = document.createElement("canvas");

      if (this.params.width_sync) {
        this.width_sync = this.params.width_sync;
      } else {
        this.width_sync = new Utilities.SynchronizedValue();
      }
      this.width_sync.addListener(this, (function (new_value) {
        this.canvas.width = new_value;
      }).bind(this));
      if (this.width_sync.getValue()) {
        this.canvas.width = this.width_sync.getValue();
      } else {
        this.width_sync.setValue(null, 500);
      }

      if (this.params.height_sync) {
        this.height_sync = this.params.height_sync;
      } else {
        this.height_sync = new Utilities.SynchronizedValue();
      }
      this.height_sync.addListener(this, (function (new_value) {
        this.canvas.height = new_value;
      }).bind(this));
      if (this.height_sync.getValue()) {
        this.canvas.height = this.height_sync.getValue();
      } else {
        this.height_sync.setValue(null, 300);
      }

      if (this.params.x_min_sync) {
        this.x_min_sync = this.params.x_min_sync;
      } else {
        this.x_min_sync = new Utilities.SynchronizedValue();
      }
      this.x_min_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.x_min_sync.getValue()) {
        this.x_min_sync.setValue(this, 0);
      }

      if (this.params.x_max_sync) {
        this.x_max_sync = this.params.x_max_sync;
      } else {
        this.x_max_sync = new Utilities.SynchronizedValue();
      }
      this.x_max_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.x_max_sync.getValue()) {
        this.x_max_sync.setValue(this, 1);
      }

      if (this.params.y_min_sync) {
        this.y_min_sync = this.params.y_min_sync;
      } else {
        this.y_min_sync = new Utilities.SynchronizedValue();
      }
      this.y_min_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.y_min_sync.getValue()) {
        this.y_min_sync.setValue(this, 0);
      }

      if (this.params.y_max_sync) {
        this.y_max_sync = this.params.y_max_sync;
      } else {
        this.y_max_sync = new Utilities.SynchronizedValue();
      }
      this.y_max_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.y_max_sync.getValue()) {
        this.y_max_sync.setValue(this, 1);
      }

      this.path = null;
      this.selected_points = [];
      this.point_styles = new Utilities.Map();
      this.initial_point_style = this.params.initial_point_style || {
        lineWidth: 2,
        lineColor: "rgba(0, 128, 255, 1)",
        pointRadius: 3,
        pointColor: "rgba(0, 128, 255, 1)",
        pointOutlineWidth: 1,
        pointOutlineColor: "rgba(64, 64, 64, 0.5)"
      };

      this.build();
      this.draw();
    }

    EnvelopePathDisplay.prototype.getElement = function () {
      return this.canvas;
    };

    EnvelopePathDisplay.prototype.build = function () {
      Utilities.addClass(this.canvas, "Synesthesia_UILibrary_EnvelopePathDisplay");
    };

    /*
      new_path: Envelope.Path
    */
    EnvelopePathDisplay.prototype.setPath = function (new_path) {
      this.path = new_path;

      this.draw();
    };

    /*
      point: Envelope.Point
      style: {
        *lineWidth: Number,
        *lineColor: String,
        *pointRadius: Number,
        *pointColor: String,
        *pointOutlineWidth: Number,
        *pointOutlineColor: String
      }
      *do_draw: Boolean
    */
    EnvelopePathDisplay.prototype.setPointStyle = function (point, style, do_draw) {
      this.point_styles.set(point, style);

      if (typeof do_draw == "undefined" || do_draw) {
        this.draw();
      }
    };

    /*
      point: Envelope.Point
      *do_draw: Boolean
    */
    EnvelopePathDisplay.prototype.clearPointStyle = function (point, do_draw) {
      this.point_styles.remove(point);

      if (typeof do_draw == "undefined" || do_draw) {
        this.draw();
      }
    };

    /*
      points: [Envelope.Point]
      style: {
        *lineWidth: Number,
        *lineColor: String,
        *pointRadius: Number,
        *pointColor: String,
        *pointOutlineWidth: Number,
        *pointOutlineColor: String
      }
      *do_draw: Boolean
    */
    EnvelopePathDisplay.prototype.setPointsStyle = function (points, style, do_draw) {
      for (var i = 0; i < points.length; i++) {
        this.setPointStyle(points[i], style, false);
      }

      if (typeof do_draw == "undefined" || do_draw) {
        this.draw();
      }
    };
    
    /*
      points: [Envelope.Point]
      *do_draw: Boolean
    */
    EnvelopePathDisplay.prototype.clearPointsStyle = function (points, do_draw) {
      for (var i = 0; i < points.length; i++) {
        this.clearPointStyle(points[i], false);
      }

      if (typeof do_draw == "undefined" || do_draw) {
        this.draw();
      }
    };

    /*
      params: {
        point: {x: Number, y: Number},
        x_min: Number, x_max: Number,
        y_min: Number, y_max: Number,
        width: Number, height: Number
      }
    */
    EnvelopePathDisplay.prototype.convertToDisplayCoords = function (params) {
      return {
        x: (params.point.x - params.x_min) / (params.x_max - params.x_min) * params.width,
        y: params.height - (params.point.y - params.y_min) / (params.y_max - params.y_min) * params.height
      };
    };

    /*
      params: {
        point: {x: Number, y: Number},
        x_min: Number, x_max: Number,
        y_min: Number, y_max: Number,
        width: Number, height: Number
      }
    */
    EnvelopePathDisplay.prototype.convertToPathCoords = function (params) {
      return {
        x: params.point.x * (params.x_max - params.x_min) / params.width + params.x_min,
        y: (params.height - params.point.y) * (params.y_max - params.y_min) / params.height + params.y_min
      };
    };

    EnvelopePathDisplay.prototype.draw = function () {
      this.canvas.width = this.canvas.width;
      this.canvas.height = this.canvas.height;

      if (this.path == null) return;

      var ctx = this.canvas.getContext("2d");
      ctx.save();

        var path_points = this.path.getPoints();

        for (var point_ix = 1; point_ix < path_points.length; point_ix++) {
          var cur_point_l = path_points[point_ix - 1];
          var cur_point_r = path_points[point_ix];

          var point_style = this.point_styles.get(cur_point_r) || {};

          var display_coords_l = this.convertToDisplayCoords({
            point: {x: cur_point_l.getTime(), y: cur_point_l.getValue()},
            x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
            y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
            width: this.canvas.width, height: this.canvas.height
          });
          var display_coords_r = this.convertToDisplayCoords({
            point: {x: cur_point_r.getTime(), y: cur_point_r.getValue()},
            x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
            y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
            width: this.canvas.width, height: this.canvas.height
          });

          ctx.beginPath();
            ctx.moveTo(display_coords_l.x, display_coords_l.y);
            ctx.lineTo(display_coords_r.x, display_coords_r.y);

          ctx.lineWidth = point_style.lineWidth || this.initial_point_style.lineWidth;
          ctx.strokeStyle = point_style.lineColor || this.initial_point_style.lineColor;
          ctx.stroke();
        }

        ctx.globalCompositeOperation = "destination-out";
        for (var point_ix = 0; point_ix < path_points.length; point_ix++) {
          var cur_point = path_points[point_ix];

          var point_style = this.point_styles.get(cur_point) || {};

          var display_coords = this.convertToDisplayCoords({
            point: {x: cur_point.getTime(), y: cur_point.getValue()},
            x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
            y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
            width: this.canvas.width, height: this.canvas.height
          });

          ctx.beginPath();
            ctx.arc(
              display_coords.x, display_coords.y,
              (point_style.pointRadius || this.initial_point_style.pointRadius) +
                (point_style.pointOutlineWidth || this.initial_point_style.pointOutlineWidth),
              0,
              2 * Math.PI
            );
          ctx.fillStyle = point_style.pointColor || this.initial_point_style.pointColor;
          ctx.fill();
        }

        ctx.globalCompositeOperation = "source-over";
        for (var point_ix = 0; point_ix < path_points.length; point_ix++) {
          var cur_point = path_points[point_ix];

          var point_style = this.point_styles.get(cur_point) || {};

          var display_coords = this.convertToDisplayCoords({
            point: {x: cur_point.getTime(), y: cur_point.getValue()},
            x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
            y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
            width: this.canvas.width, height: this.canvas.height
          });

          ctx.beginPath();
            ctx.arc(
              display_coords.x, display_coords.y,
              (point_style.pointRadius || this.initial_point_style.pointRadius) +
                (point_style.pointOutlineWidth || this.initial_point_style.pointOutlineWidth),
              0,
              2 * Math.PI
            );
            ctx.fillStyle = point_style.pointOutlineColor || this.initial_point_style.pointOutlineColor;
          ctx.fill();

          ctx.beginPath();
            ctx.arc(
              display_coords.x, display_coords.y,
              point_style.pointRadius || this.initial_point_style.pointRadius,
              0,
              2 * Math.PI
            );
          ctx.fillStyle = point_style.pointColor || this.initial_point_style.pointColor;
          ctx.fill();
        }

      ctx.restore();
    };

    return EnvelopePathDisplay;
  })();

  UILibrary.EnvelopePathsEditor = (function () {
    function EnvelopePathsEditor (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.element = document.createElement("div");

      this.selection_overlay = document.createElement("canvas");
        this.selection_overlay.style.position = "absolute";
        this.selection_overlay.style.top = "0px";
        this.selection_overlay.style.left = "0px";

      if (this.params.width_sync) {
        this.width_sync = this.params.width_sync;
      } else {
        this.width_sync = new Utilities.SynchronizedValue();
      }
      this.width_sync.addListener(this, (function (new_value) {
        this.element.style.width = "" + new_value + "px";
        this.selection_overlay.width = new_value;
      }).bind(this));
      if (!this.width_sync.getValue()) {
        this.width_sync.setValue(null, 500);
      }

      if (this.params.height_sync) {
        this.height_sync = this.params.height_sync;
      } else {
        this.height_sync = new Utilities.SynchronizedValue();
      }
      this.height_sync.addListener(this, (function (new_value) {
        this.element.style.height = "" + new_value + "px";
        this.selection_overlay.height = new_value;
      }).bind(this));
      if (!this.height_sync.getValue()) {
        this.height_sync.setValue(null, 300);
      }

      if (this.params.x_min_sync) {
        this.x_min_sync = this.params.x_min_sync;
      } else {
        this.x_min_sync = new Utilities.SynchronizedValue();
      }
      this.x_min_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.x_min_sync.getValue()) {
        this.x_min_sync.setValue(this, 0);
      }

      if (this.params.x_max_sync) {
        this.x_max_sync = this.params.x_max_sync;
      } else {
        this.x_max_sync = new Utilities.SynchronizedValue();
      }
      this.x_max_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.x_max_sync.getValue()) {
        this.x_max_sync.setValue(this, 1);
      }

      if (this.params.y_min_sync) {
        this.y_min_sync = this.params.y_min_sync;
      } else {
        this.y_min_sync = new Utilities.SynchronizedValue();
      }
      this.y_min_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.y_min_sync.getValue()) {
        this.y_min_sync.setValue(this, 0);
      }

      if (this.params.y_max_sync) {
        this.y_max_sync = this.params.y_max_sync;
      } else {
        this.y_max_sync = new Utilities.SynchronizedValue();
      }
      this.y_max_sync.addListener(this, (function (new_value) {
        this.draw();
      }).bind(this));
      if (!this.y_max_sync.getValue()) {
        this.y_max_sync.setValue(this, 1);
      }

      this.selection_radius = this.params.selection_radius || 5;
      this.selection_parameters = null;
      this.selected_points = new Utilities.Set();
      this.selection_stage = new Utilities.Set();
      this.deselection_stage = new Utilities.Set();

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
      Utilities.addClass(this.element, "Synesthesia_UILibrary_EnvelopePathsEditor");

      this.grid_underlay = new UILibrary.GridCanvas({
        width_sync: this.width_sync, height_sync: this.height_sync,
        x_min_sync: this.x_min_sync, x_max_sync: this.x_max_sync,
        y_min_sync: this.y_min_sync, y_max_sync: this.y_max_sync
      });

      var grid_element = this.grid_underlay.getElement();
        grid_element.style.position = "absolute";
        grid_element.style.top = "0px";
        grid_element.style.left = "0px";
      
      this.element.appendChild(grid_element);

      this.element.appendChild(this.selection_overlay);

      this.element.addEventListener("mousedown", this.handle_mousedown.bind(this));
      window.addEventListener("mousemove", this.handle_mousemove.bind(this));
      window.addEventListener("mouseup", this.handle_mouseup.bind(this));
    };

    EnvelopePathsEditor.prototype.handle_mousedown = function (e) {
      var element_page_position = Utilities.getPagePosition(this.element);
      var graph_x = e.pageX - element_page_position.left;
      var graph_y = e.pageY - element_page_position.top;

      var selectable_point = this.getSelectablePointWithinRadius({
        x: graph_x, y: graph_y,
        radius: this.selection_radius
      });

      if (!e.shiftKey && !this.selected_points.contains(selectable_point)) {
        this.selected_points.clear();
      }

      if (selectable_point) {
        this.selected_points.add(selectable_point);
      }

      this.selection_params = {
        start_x: graph_x, start_y: graph_y,
        last_x: graph_x, last_y: graph_y,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        start_point: selectable_point
      };

      this.draw();
    };

    EnvelopePathsEditor.prototype.handle_mousemove = function (e) {
      var element_page_position = Utilities.getPagePosition(this.element);
      var graph_x = e.pageX - element_page_position.left;
      var graph_y = e.pageY - element_page_position.top;

      // set up selection_map_stage
      this.selection_stage.clear();
      this.deselection_stage.clear();

      if (!this.selection_params) return;
      
      // Get the selectable point under the mouse if any.
      var selectable_point = this.getSelectablePointWithinRadius({
        x: graph_x, y: graph_y,
        radius: this.selection_radius
      });

      if (this.selection_params.altKey) {
        if (e.metaKey) {
          // If we are scaling the viewport.

          var d_x = graph_x - this.selection_params.last_x;
          var d_y = graph_y - this.selection_params.last_y;

          var scale_x = Math.pow(2, 1 - d_x / 100) / 2 - 1;
          var scale_y = Math.pow(2, 1 - d_y / 100) / 2 - 1;

          var x_range = this.x_max_sync.getValue() - this.x_min_sync.getValue();
          var y_range = this.y_max_sync.getValue() - this.y_min_sync.getValue();

          this.x_min_sync.setValue(this,
            this.x_min_sync.getValue() - x_range * scale_x
          );
          this.x_max_sync.setValue(this,
            this.x_max_sync.getValue() + x_range * scale_x
          );
          this.y_min_sync.setValue(this,
            this.y_min_sync.getValue() - y_range * scale_y
          );
          this.y_max_sync.setValue(this,
            this.y_max_sync.getValue() + y_range * scale_y
          );
        } else {
          // If we are panning the viewport.

          var d_x = graph_x - this.selection_params.last_x;
          var d_y = graph_y - this.selection_params.last_y;

          var use_path = this.paths[0]; // Use the first path to get coordinates from.
          var cur_origin_coords = this.display_map.get(use_path).convertToPathCoords({
            point: {x: 0, y: 0},
            width: this.width_sync.getValue(), height: this.height_sync.getValue(),
            x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
            y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
          });
          var cur_change_coords = this.display_map.get(use_path).convertToPathCoords({
            point: {x: d_x, y: d_y},
            width: this.width_sync.getValue(), height: this.height_sync.getValue(),
            x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
            y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
          });

          var path_d_x = cur_origin_coords.x - cur_change_coords.x;
          var path_d_y = cur_origin_coords.y - cur_change_coords.y;

          this.x_min_sync.setValue(this,
            this.x_min_sync.getValue() + path_d_x
          );
          this.x_max_sync.setValue(this,
            this.x_max_sync.getValue() + path_d_x
          );
          this.y_min_sync.setValue(this,
            this.y_min_sync.getValue() + path_d_y
          );
          this.y_max_sync.setValue(this,
            this.y_max_sync.getValue() + path_d_y
          );
        }
      } else {
        // If we are not changing the viewport.

        if (!this.selection_params.start_point) {
          // If we didn't start by mousedown on a point.

          // Draw the selection box.
          var overlay_ctx = this.selection_overlay.getContext("2d");
          overlay_ctx.save();
            overlay_ctx.clearRect(0, 0, this.selection_overlay.width, this.selection_overlay.height);

            overlay_ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            overlay_ctx.fillRect(
              this.selection_params.start_x - 0.5, this.selection_params.start_y - 0.5,
              graph_x - this.selection_params.start_x, graph_y - this.selection_params.start_y
            );

            overlay_ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            overlay_ctx.strokeRect(
              this.selection_params.start_x - 0.5, this.selection_params.start_y - 0.5,
              graph_x - this.selection_params.start_x, graph_y - this.selection_params.start_y
            );
          overlay_ctx.restore();

          if (!this.selection_params.shiftKey) {
            // If we aren't using shift selection.
            
            // Deselect all currently selected points.
            this.selected_points.clear();
          }

          // Find and stage the points within the box.
          this.selection_stage = this.getPointsWithinBoundsSet({
            x_min: Math.min(this.selection_params.start_x, graph_x), y_min: Math.min(this.selection_params.start_y, graph_y),
            x_max: Math.max(this.selection_params.start_x, graph_x), y_max: Math.max(this.selection_params.start_y, graph_y)
          });

          if (this.selection_params.shiftKey) {
            // If we are using shift selection.

            // Move already selected points that are within the selection
            // bounds to the deselect stage.
            var points_to_deselect = this.selection_stage.intersection(this.selected_points);
            this.selection_stage.removeAll(points_to_deselect.toArray());
            this.deselection_stage.addAll(points_to_deselect.toArray());
          }
        } else {
          // If we did start by mousing down on a point.

          var d_x = graph_x - this.selection_params.last_x;
          var d_y = graph_y - this.selection_params.last_y;

          var paths_set = new Utilities.Set();
            paths_set.addAll(this.paths);

          // Move the selected points.
          var selected_points_arr = this.selected_points.toArray();
          for (var point_ix = 0; point_ix < selected_points_arr.length; point_ix++) {
            var cur_point = selected_points_arr[point_ix];

            var point_paths_set = new Utilities.Set();
              point_paths_set.addAll(cur_point.getPaths());
            // Get the first path being displayed that this point is associated with.
            var cur_path = point_paths_set.intersection(paths_set).toArray()[0];

            var cur_origin_coords = this.display_map.get(cur_path).convertToPathCoords({
              point: {x: 0, y: 0},
              width: this.width_sync.getValue(), height: this.height_sync.getValue(),
              x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
              y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
            });
            var cur_change_coords = this.display_map.get(cur_path).convertToPathCoords({
              point: {x: d_x, y: d_y},
              width: this.width_sync.getValue(), height: this.height_sync.getValue(),
              x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
              y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
            });

            cur_point.setTime(cur_point.getTime() + (cur_change_coords.x - cur_origin_coords.x));
            cur_point.setValue(cur_point.getValue() + (cur_change_coords.y - cur_origin_coords.y));
          }

        }
      }

      if (selectable_point) {
        // If we're hovering over a point.

        // Stage the point.
        this.selection_stage.add(selectable_point);
      }
      
      // Update the last_x and last_y.
      this.selection_params.last_x = graph_x;
      this.selection_params.last_y = graph_y;

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

      if (this.selection_params && !this.selection_params.shiftKey && selectable_point && !this.selected_points.contains(selectable_point)) {
        // If they didn't push shift and we're clicking a point.

        // Select only that point.
        this.selected_points.clear();
        this.selected_points.add(selectable_point);
      } else {
        // Select the staged points.
        this.selected_points = this.selected_points.union(this.selection_stage).difference(this.deselection_stage);
      }
      this.selection_stage.clear();
      this.deselection_stage.clear();

      this.selection_params = null;
      this.draw();
    };

    EnvelopePathsEditor.prototype.addPath = function (new_path) {
      if (this.paths.indexOf(new_path) != -1) return;

      this.paths.push(new_path);

      var new_display = new UILibrary.EnvelopePathDisplay({
        width_sync: this.width_sync, height_sync: this.height_sync,
        x_min_sync: this.x_min_sync, x_max_sync: this.x_max_sync,
        y_min_sync: this.y_min_sync, y_max_sync: this.y_max_sync
      });
        new_display.setPath(new_path);
        new_display.getElement().style.position = "absolute";
        new_display.getElement().style.top = "0px";
        new_display.getElement().style.left = "0px";

      this.display_map.set(new_path, new_display);
      
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
    EnvelopePathsEditor.prototype.getPointsWithinBoundsSet = function (bounds) {
      var bounded_points_set = new Utilities.Set();
      for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
        var cur_path = this.paths[path_ix];

        var valid_points = [];

        var path_points = cur_path.getPoints();
        for (var point_ix = 0; point_ix < path_points.length; point_ix++) {
          var cur_point = path_points[point_ix];
          var cur_point_coords = this.display_map.get(cur_path).convertToDisplayCoords({
            point: {x: cur_point.getTime(), y: cur_point.getValue()},
            width: this.width_sync.getValue(), height: this.height_sync.getValue(),
            x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
            y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
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

        bounded_points_set.addAll(valid_points);
      }

      return bounded_points_set;
    };

    // point : {x: Number, y: Number, radius: Number}
    EnvelopePathsEditor.prototype.getSelectablePointWithinRadius = function (point) {
      var nearest_point = null;
      var nearest_point_distance = -1;

      for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
        var cur_path = this.paths[path_ix];

        var path_points = cur_path.getPoints();
        for (var point_ix = 0; point_ix < path_points.length; point_ix++) {
          var cur_point = path_points[point_ix];
          var cur_point_coords = this.display_map.get(cur_path).convertToDisplayCoords({
            point: {x: cur_point.getTime(), y: cur_point.getValue()},
            width: this.width_sync.getValue(), height: this.height_sync.getValue(),
            x_min: this.x_min_sync.getValue(), x_max: this.x_max_sync.getValue(),
            y_min: this.y_min_sync.getValue(), y_max: this.y_max_sync.getValue(),
          });

          var point_distance = Math.sqrt(Math.pow(point.x - cur_point_coords.x, 2) + Math.pow(point.y - cur_point_coords.y, 2));

          if (point_distance < point.radius) {
            if (nearest_point == null || point_distance < nearest_point_distance) {
              nearest_point = cur_point;
              nearest_point_distance = point_distance;
            }
          }
        }
      }

      return nearest_point;
    };

    EnvelopePathsEditor.prototype.draw = function () {
      this.grid_underlay.draw();

      var selected_points_arr = this.selected_points.union(this.selection_stage).difference(this.deselection_stage).toArray();
      for (var path_ix = 0; path_ix < this.paths.length; path_ix++) {
        var cur_path = this.paths[path_ix];

        var cur_display = this.display_map.get(cur_path);

        // Add points in the select map and stage.
        // Remove points in the deselect stage.
        var selected_points_for_path = selected_points_arr.filter(
          function (point) {
            return (point.getPaths().indexOf(cur_path) != -1);
          }
        );

        //cur_display.setSelectedPoints(selected_points_for_path);
        cur_display.clearPointsStyle(cur_path.getPoints());
        cur_display.setPointsStyle(selected_points_arr, {
          lineColor: "rgba(255, 192, 64, 1)",
          pointColor: "rgba(255, 192, 64, 1)"
        });

        cur_display.draw();
      }
    };

    return EnvelopePathsEditor;
  })();

  return UILibrary;
});
