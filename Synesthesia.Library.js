module("Synesthesia.Library",
["Utilities", "Synesthesia", "Synesthesia.Graph", "Synesthesia.UI"],
function () {

  var Utilities = require("Utilities");

  var Synesthesia = require("Synesthesia");

  Synesthesia.Library = {};

  Synesthesia.Library.MainOutput = (function () {
    function MainOutput (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Synesthesia.Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;

      this.setInputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ],
          direction: "input"
        })
      });

      this.setOutputDescriptors({});

      // MUST BE DEFINED AFTER ENDPOINTS
      this.ui_window = new Synesthesia.UI.NodeWindow({
        node: this,
        title: "Main Output"
      });
    }

    MainOutput.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.AudioDestinationNode()
    );

    MainOutput.prototype.getWindow = function () {
      return this.ui_window;
    };

    MainOutput.prototype.informConnected = function (endpoint, connection) {

    };

    MainOutput.prototype.informDisconnected = function (endpoint, connection) {

    };

    MainOutput.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.synesthesia.getDestination();
      }
    };

    MainOutput.prototype.informWindowPrepared = function (div) {

    };

    MainOutput.prototype.draw = function () {

    };

    return MainOutput;
  })();

  Synesthesia.Library.KeyboardInput = (function () {
    function KeyboardInput (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Synesthesia.Graph.Node.NoteSourceNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.notes = {};

      window.addEventListener("keydown", this.keydown.bind(this), false);
      window.addEventListener("keyup", this.keyup.bind(this), false);

      this.keyToFrequencyMapping = function (keyCode) {
        var frequencies = {
            /* bottom row */
            90: 261.626, // Z
            83: 277.183, // S
            88: 293.665, // X
            68: 311.127, // D
            67: 329.628, // C
            
            86: 349.228, // V
            71: 369.994, // G
            66: 391.995, // B
            72: 415.305, // H
            78: 440.000, // N
            74: 466.164, // J
            77: 493.883, // M
            
            188: 523.251, // comma
            76: 554.365, // L
            190: 587.330, // period
            186: 622.254, // semicolon
            191: 659.255, // slash
            
            /* top row */
            81: 523.251, // Q
            50: 554.365, // 2
            87: 587.330, // W
            51: 622.254, // 3
            69: 659.255, // E
            
            82: 698.456, // R
            53: 739.989, // 5
            84: 783.991, // T
            54: 830.609, // 6
            89: 880.000, // Y
            55: 932.328, // &
            85: 987.767, // U
            
            73: 1046.50, // I
            57: 1108.73, // 9
            79: 1174.66, // O
            48: 1244.51, // 0
            80: 1318.51 // P
        };

        return frequencies[keyCode];
      };

      this.setInputDescriptors({});

      this.setOutputDescriptors({
        "notes": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "notes",
          type: "notes",
          accepted_types: [
            "notes"
          ],
          direction: "output"
        })
      });

      // DEFINE LAST
      this.ui_window = new Synesthesia.UI.NodeWindow({
        node: this,
        title: "Keyboard"
      });
    }

    KeyboardInput.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.NoteSourceNode()
    );

    KeyboardInput.prototype.keydown = function (e) {
      if (this.notes["" + e.keyCode]) return;

      var frequency = this.keyToFrequencyMapping(e.keyCode);
      if (!frequency) return;

      var note = new Synesthesia.Note({
        frequency: frequency
      });

      this.notes["" + e.keyCode] = note;

      this.distributeNotes({
        source: this,
        on: [note]
      });
    };

    KeyboardInput.prototype.keyup = function (e) {
      if (!this.notes["" + e.keyCode]) return;

      this.distributeNotes({
        source: this,
        off: [this.notes["" + e.keyCode]]
      });

      delete this.notes["" + e.keyCode];
    };

    KeyboardInput.prototype.informConnected = function (endpoint, new_connection) {
      this.connectToNoteDestination(
        new_connection.getOppositeEndpoint(endpoint).getNode()
      );
    };

    KeyboardInput.prototype.informDisconnected = function (endpoint, rm_connection) {
      this.disconnectFromNoteDestination(
        rm_connection.getOppositeEndpoint(endpoint).getNode()
      );
    };

    KeyboardInput.prototype.getWindow = function () {
      return this.ui_window;
    };

    KeyboardInput.prototype.informWindowPrepared = function (div) {

    };

    KeyboardInput.prototype.draw = function () {

    };

    return KeyboardInput;
  })();

  Synesthesia.Library.Gain = (function () {
    function Gain (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Synesthesia.Graph.Node.AudioSourceNode.apply(this, arguments);
      Synesthesia.Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = this.context.createGainNode();

      this.gain_sync = new Utilities.SynchronizedValue();
      this.gain_sync.addListener(this, (function (new_value) {
        this.node.gain.value = new_value;
      }).bind(this));
      this.gain_sync.setValue(this, this.node.gain.value);

      this.setInputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ],
          direction: "input"
        }),
        "gain": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "gain",
          type: "AudioParam",
          accepted_types: [
            "AudioParam",
            "AudioNode"
          ],
          direction: "input"
        }),
      });

      this.setOutputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode",
            "AudioParam"
          ],
          direction: "output"
        })
      });

      // MUST BE DEFINED AFTER ENDPOINTS
      this.ui_window = new Synesthesia.UI.NodeWindow({
        node: this,
        title: "Gain",
        resizable: false,
        use_flex: false
      });
    }

    Gain.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.AudioSourceNode(),
      new Synesthesia.Graph.Node.AudioDestinationNode()
    );

    Gain.prototype.getWindow = function () {
      return this.ui_window;
    };

    Gain.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getInputDescriptors()["gain"]:
          return;
          // TODO: See informDisconnected.
          if (this.div.contains(this.range_dragger.getElement())) {
            this.range_dragger_replacement = document.createTextNode("<connected>");
            this.div.replaceChild(
              this.range_dragger_replacement,
              this.range_dragger.getElement()
            );
          }
          break;
        case this.getOutputDescriptors()["waveform"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.connectSourceToDestination(
            this.node,
            other_node.getDestinationForInput(other_endpoint)
          );
          break;
      }
    };

    Gain.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getInputDescriptors()["gain"]:
          return;
          // TODO: This isn't working because the gain input can take more than one node.
          if (this.div.contains(this.range_dragger_replacement)) {
            this.div.replaceChild(
              this.range_dragger.getElement(),
              this.range_dragger_replacement
            );
          }
          break;
        case this.getOutputDescriptors()["waveform"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.disconnectSourceFromDestination(
            this.node,
            other_node.getDestinationForInput(other_endpoint)
          );
          break;
      }
    };

    Gain.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
        case this.getInputDescriptors()["gain"]:
          return this.node.gain;
      }
    };

    Gain.prototype.setGain = function (value) {
      // TODO: Why?
      if (value < 0.01) {
        value = 0;
      }
      this.node.gain.setValueAtTime(value, 0);
    };

    Gain.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.gain_drag_value =  new Synesthesia.UI.DragValue({
        sync_value: this.gain_sync,
        min_value: this.node.gain.minValue,
        max_value: this.node.gain.maxValue,
        digits: 4,
        sensitivity: 0.0025,
        direction_lock: "vertical"
      });
      this.gain_sync.addListener(this.gain_drag_value, (function (new_value) {
        this.gain_drag_value.setValue(new_value);
      }).bind(this));


      this.drag_value_table = new Synesthesia.UI.DragValueTable({
        values: [
          { label: "Gain",
            drag_value: this.gain_drag_value
          }
        ]
      });

      var table_element = this.drag_value_table.getElement();
        table_element.style.width = "100%";
      this.div.appendChild(table_element);
    };

    Gain.prototype.draw = function () {
    };

    return Gain;
  })();

  Synesthesia.Library.Delay = (function () {
    function Delay (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Synesthesia.Graph.Node.AudioSourceNode.apply(this, arguments);
      Synesthesia.Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = this.context.createDelayNode();

      this.delayTime_sync = new Utilities.SynchronizedValue();
      this.delayTime_sync.addListener(this, (function (new_value) {
        this.node.delayTime.value = new_value;
      }).bind(this));
      this.delayTime_sync.setValue(this, this.node.delayTime.value);

      this.setInputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ],
          direction: "input"
        })
      });

      this.setOutputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode",
            "AudioParam"
          ],
          direction: "output"
        })
      });

      // MUST BE DEFINED AFTER ENDPOINTS
      this.ui_window = new Synesthesia.UI.NodeWindow({
        node: this,
        title: "Delay",
        resizable: false,
        use_flex: false
      });
    }

    Delay.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.AudioSourceNode(),
      new Synesthesia.Graph.Node.AudioDestinationNode()
    );

    Delay.prototype.getWindow = function () {
      return this.ui_window;
    };

    Delay.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["waveform"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.connectSourceToDestination(
            this.node,
            other_node.getDestinationForInput(other_endpoint)
          );
          break;
      }
    };

    Delay.prototype.informDisconnected = function (endpoint, connection) {
      // TODO: META: Is this still valid?
      // TODO: Disconnect disconnects all nodes!
      // Write into AudioNode a set of methods to handle this.
      // Map from node to node?
      // Call special AudioNode disconnect method with a destination node?
      switch (endpoint) {
        case this.getOutputDescriptors()["waveform"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.disconnectSourceFromDestination(
            this.node,
            other_node.getDestinationForInput(other_endpoint)
          );
          break;
      }
    };

    Delay.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
      }
    };

    Delay.prototype.setDelay = function (value) {
      if (value < 0.01) {
        value = 0;
      }
      this.node.delayTime.setValueAtTime(value, 0);
    };

    Delay.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.delayTime_drag_value = new Synesthesia.UI.DragValue({
        sync_value: this.delayTime_sync,
        min_value: this.node.delayTime.minValue,
        max_value: this.node.delayTime.maxValue,
        sensitivity: 0.0001,
        digits: 4,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "s";
        }
      });
      this.delayTime_sync.addListener(this.delayTime_drag_value, (function (new_value) {
        this.delayTime_drag_value.setValue(new_value);
      }).bind(this));

      var drag_value_table = new Synesthesia.UI.DragValueTable({
        values: [
          { label: "Time",
            drag_value: this.delayTime_drag_value
          }
        ]
      });

      var table_element = drag_value_table.getElement();
        table_element.style.width = "100%";

      this.div.appendChild(table_element);
    };

    Delay.prototype.draw = function () {

    };

    return Delay;
  })();

  Synesthesia.Library.BiquadFilter = (function () {
    function BiquadFilter (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Synesthesia.Graph.Node.AudioSourceNode.apply(this, arguments);
      Synesthesia.Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = this.context.createBiquadFilter();
      
      this.type = this.params.type || BiquadFilter.Type.LOWPASS;
      this.node.type = this.type;

      // Set up synchronizable values.

      this.frequency_sync = new Utilities.SynchronizedValue();
      this.frequency_sync.addListener(this, (function (new_value) {
        this.node.frequency.value = new_value;
        if (this.filter_graph) {
          this.filter_graph.draw();
        }
      }).bind(this));
      this.frequency_sync.setValue(this, this.node.frequency.value);

      this.Q_sync = new Utilities.SynchronizedValue();
      this.Q_sync.addListener(this, (function (new_value) {
        this.node.Q.value = new_value;
        if (this.filter_graph) {
          this.filter_graph.draw();
        }
      }).bind(this));
      this.Q_sync.setValue(this, this.node.Q.value);

      this.gain_sync = new Utilities.SynchronizedValue();
      this.gain_sync.addListener(this, (function (new_value) {
        this.node.gain.value = new_value;
        if (this.filter_graph) {
          this.filter_graph.draw();
        }
      }).bind(this));
      this.gain_sync.setValue(this, this.node.gain.value);

      // Set up endpoint descriptors.

      this.setInputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ],
          direction: "input"
        })
      });

      this.setOutputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode",
            "AudioParam"
          ],
          direction: "output"
        })
      });

      this.canvas = null;

      // MUST BE DEFINED AFTER ENDPOINTS
      this.ui_window = new Synesthesia.UI.NodeWindow({
        node: this,
        title: "Biquad Filter",
        use_flex: false,
        resizable: false
      });
    }

    BiquadFilter.Type = {
      LOWPASS: 0,
      HIGHPASS: 1,
      BANDPASS: 2,
      LOWSHELF: 3,
      HIGHSHELF: 4,
      PEAKING: 5,
      NOTCH: 6,
      ALLPASS: 7
    };

    BiquadFilter.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.AudioSourceNode(),
      new Synesthesia.Graph.Node.AudioDestinationNode()
    );

    BiquadFilter.prototype.getWindow = function () {
      return this.ui_window;
    };

    BiquadFilter.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["waveform"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.connectSourceToDestination(
            this.node,
            other_node.getDestinationForInput(other_endpoint)
          );
          break;
      }
    };

    BiquadFilter.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["waveform"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.disconnectSourceFromDestination(
            this.node,
            other_node.getDestinationForInput(other_endpoint)
          );
          break;
      }
    };

    BiquadFilter.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
      }
    };

    BiquadFilter.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.type_radio_group = new Synesthesia.UI.RadioGroup({
        options: [
          { label: "lowpass", value: BiquadFilter.Type.LOWPASS, selected: true },
          { label: "highpass", value: BiquadFilter.Type.HIGHPASS },
          { label: "bandpass", value: BiquadFilter.Type.BANDPASS },
          { label: "lowshelf", value: BiquadFilter.Type.LOWSHELF },
          { label: "highshelf", value: BiquadFilter.Type.HIGHSHELF },
          { label: "peaking", value: BiquadFilter.Type.PEAKING },
          { label: "notch", value: BiquadFilter.Type.NOTCH },
          { label: "allpass", value: BiquadFilter.Type.ALLPASS }
        ],
        callback_select: (function (selected_option) {
          this.type = selected_option.value;
          this.node.type = this.type;
          this.filter_graph.draw();
        }).bind(this)
      });

      // Maybe?
      this.type_radio_group.getElement().style.margin = "-1px -1px 1px -1px";

      this.div.appendChild(this.type_radio_group.getElement());

      this.frequency_drag_value = new Synesthesia.UI.DragValue({
        sync_value: this.frequency_sync,
        min_value: this.node.frequency.minValue,
        max_value: this.node.frequency.maxValue,
        sensitivity: 10,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "Hz";
        }
      });

      this.Q_drag_value = new Synesthesia.UI.DragValue({
        sync_value: this.Q_sync,
        min_value: this.node.Q.minValue,
        max_value: this.node.Q.maxValue,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.gain_drag_value = new Synesthesia.UI.DragValue({
        sync_value: this.gain_sync,
        min_value: this.node.gain.minValue,
        max_value: this.node.gain.maxValue,
        sensitivity: 0.05,
        digits: 2,
        direction_lock: "vertical"
      });

      this.drag_value_table = new Synesthesia.UI.DragValueTable({
        stack: "horizontal",
        values: [
          { label: "Frequency",
            drag_value: this.frequency_drag_value
          },
          { label: "Q factor",
            drag_value: this.Q_drag_value
          },
          { label: "Gain (dB)",
            drag_value: this.gain_drag_value
          }
        ]
      });
      var table_element = this.drag_value_table.getElement();
        table_element.style.width = "100%";
      this.div.appendChild(table_element);

      this.filter_graph = new Synesthesia.UI.ScalableGraph({
        x_min: 0, x_max: 22050,
        y_min: 0, y_max: 2,
        scale_x_func: function (x) {
          return Math.pow(22050, x);
        },
        scale_x_func_inv: function (x) {
          return Math.log(x + 1) / Math.log(22050);
        },
        scale_y_func: function (y) {
          return Math.pow(2, y);
        },
        scale_y_func_inv: function (y) {
          return Math.log(y + 1) / Math.log(2);
        },
        graph_function: (function (arr) {
          var frequencyHz = new Float32Array(arr);
          var magResponse = new Float32Array(arr.length);
          var phaseResponse = new Float32Array(arr.length);
          this.node.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
          return magResponse;
        }).bind(this)
      });
      this.filter_graph.setDimensions(400, 200);
      this.filter_graph.getElement().style.marginTop = "1px";
      this.filter_graph.getElement().style.borderTop = "1px solid #808080";

      this.div.appendChild(this.filter_graph.getElement());
    };

    BiquadFilter.prototype.draw = function () {
    };

    return BiquadFilter;
  })();

  Synesthesia.Library.Oscillator = (function () {
    function Oscillator (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Synesthesia.Graph.Node.NoteDestinationNode.apply(this, arguments);
      Synesthesia.Graph.Node.AudioSourceNode.apply(this, arguments);

      // BEGIN

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.destination = this.context.createGainNode();

      this.type = this.params.type || Oscillator.Type.SINE;

      this.osc_map = new Utilities.Map();

      this.setInputDescriptors({
        "notes": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "notes",
          type: "notes",
          accepted_types: [
            "notes"
          ],
          direction: "input"
        })/*,

        "frequency": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "frequency",
          type: "AudioParam",
          accepted_types: [
            "AudioParam",
            "AudioNode"
          ],
          direction: "input"
        }),

        "detune": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "detune",
          type: "AudioParam",
          accepted_types: [
            "AudioParam",
            "AudioNode"
          ],
          direction: "input"
        })
        */
      });

      this.setOutputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode",
            "AudioParam"
          ],
          direction: "output"
        })
      });

      // UI

      // MUST BE DEFINED AFTER ENDPOINTS
      this.ui_window = new Synesthesia.UI.NodeWindow({
        node: this,
        title: "Oscillator",
        width: 200, height: 51,
        min_width: 200, min_height: 51
      });
    }

    Oscillator.Type = {
      SINE: 0,
      SQUARE: 1,
      SAWTOOTH: 2,
      TRIANGLE: 3//,
      //CUSTOM: 4
    };

    Oscillator.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.NoteDestinationNode(),
      new Synesthesia.Graph.Node.AudioSourceNode()
    );

    // Synesthesia.Instrument

    Oscillator.prototype.handleNotes = function (notes) {
      /*
      Apply off notes first: if this node has connected
      nodes and the connection is removed, the catch
      for checking destination will prevent those notes
      from being turned off.
      */
      if (notes.off) {
        for (var off_ix = 0; off_ix < notes.off.length; off_ix++) {
          var cur_note = notes.off[off_ix];
          var cur_osc = this.osc_map.get(cur_note);
          if (!cur_osc) return;
          cur_osc.disconnect();
          this.osc_map.remove(cur_note);
          delete cur_osc;
        }
      }

      var destination = this.destination;
      if (!destination) return;

      if (notes.on) {
        for (var on_ix = 0; on_ix < notes.on.length; on_ix++) {
          var cur_note = notes.on[on_ix];
          var new_osc = this.context.createOscillator();
          new_osc.type = this.type;
          new_osc.frequency.setValueAtTime(cur_note.frequency, 0);
          new_osc.noteOn(0);
          new_osc.connect(destination);
          this.osc_map.set(cur_note, new_osc);
        }
      }
    };

    // Synesthesia.GraphNode

    Oscillator.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["waveform"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.connectSourceToDestination(
            this.destination,
            other_node.getDestinationForInput(other_endpoint)
          );
          break;
      }
    };

    Oscillator.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["waveform"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.disconnectSourceFromDestination(
            this.destination,
            other_node.getDestinationForInput(other_endpoint)
          );
          break;
      }
    };

    // Synesthesia.UI.Node

    Oscillator.prototype.getWindow = function () {
      return this.ui_window;
    };

    Oscillator.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.type_radio_group = new Synesthesia.UI.RadioGroup({
        options: [
          { label: "sine", value: Oscillator.Type.SINE, selected: true },
          { label: "square", value: Oscillator.Type.SQUARE },
          { label: "sawtooth", value: Oscillator.Type.SAWTOOTH },
          { label: "triangle", value: Oscillator.Type.TRIANGLE },
        ],
        callback_select: (function (selected_option) {
          this.type = selected_option.value;
        }).bind(this)
      });

      // Maybe?
      this.type_radio_group.getElement().style.margin = "-1px -1px 1px -1px";

      this.div.appendChild(this.type_radio_group.getElement());
    };

    Oscillator.prototype.draw = function () {

    };

    return Oscillator;
  })();

  // TODO: Write this! Good for debugging.
  Synesthesia.Library.Oscilloscope = (function () {
    function Oscilloscope (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Synesthesia.Graph.Node.AudioSourceNode.apply(this, arguments);
      Synesthesia.Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      // This feels pretty hacky... is there a better way?
      // Connect to a 0 gain node that is connected to the main out.
      // Effectively kills the sound but still causes AudioProcessingEvents to occur.
      this.audio_sink = this.context.createGainNode();
        this.audio_sink.gain.value = 0;
        this.audio_sink.connect(this.synesthesia.getDestination());
      this.node = this.context.createJavaScriptNode(2048);
        this.node.onaudioprocess = this.handle_AudioProcessingEvent.bind(this);
        this.node.connect(this.audio_sink);

      this.setInputDescriptors({
        "waveform": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode",
            "AudioParam"
          ],
          direction: "input"
        })
      });

      this.setOutputDescriptors({});

      this.channel_data = [];
      this.channel_colors = [
        "rgba(255, 0, 0, 1)",
        "rgba(0, 255, 0, 1)",
        "rgba(0, 0, 255, 1)",
        "rgba(255, 0, 255, 1)",
        "rgba(255, 255, 0, 1)",
        "rgba(0, 255, 255, 1)",
        "rgba(255, 255, 255, 1)",
        "rgba(255, 192, 192, 1)"
      ];

      this.canvas = document.createElement("canvas");
        this.canvas.width = 0;
        this.canvas.height = 0;
      this.context = this.canvas.getContext("2d");

      this.ui_window = new Synesthesia.UI.NodeWindow({
        node: this,
        title: "Oscilloscope"
      });
    }

    Oscilloscope.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.AudioSourceNode(),
      new Synesthesia.Graph.Node.AudioDestinationNode()
    );

    Oscilloscope.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
      }
    };

    Oscilloscope.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getInputDescriptors()["waveform"]:
          break;
      }
    };

    Oscilloscope.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getInputDescriptors()["waveform"]:
          break;
      }
    };

    Oscilloscope.prototype.getWindow = function () {
      return this.ui_window;
    };

    Oscilloscope.prototype.informWindowPrepared = function (div) {
      this.div = div;
        this.div.style.backgroundColor = "rgba(0, 0, 0, 1)";
      this.div.appendChild(this.canvas);
    };

    Oscilloscope.prototype.handle_AudioProcessingEvent = function (e) {
      if (this.context) {
        this.context.fillStyle = "rgba(0, 0, 0, 1)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      for (var channel_ix = 0; channel_ix < e.inputBuffer.numberOfChannels; channel_ix++) {
        if (!this.channel_data[channel_ix]) {
          this.channel_data[channel_ix] = [];
        }
        this.channel_data[channel_ix] = this.channel_data[channel_ix].concat(Array.prototype.slice.apply(e.inputBuffer.getChannelData(channel_ix)));
        if (this.channel_data[channel_ix].length > this.canvas.width) {
          this.channel_data[channel_ix].splice(
            0,
            this.channel_data[channel_ix].length - this.canvas.width
          );
        }

        e.outputBuffer.getChannelData(channel_ix).set(e.inputBuffer.getChannelData(channel_ix));

        if (this.context) {
          this.context.save();

            this.context.beginPath();

            for (var sample_ix = 0; sample_ix < this.channel_data[channel_ix].length; sample_ix++) {
              var cur_sample = this.channel_data[channel_ix][sample_ix];
              var true_y = (cur_sample + 1) / 2 * this.canvas.height;
              if (sample_ix == 0) {
                this.context.moveTo(sample_ix + 0.5, true_y);
              } else {
                this.context.lineTo(sample_ix + 0.5, true_y);
              }
            }
            
            this.context.strokeStyle = this.channel_colors[channel_ix % this.channel_colors.length];
            this.context.stroke();

          this.context.restore();
        }
      }
    };

    Oscilloscope.prototype.draw = function () {
      // Actual drawing stuff is handled in the AudioProcessingEvent handler.
      if (!this.div) return;

      if (this.canvas.width != parseInt(this.div.getAttribute("data-width"))) {
        this.canvas.width = parseInt(this.div.getAttribute("data-width"));
      }

      // Height doesn't seem to be computed properly with css flex-box yet?
      if (this.canvas.height != parseInt(this.div.getAttribute("data-height"))) {
        this.canvas.height = parseInt(this.div.getAttribute("data-height"));
      }
    };

    return Oscilloscope;
  })();

});
