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
        title: "Gain"
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
      if (value < 0.01) {
        value = 0;
      }
      this.node.gain.setValueAtTime(value, 0);
    };

    Gain.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.range_dragger = new Synesthesia.UI.DragValue({
        value: this.node.gain.value,
        min_value: this.node.gain.minValue,
        max_value: this.node.gain.maxValue,
        digits: 3,
        sensitivity: 0.005,
        direction_lock: "vertical",
        callback: (function (value) {
          this.setGain(value);
        }).bind(this)
      });
      //this.range_dragger.getElement().style.fontSize = "20px";
      this.div.appendChild(
        this.range_dragger.getElement()
      );
    };

    Gain.prototype.draw = function () {
      // TODO: This should handle the case that the audio param is connected.
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
        title: "Delay"
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

      this.range_dragger = new Synesthesia.UI.DragValue({
        value: this.node.delayTime.value,
        min_value: this.node.delayTime.minValue,
        max_value: this.node.delayTime.maxValue,
        sensitivity: 0.001,
        digits: 3,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "s";
        },
        callback: (function (value) {
          this.setDelay(value);
        }).bind(this)
      });
      var dragger_element = this.range_dragger.getElement();
      //dragger_element.style.fontSize = "20px";
      this.div.appendChild(
        this.range_dragger.getElement()
      );
    };

    Delay.prototype.draw = function () {

    };

    return Delay;
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
            "AudioParam"
          ],
          direction: "input"
        }),

        "detune": new Synesthesia.Graph.Endpoint({
          node: this,
          name: "detune",
          type: "AudioParam",
          accepted_types: [
            "AudioParam"
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
        title: "Oscillator"
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
        default:
          console.warn(endpoint);
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

      // TEST
      this.type_select = document.createElement("select");
        for (var type_name in Oscillator.Type) {
          if (!Oscillator.Type.hasOwnProperty(type_name)) continue;
          var new_type = document.createElement("option");
            new_type.innerHTML = type_name;
            new_type.value = Oscillator.Type[type_name];
          this.type_select.appendChild(new_type);
        }
        this.type_select.addEventListener("change", (function () {
          this.type = parseInt(this.type_select.item(this.type_select.selectedIndex).value);
        }).bind(this), false);
      this.div.appendChild(this.type_select);

      this.div.appendChild(
        document.createElement("br")
      );
      
      this.canvas = document.createElement("canvas");
        this.canvas.width = "300";
        this.canvas.height = "300";
      this.div.appendChild(this.canvas);
    };

    Oscillator.prototype.draw = function () {
      var ctx = this.canvas.getContext("2d");

      ctx.save();

        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        var notes = this.osc_map.getKeys();
        for (var i = 0; i < notes.length; i++) {
          ctx.beginPath();
          ctx.arc(
            this.canvas.width / 2, this.canvas.height / 2,
            notes[i].frequency / 10,
            0, 2 * Math.PI
          );
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.stroke();
        }

      ctx.restore();
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
        "rgba(192, 192, 192, 1)"
      ];

      this.canvas = document.createElement("canvas");
        this.canvas.width = 640;
        this.canvas.height = 480;
      this.context = this.canvas.getContext("2d");

      this.ui_window = new Synesthesia.UI.NodeWindow({
        node: this,
        title: "Oscilloscope",
        max_width: 640, max_height: 498
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
                this.context.moveTo(sample_ix, true_y);
              } else {
                this.context.lineTo(sample_ix, true_y);
              }
            }
            
            this.context.strokeStyle = this.channel_colors[channel_ix % this.channel_colors.length];
            this.context.stroke();

          this.context.restore();
        }
      }
    };

    Oscilloscope.prototype.draw = function () {
      // Drawing is done in handle_AudioProcessingEvent.
    };

    return Oscilloscope;
  })();

});
