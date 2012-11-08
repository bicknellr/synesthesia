module.declare("Synesthesia:NodeLibrary",
["Utilities", "Synesthesia:Graph", "Synesthesia:UILibrary", "Synesthesia:WindowSystem", "Synesthesia:Envelope"],
function () {

  var Utilities = module.require("Utilities");

  var Graph = module.require("Synesthesia:Graph");
  var UILibrary = module.require("Synesthesia:UILibrary");
  var WindowSystem = module.require("Synesthesia:WindowSystem");

  var Envelope = module.require("Synesthesia:Envelope");

  var NodeLibrary = {};

  NodeLibrary.MainOutput = (function () {
    function MainOutput (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;

      this.setInputDescriptors({
        "waveform": new Graph.Endpoint({
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
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Main Output",
        draw_callback: this.draw.bind(this)
      });
    }

    MainOutput.prototype = Utilities.extend(
      new Graph.Node.AudioDestinationNode()
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

  NodeLibrary.KeyboardInput = (function () {
    function KeyboardInput (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.NoteSourceNode.apply(this, arguments);

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
        "notes": new Graph.Endpoint({
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
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Keyboard",
        draw_callback: this.draw.bind(this)
      });
    }

    KeyboardInput.prototype = Utilities.extend(
      new Graph.Node.NoteSourceNode()
    );

    KeyboardInput.prototype.keydown = function (e) {
      if (this.notes["" + e.keyCode]) return;

      var frequency = this.keyToFrequencyMapping(e.keyCode);
      if (!frequency) return;

      var note = new Envelope.Note({
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

  NodeLibrary.KeyboardInputNumbers = (function () {
    function KeyboardInputNumbers (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.notes = {};

      window.addEventListener("keydown", this.keydown.bind(this), false);
      window.addEventListener("keyup", this.keyup.bind(this), false);

      this.setInputDescriptors({});

      this.setOutputDescriptors({
        "keydown": new Graph.Endpoint({
          node: this,
          name: "keydown",
          type: "Number",
          flow: "active",
          accepted_types: [
            "Number"
          ],
          direction: "output"
        }),

        "keyup": new Graph.Endpoint({
          node: this,
          name: "keyup",
          type: "Number",
          flow: "active",
          accepted_types: [
            "Number"
          ],
          direction: "output"
        })
      });

      // DEFINE LAST
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Keyboard [Raw]",
        draw_callback: this.draw.bind(this)
      });
    }

    KeyboardInputNumbers.prototype = Utilities.extend(
      new Graph.Node()
    );

    KeyboardInputNumbers.prototype.getWindow = function () {
      return this.ui_window;
    };

    KeyboardInputNumbers.prototype.informConnected = function (endpoint, new_connection) {
    };

    KeyboardInputNumbers.prototype.informDisconnected = function (endpoint, rm_connection) {
    };

    KeyboardInputNumbers.prototype.informWindowPrepared = function (div) {
    };

    KeyboardInputNumbers.prototype.draw = function () {
    };

    KeyboardInputNumbers.prototype.keydown = function (e) {
      this.getOutputDescriptors()["keydown"].initiateFlow(e.keyCode);
    };

    KeyboardInputNumbers.prototype.keyup = function (e) {
      this.getOutputDescriptors()["keyup"].initiateFlow(e.keyCode);
    };

    return KeyboardInputNumbers;
  })();

  NodeLibrary.LiveInput = (function () {
    function LiveInput (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = null;
      if (this.context.createGain) {
        this.node = this.context.createGain();
      } else if (this.context.createGainNode) {
        this.node = this.context.createGainNode();
      }

      this.audio_stream = null;

      this.setInputDescriptors({
      });

      this.setOutputDescriptors({
        "waveform": new Graph.Endpoint({
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
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Live Input",
        draw_callback: this.draw.bind(this),
        resizable: false,
        use_flex: false
      });
    }

    LiveInput.prototype = Utilities.extend(
      new Graph.Node.AudioSourceNode()
    );

    LiveInput.prototype.getWindow = function () {
      return this.ui_window;
    };

    LiveInput.prototype.informConnected = function (endpoint, connection) {
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

    LiveInput.prototype.informDisconnected = function (endpoint, connection) {
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

    LiveInput.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
      }
    };

    LiveInput.prototype.connectStream = function () {
      navigator.webkitGetUserMedia({audio: true},
        (function (stream) {
          this.audio_stream = this.context.createMediaStreamSource(stream);
          this.audio_stream.connect(this.node);
        }).bind(this),
        function (err) {
          console.error("NodeLibrary.LiveInput: Could not get media stream.");
          console.error(err);
        }
      );
    };

    LiveInput.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.connect_button = document.createElement("button");
        this.connect_button.appendChild(document.createTextNode("connect"));
        this.connect_button.addEventListener("click", this.connectStream.bind(this), false);

      this.div.appendChild(this.connect_button);
    };

    LiveInput.prototype.draw = function () {
    };

    return LiveInput;
  })();

  NodeLibrary.FileStream = (function () {
    function FileStream (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = null;
      if (this.context.createGain) {
        this.node = this.context.createGain();
      } else if (this.context.createGainNode) {
        this.node = this.context.createGainNode();
      }

      this.audio_stream = null;

      this.setInputDescriptors({
      });

      this.setOutputDescriptors({
        "waveform": new Graph.Endpoint({
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
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "File",
        draw_callback: this.draw.bind(this),
        resizable: false,
        use_flex: false
      });
    }

    FileStream.prototype = Utilities.extend(
      new Graph.Node.AudioSourceNode()
    );

    FileStream.prototype.getWindow = function () {
      return this.ui_window;
    };

    FileStream.prototype.informConnected = function (endpoint, connection) {
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

    FileStream.prototype.informDisconnected = function (endpoint, connection) {
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

    FileStream.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
      }
    };

    FileStream.prototype.handle_change = function (e) {
      var file_url = URL.createObjectURL(this.fileselect_element.files[0]);
      this.audio_element.setAttribute("src", file_url);
      this.audio_element.addEventListener("loadeddata", (function () {
        if (!this.mediaelementsource_node) {
          this.mediaelementsource_node = this.context.createMediaElementSource(this.audio_element);
          this.mediaelementsource_node.connect(this.node);
        }
      }).bind(this));
    };

    FileStream.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.fileselect_element = document.createElement("input");
        this.fileselect_element.setAttribute("type", "file");
        this.fileselect_element.setAttribute("multiple", "false");
        this.fileselect_element.style.display = "block";
        this.fileselect_element.addEventListener("change", this.handle_change.bind(this), false);
      this.div.appendChild(this.fileselect_element);

      this.div.appendChild(document.createElement("br"));

      this.audio_element = new Audio();
        this.audio_element.setAttribute("controls", true);
      this.div.appendChild(this.audio_element);
    };

    FileStream.prototype.draw = function () {
    };

    return FileStream;
  })();

  NodeLibrary.Gain = (function () {
    function Gain (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);
      Graph.Node.AudioDestinationNode.apply(this, arguments);
      Graph.Node.AudioParamProviderNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = null;
      if (this.context.createGain) {
        this.node = this.context.createGain();
      } else if (this.context.createGainNode) {
        this.node = this.context.createGainNode();
      }

      this.gain_sync = new Utilities.SynchronizedValue();
      this.gain_sync.addListener(this, (function (new_value) {
        this.node.gain.value = new_value;
      }).bind(this));
      this.gain_sync.setValue(this, this.node.gain.value);

      this.setInputDescriptors({
        "waveform": new Graph.Endpoint({
          node: this,
          name: "waveform",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ],
          direction: "input"
        }),
        "gain": new Graph.Endpoint({
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
        "waveform": new Graph.Endpoint({
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
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Gain",
        draw_callback: this.draw.bind(this),
        resizable: false,
        use_flex: false
      });
    }

    Gain.prototype = Utilities.extend(
      new Graph.Node.AudioSourceNode(),
      new Graph.Node.AudioDestinationNode(),
      new Graph.Node.AudioParamProviderNode()
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

    Gain.prototype.getAudioParamForEndpoint = function (endpoint) {
      switch (endpoint) {
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

      this.gain_drag_value =  new UILibrary.DragValue({
        sync_value: this.gain_sync,
        min_value: this.node.gain.minValue,
        max_value: this.node.gain.maxValue,
        digits: 4,
        sensitivity: 0.0025,
        direction_lock: "vertical"
      });

      this.drag_value_table = new UILibrary.DragValueTable({
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

  NodeLibrary.Delay = (function () {
    function Delay (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);
      Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = null;
      if (this.context.createDelay) {
        this.node = this.context.createDelay();
      } else if (this.context.createDelayNode) {
        this.node = this.context.createDelayNode();
      }

      this.delayTime_sync = new Utilities.SynchronizedValue();
      this.delayTime_sync.addListener(this, (function (new_value) {
        this.node.delayTime.value = new_value;
      }).bind(this));
      this.delayTime_sync.setValue(this, this.node.delayTime.value);

      this.setInputDescriptors({
        "waveform": new Graph.Endpoint({
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
        "waveform": new Graph.Endpoint({
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
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Delay",
        draw_callback: this.draw.bind(this),
        resizable: false,
        use_flex: false
      });
    }

    Delay.prototype = Utilities.extend(
      new Graph.Node.AudioSourceNode(),
      new Graph.Node.AudioDestinationNode()
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

      this.delayTime_drag_value = new UILibrary.DragValue({
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

      var drag_value_table = new UILibrary.DragValueTable({
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

  NodeLibrary.DynamicsCompressor = (function () {
    function DynamicsCompressor (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);
      Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = this.context.createDynamicsCompressor();

      this.threshold_sync = new Utilities.SynchronizedValue();
      this.threshold_sync.addListener(this, (function (new_value) {
        this.node.threshold.value = new_value;
      }).bind(this));
      this.threshold_sync.setValue(this, this.node.threshold.value);

      this.knee_sync = new Utilities.SynchronizedValue();
      this.knee_sync.addListener(this, (function (new_value) {
        this.node.knee.value = new_value;
      }).bind(this));
      this.knee_sync.setValue(this, this.node.knee.value);

      this.ratio_sync = new Utilities.SynchronizedValue();
      this.ratio_sync.addListener(this, (function (new_value) {
        this.node.ratio.value = new_value;
      }).bind(this));
      this.ratio_sync.setValue(this, this.node.ratio.value);

      this.reduction_sync = new Utilities.SynchronizedValue();
      this.reduction_sync.addListener(this, (function (new_value) {
        this.node.reduction.value = new_value;
      }).bind(this));
      this.reduction_sync.setValue(this, this.node.reduction.value);

      this.attack_sync = new Utilities.SynchronizedValue();
      this.attack_sync.addListener(this, (function (new_value) {
        this.node.attack.value = new_value;
      }).bind(this));
      this.attack_sync.setValue(this, this.node.attack.value);

      this.release_sync = new Utilities.SynchronizedValue();
      this.release_sync.addListener(this, (function (new_value) {
        this.node.release.value = new_value;
      }).bind(this));
      this.release_sync.setValue(this, this.node.release.value);

      this.setInputDescriptors({
        "waveform": new Graph.Endpoint({
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
        "waveform": new Graph.Endpoint({
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
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Dynamics Compressor",
        draw_callback: this.draw.bind(this),
        resizable: false,
        width: 400, height: 70
      });
    }

    DynamicsCompressor.prototype = Utilities.extend(
      new Graph.Node.AudioSourceNode(),
      new Graph.Node.AudioDestinationNode()
    );

    DynamicsCompressor.prototype.getWindow = function () {
      return this.ui_window;
    };

    DynamicsCompressor.prototype.informConnected = function (endpoint, connection) {
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

    DynamicsCompressor.prototype.informDisconnected = function (endpoint, connection) {
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

    DynamicsCompressor.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
      }
    };

    DynamicsCompressor.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.threshold_drag_value = new UILibrary.DragValue({
        sync_value: this.threshold_sync,
        min_value: this.node.threshold.minValue,
        max_value: this.node.threshold.maxValue,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "dB";
        }
      });

      this.knee_drag_value = new UILibrary.DragValue({
        sync_value: this.knee_sync,
        min_value: this.node.knee.minValue,
        max_value: this.node.knee.maxValue,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "dB";
        }
      });

      this.ratio_drag_value = new UILibrary.DragValue({
        sync_value: this.ratio_sync,
        min_value: this.node.ratio.minValue,
        max_value: this.node.ratio.maxValue,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      var drag_value_table_r1 = new UILibrary.DragValueTable({
        stack: "horizontal",
        values: [
          { label: "Threshold",
            drag_value: this.threshold_drag_value
          },
          { label: "Knee",
            drag_value: this.knee_drag_value
          },
          { label: "Ratio",
            drag_value: this.ratio_drag_value
          }
        ]
      });
      drag_value_table_r1.getElement().style.width = "100%";
      this.div.appendChild(drag_value_table_r1.getElement());

      this.reduction_drag_value = new UILibrary.DragValue({
        sync_value: this.reduction_sync,
        min_value: this.node.reduction.minValue,
        max_value: this.node.reduction.maxValue,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "dB";
        }
      });

      this.attack_drag_value = new UILibrary.DragValue({
        sync_value: this.attack_sync,
        min_value: this.node.attack.minValue,
        max_value: this.node.attack.maxValue,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "s";
        }
      });

      this.release_drag_value = new UILibrary.DragValue({
        sync_value: this.release_sync,
        min_value: this.node.release.minValue,
        max_value: this.node.release.maxValue,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "s";
        }
      });

      var drag_value_table_r2 = new UILibrary.DragValueTable({
        stack: "horizontal",
        values: [
          { label: "Reduction",
            drag_value: this.reduction_drag_value
          },
          { label: "Attack",
            drag_value: this.attack_drag_value
          },
          { label: "Release",
            drag_value: this.release_drag_value
          }
        ]
      });
      drag_value_table_r2.getElement().style.width = "100%";
      this.div.appendChild(drag_value_table_r2.getElement());
    };

    DynamicsCompressor.prototype.draw = function () {

    };

    return DynamicsCompressor;
  })();

  NodeLibrary.Panner = (function () {
    function Panner (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);
      Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();
      this.node = this.context.createPanner();

      // AudioParams

      this.coneGain_sync = new Utilities.SynchronizedValue();
      this.coneGain_sync.addListener(this, (function (new_value) {
        this.node.coneGain.value = new_value;
      }).bind(this));
      this.coneGain_sync.setValue(this, this.node.coneGain);

      this.distanceGain_sync = new Utilities.SynchronizedValue();
      this.distanceGain_sync.addListener(this, (function (new_value) {
        this.node.distanceGain.value = new_value;
      }).bind(this));
      this.distanceGain_sync.setValue(this, this.node.distanceGain);

      // Physics attributes.

      this.positionX_sync = new Utilities.SynchronizedValue();
      this.positionX_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          new_value,
          this.positionY_sync.getValue(),
          this.positionZ_sync.getValue()
        );
      }).bind(this));
      this.positionX_sync.setValue(this, 0);

      this.positionY_sync = new Utilities.SynchronizedValue();
      this.positionY_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          this.positionX_sync.getValue(),
          new_value,
          this.positionZ_sync.getValue()
        );
      }).bind(this));
      this.positionY_sync.setValue(this, 0);

      this.positionZ_sync = new Utilities.SynchronizedValue();
      this.positionZ_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          this.positionX_sync.getValue(),
          this.positionY_sync.getValue(),
          new_value
        );
      }).bind(this));
      this.positionZ_sync.setValue(this, 0);

      this.orientationX_sync = new Utilities.SynchronizedValue();
      this.orientationX_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          new_value,
          this.orientationY_sync.getValue(),
          this.orientationZ_sync.getValue()
        );
      }).bind(this));
      this.orientationX_sync.setValue(this, 0);

      this.orientationY_sync = new Utilities.SynchronizedValue();
      this.orientationY_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          this.orientationX_sync.getValue(),
          new_value,
          this.orientationZ_sync.getValue()
        );
      }).bind(this));
      this.orientationY_sync.setValue(this, 0);

      this.orientationZ_sync = new Utilities.SynchronizedValue();
      this.orientationZ_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          this.orientationX_sync.getValue(),
          this.orientationY_sync.getValue(),
          new_value
        );
      }).bind(this));
      this.orientationZ_sync.setValue(this, 0);

      this.velocityX_sync = new Utilities.SynchronizedValue();
      this.velocityX_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          new_value,
          this.velocityY_sync.getValue(),
          this.velocityZ_sync.getValue()
        );
      }).bind(this));
      this.velocityX_sync.setValue(this, 0);

      this.velocityY_sync = new Utilities.SynchronizedValue();
      this.velocityY_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          this.velocityX_sync.getValue(),
          new_value,
          this.velocityZ_sync.getValue()
        );
      }).bind(this));
      this.velocityY_sync.setValue(this, 0);

      this.velocityZ_sync = new Utilities.SynchronizedValue();
      this.velocityZ_sync.addListener(this, (function (new_value) {
        this.node.setPosition(
          this.velocityX_sync.getValue(),
          this.velocityY_sync.getValue(),
          new_value
        );
      }).bind(this));
      this.velocityZ_sync.setValue(this, 0);

      // Models

      this.panningModel_sync = new Utilities.SynchronizedValue();
      this.panningModel_sync.addListener(this, (function (new_value) {
        this.node.panningModel = new_value;
      }).bind(this));
      this.panningModel_sync.setValue(this, this.node.panningModel);

      this.distanceModel_sync = new Utilities.SynchronizedValue();
      this.distanceModel_sync.addListener(this, (function (new_value) {
        this.node.distanceModel = new_value;
      }).bind(this));
      this.distanceModel_sync.setValue(this, this.node.distanceModel);

      // Distance Parameters

      this.refDistance_sync = new Utilities.SynchronizedValue();
      this.refDistance_sync.addListener(this, (function (new_value) {
        this.node.refDistance = new_value;
      }).bind(this));
      this.refDistance_sync.setValue(this, this.node.refDistance);

      this.maxDistance_sync = new Utilities.SynchronizedValue();
      this.maxDistance_sync.addListener(this, (function (new_value) {
        this.node.maxDistance = new_value;
      }).bind(this));
      this.maxDistance_sync.setValue(this, this.node.maxDistance);

      this.rolloffFactor_sync = new Utilities.SynchronizedValue();
      this.rolloffFactor_sync.addListener(this, (function (new_value) {
        this.node.rolloffFactor = new_value;
      }).bind(this));
      this.rolloffFactor_sync.setValue(this, this.node.rolloffFactor);

      // Cone Parameters

      this.coneInnerAngle_sync = new Utilities.SynchronizedValue();
      this.coneInnerAngle_sync.addListener(this, (function (new_value) {
        this.node.coneInnerAngle = new_value;
      }).bind(this));
      this.coneInnerAngle_sync.setValue(this, this.node.coneInnerAngle);

      this.coneOuterAngle_sync = new Utilities.SynchronizedValue();
      this.coneOuterAngle_sync.addListener(this, (function (new_value) {
        this.node.coneOuterAngle = new_value;
      }).bind(this));
      this.coneOuterAngle_sync.setValue(this, this.node.coneOuterAngle);

      this.coneOuterGain_sync = new Utilities.SynchronizedValue();
      this.coneOuterGain_sync.addListener(this, (function (new_value) {
        this.node.coneOuterGain = new_value;
      }).bind(this));
      this.coneOuterGain_sync.setValue(this, this.node.coneOuterGain);

      // Endpoint Descriptors

      this.setInputDescriptors({
        "waveform": new Graph.Endpoint({
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
        "waveform": new Graph.Endpoint({
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

      // NodeWindow

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Panner",
        draw_callback: this.draw.bind(this),
        resizable: false,
        use_flex: false
      });
    }

    Panner.PanningModel = {
      EQUALPOWER: 0,
      HRTF: 1,
      SOUNDFIELD: 2
    };

    Panner.DistanceModel = {
      LINEAR_DISTANCE: 0,
      INVERSE_DISTANCE: 1,
      EXPONENTIAL_DISTANCE: 2
    };

    Panner.prototype = Utilities.extend(
      new Graph.Node.AudioSourceNode(),
      new Graph.Node.AudioDestinationNode()
    );

    Panner.prototype.getWindow = function () {
      return this.ui_window;
    };

    Panner.prototype.setPanningModel = function (panning_model) {
      this.node.panningModel = panning_model;
    };

    Panner.prototype.setDistanceModel = function (distance_model) {
      this.node.distanceModel = distance_model;
    };

    Panner.prototype.informConnected = function (endpoint, connection) {
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

    Panner.prototype.informDisconnected = function (endpoint, connection) {
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

    Panner.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
      }
    };

    Panner.prototype.informWindowPrepared = function (div) {
      this.div = div;
      this.div.style.width = "300px";

      // Panning model.

      this.panningModel_radiogroup = new UILibrary.RadioGroup({
        options: [
          { label: "Equal Power", value: Panner.PanningModel.EQUALPOWER },
          { label: "HRTF", value: Panner.PanningModel.HRTF, selected: true },
          /* NOT SUPPORTED YET
          { label: "Soundfield", value: Panner.PanningModel.SOUNDFIELD },
          */
        ],
        callback_select: (function (selected_option) {
          this.panningModel_sync.setValue(null, selected_option.value);
        }).bind(this)
      });

      this.panningModel_labeleddiv = new UILibrary.LabeledDiv({
        label: "Panning Model",
        content: this.panningModel_radiogroup.getElement()
      });
      this.div.appendChild(this.panningModel_labeleddiv.getElement());
      
      // Distance model.

      this.distanceModel_radiogroup = new UILibrary.RadioGroup({
        options: [
          { label: "Linear", value: Panner.DistanceModel.LINEAR_DISTANCE },
          { label: "Inverse", value: Panner.DistanceModel.INVERSE_DISTANCE, selected: true },
          { label: "Exponential", value: Panner.DistanceModel.EXPONENTIAL_DISTANCE },
        ],
        callback_select: (function (selected_option) {
          this.distanceModel_sync.setValue(null, selected_option.value);
        }).bind(this)
      });

      this.distanceModel_labeleddiv = new UILibrary.LabeledDiv({
        label: "Distance Model",
        content: this.distanceModel_radiogroup.getElement()
      });
      this.div.appendChild(this.distanceModel_labeleddiv.getElement());

      // Distance model parameters.

      this.refDistance_drag_value = new UILibrary.DragValue({
        sync_value: this.refDistance_sync,
        min_value: 0,
        max_value: 10,
        sensitivity: 0.1,
        digits: 2,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "m";
        }
      });

      this.maxDistance_drag_value = new UILibrary.DragValue({
        sync_value: this.maxDistance_sync,
        min_value: 0,
        max_value: 10,
        sensitivity: 0.1,
        digits: 2,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "m";
        }
      });

      this.rolloffFactor_drag_value = new UILibrary.DragValue({
        sync_value: this.rolloffFactor_sync,
        min_value: 0,
        max_value: 10,
        sensitivity: 0.1,
        digits: 2,
        direction_lock: "vertical"
      });

      this.distance_dragvaluetable = new UILibrary.DragValueTable({
        stack: "horizontal",
        values: [
          { label: "RefDist",
            drag_value: this.refDistance_drag_value
          },
          { label: "MaxDist",
            drag_value: this.maxDistance_drag_value
          },
          { label: "Rolloff",
            drag_value: this.rolloffFactor_drag_value
          }
        ]
      });
      this.distance_dragvaluetable.getElement().style.width = "100%";

      this.distance_labeleddiv = new UILibrary.LabeledDiv({
        label: "Distance Parameters",
        content: this.distance_dragvaluetable.getElement()
      });
      this.div.appendChild(this.distance_labeleddiv.getElement());

      // Cone parameters.

      this.coneInnerAngle_drag_value = new UILibrary.DragValue({
        sync_value: this.coneInnerAngle_sync,
        min_value: 0,
        max_value: 360,
        sensitivity: 1,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "&deg;";
        }
      });

      this.coneOuterAngle_drag_value = new UILibrary.DragValue({
        sync_value: this.coneOuterAngle_sync,
        min_value: 0,
        max_value: 360,
        sensitivity: 1,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "&deg;";
        }
      });

      this.coneOuterGain_drag_value = new UILibrary.DragValue({
        sync_value: this.coneOuterGain_sync,
        min_value: 0,
        max_value: 5,
        sensitivity: 0.001,
        digits: 3,
        direction_lock: "vertical"
      });

      this.cone_dragvaluetable = new UILibrary.DragValueTable({
        stack: "horizontal",
        values: [
          { label: "Inner",
            drag_value: this.coneInnerAngle_drag_value
          },
          { label: "Outer",
            drag_value: this.coneOuterAngle_drag_value
          },
          { label: "Gain",
            drag_value: this.coneOuterGain_drag_value
          }
        ]
      });
      this.cone_dragvaluetable.getElement().style.width = "100%";

      this.cone_labeleddiv = new UILibrary.LabeledDiv({
        label: "Cone Parameters",
        content: this.cone_dragvaluetable.getElement()
      });
      this.div.appendChild(this.cone_labeleddiv.getElement());

      // Position.

      this.positionX_drag_value = new UILibrary.DragValue({
        sync_value: this.positionX_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.positionY_drag_value = new UILibrary.DragValue({
        sync_value: this.positionY_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.positionZ_drag_value = new UILibrary.DragValue({
        sync_value: this.positionZ_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.position_dragvaluetable = new UILibrary.DragValueTable({
        stack: "horizontal",
        values: [
          { label: "X",
            drag_value: this.positionX_drag_value
          },
          { label: "Y",
            drag_value: this.positionY_drag_value
          },
          { label: "Z",
            drag_value: this.positionZ_drag_value
          }
        ]
      });
      this.position_dragvaluetable.getElement().style.width = "100%";

      this.position_labeleddiv = new UILibrary.LabeledDiv({
        label: "Position",
        content: this.position_dragvaluetable.getElement()
      })
      this.div.appendChild(this.position_labeleddiv.getElement());

      // Orienation.

      this.orientationX_drag_value = new UILibrary.DragValue({
        sync_value: this.orientationX_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.orientationY_drag_value = new UILibrary.DragValue({
        sync_value: this.orientationY_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.orientationZ_drag_value = new UILibrary.DragValue({
        sync_value: this.orientationZ_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.orientation_dragvaluetable = new UILibrary.DragValueTable({
        stack: "horizontal",
        values: [
          { label: "X",
            drag_value: this.orientationX_drag_value
          },
          { label: "Y",
            drag_value: this.orientationY_drag_value
          },
          { label: "Z",
            drag_value: this.orientationZ_drag_value
          }
        ]
      });
      this.orientation_dragvaluetable.getElement().style.width = "100%";

      this.orientation_labeleddiv = new UILibrary.LabeledDiv({
        label: "Orientation",
        content: this.orientation_dragvaluetable.getElement()
      });
      this.div.appendChild(this.orientation_labeleddiv.getElement());

      // Velocity.

      this.velocityX_drag_value = new UILibrary.DragValue({
        sync_value: this.velocityX_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.velocityY_drag_value = new UILibrary.DragValue({
        sync_value: this.velocityY_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.velocityZ_drag_value = new UILibrary.DragValue({
        sync_value: this.velocityZ_sync,
        min_value: -20,
        max_value: 20,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.velocity_dragvaluetable = new UILibrary.DragValueTable({
        stack: "horizontal",
        values: [
          { label: "X",
            drag_value: this.velocityX_drag_value
          },
          { label: "Y",
            drag_value: this.velocityY_drag_value
          },
          { label: "Z",
            drag_value: this.velocityZ_drag_value
          }
        ]
      });
      this.velocity_dragvaluetable.getElement().style.width = "100%";

      this.velocity_labeleddiv = new UILibrary.LabeledDiv({
        label: "Velocity",
        content: this.velocity_dragvaluetable.getElement()
      });
      this.div.appendChild(this.velocity_labeleddiv.getElement());
    };

    Panner.prototype.draw = function () {

    };

    return Panner;
  })();

  NodeLibrary.BiquadFilter = (function () {
    function BiquadFilter (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);
      Graph.Node.AudioDestinationNode.apply(this, arguments);

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
        "waveform": new Graph.Endpoint({
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
        "waveform": new Graph.Endpoint({
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
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Biquad Filter",
        draw_callback: this.draw.bind(this),
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
      new Graph.Node.AudioSourceNode(),
      new Graph.Node.AudioDestinationNode()
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

      this.type_radio_group = new UILibrary.RadioGroup({
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

      this.type_labeleddiv = new UILibrary.LabeledDiv({
        label: "Type",
        content: this.type_radio_group.getElement()
      });
      this.div.appendChild(this.type_labeleddiv.getElement());

      this.frequency_drag_value = new UILibrary.DragValue({
        sync_value: this.frequency_sync,
        min_value: this.node.frequency.minValue,
        max_value: this.node.frequency.maxValue,
        sensitivity: 10,
        direction_lock: "vertical",
        string_format: function (str) {
          return "" + str + "Hz";
        }
      });

      this.Q_drag_value = new UILibrary.DragValue({
        sync_value: this.Q_sync,
        min_value: this.node.Q.minValue,
        max_value: this.node.Q.maxValue,
        sensitivity: 0.01,
        digits: 2,
        direction_lock: "vertical"
      });

      this.gain_drag_value = new UILibrary.DragValue({
        sync_value: this.gain_sync,
        min_value: this.node.gain.minValue,
        max_value: this.node.gain.maxValue,
        sensitivity: 0.05,
        digits: 2,
        direction_lock: "vertical"
      });

      this.drag_value_table = new UILibrary.DragValueTable({
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

      this.filter_graph = new UILibrary.ScalableGraph({
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
      this.filter_graph.setDimensions(450, 200);
      this.filter_graph.getElement().style.marginTop = "1px";
      this.filter_graph.getElement().style.borderTop = "1px solid #808080";

      this.div.appendChild(this.filter_graph.getElement());
    };

    BiquadFilter.prototype.draw = function () {
    };

    return BiquadFilter;
  })();

  NodeLibrary.Oscillator = (function () {
    function Oscillator (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.NoteDestinationNode.apply(this, arguments);
      Graph.Node.AudioSourceNode.apply(this, arguments);

      // BEGIN

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.destination = this.context.createGainNode();

      this.type = this.params.type || Oscillator.Type.SINE;

      this.osc_map = new Utilities.Map();

      this.setInputDescriptors({
        "notes": new Graph.Endpoint({
          node: this,
          name: "notes",
          type: "notes",
          accepted_types: [
            "notes"
          ],
          direction: "input"
        })/*,

        "frequency": new Graph.Endpoint({
          node: this,
          name: "frequency",
          type: "AudioParam",
          accepted_types: [
            "AudioParam",
            "AudioNode"
          ],
          direction: "input"
        }),

        "detune": new Graph.Endpoint({
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
        "waveform": new Graph.Endpoint({
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

      // UILibrary

      // MUST BE DEFINED AFTER ENDPOINTS
      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Oscillator",
        draw_callback: this.draw.bind(this),
        resizable: false,
        use_flex: false
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
      new Graph.Node.NoteDestinationNode(),
      new Graph.Node.AudioSourceNode()
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
          if (new_osc.start) {
            new_osc.start(0);
          } else if (new_osc.noteOn) {
            new_osc.noteOn(0);
          }
          new_osc.connect(destination);
          this.osc_map.set(cur_note, new_osc);
        }
      }
    };

    // GraphNode

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

    // UILibrary.Node

    Oscillator.prototype.getWindow = function () {
      return this.ui_window;
    };

    Oscillator.prototype.informWindowPrepared = function (div) {
      this.div = div;

      this.type_radiogroup = new UILibrary.RadioGroup({
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

      this.type_labeleddiv = new UILibrary.LabeledDiv({
        label: "Type",
        content: this.type_radiogroup.getElement()
      });
      this.div.appendChild(this.type_labeleddiv.getElement());
    };

    Oscillator.prototype.draw = function () {

    };

    return Oscillator;
  })();

  NodeLibrary.Oscilloscope = (function () {
    function Oscilloscope (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);
      Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      // This feels pretty hacky... is there a better way?
      // Connect to a 0 gain node that is connected to the main out.
      // Effectively kills the sound but still causes AudioProcessingEvents to occur.
      this.audio_sink = this.context.createGainNode();
        this.audio_sink.gain.value = 0;
        this.audio_sink.connect(this.synesthesia.getDestination());
      if (this.context.createScriptProcessor) {
        this.node = this.context.createScriptProcessor(2048);
      } else if (this.context.createJavaScriptNode) {
        this.node = this.context.createJavaScriptNode(2048);
      }
        this.node.onaudioprocess = this.handle_AudioProcessingEvent.bind(this);
        this.node.connect(this.audio_sink);

      this.setInputDescriptors({
        "waveform": new Graph.Endpoint({
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

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Oscilloscope",
        draw_callback: this.draw.bind(this)
      });
    }

    Oscilloscope.prototype = Utilities.extend(
      new Graph.Node.AudioSourceNode(),
      new Graph.Node.AudioDestinationNode()
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

  NodeLibrary.NumberDisplay = (function () {
    function NumberDisplay (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.apply(this, arguments);

      this.setInputDescriptors({
        "number": new Graph.Endpoint({
          node: this,
          name: "number",
          type: "Number",
          flow: "passive",
          accepted_types: [
            "Number"
          ],
          direction: "input"
        })
      });

      this.setOutputDescriptors({});

      this.build();

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "NumberDisplay",
        draw_callback: this.draw.bind(this)
      });
    }

    NumberDisplay.prototype = Utilities.extend(
      new Graph.Node()
    );

    NumberDisplay.prototype.build = function () {
      this.output_span = document.createElement("span");
        this.output_span.style.fontSize = "3em";
      this.getInputDescriptors()["number"].addFlowListener((function (data) {
        this.output_span.innerHTML = data;
      }).bind(this));
    };

    NumberDisplay.prototype.getWindow = function () {
      return this.ui_window;
    };

    NumberDisplay.prototype.informWindowPrepared = function (div) {
      div.appendChild(this.output_span);
    };

    NumberDisplay.prototype.informConnected = function (endpoint, connection) {

    };

    NumberDisplay.prototype.informDisconnected = function (endpoint, connection) {

    };

    NumberDisplay.prototype.draw = function () {

    };

    return NumberDisplay;
  })();

  NodeLibrary.NumberMap = (function () {
    function NumberMap (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.apply(this, arguments);

      this.setInputDescriptors({
        "number": new Graph.Endpoint({
          node: this,
          name: "number",
          type: "Number",
          flow: "passive",
          accepted_types: [
            "Number"
          ],
          direction: "input"
        })
      });

      this.setOutputDescriptors({
        "mapped_number": new Graph.Endpoint({
          node: this,
          name: "mapped_number",
          type: "Number",
          flow: "active",
          accepted_types: [
            "Number"
          ],
          direction: "output"
        }),
        "unmapped_number": new Graph.Endpoint({
          node: this,
          name: "unmapped_number",
          type: "Number",
          flow: "active",
          accepted_types: [
            "Number"
          ],
          direction: "output"
        })
      });

      this.element = document.createElement("div");
      this.build();

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "NumberMap",
        draw_callback: this.draw.bind(this)
      });
    }

    NumberMap.prototype = Utilities.extend(
      new Graph.Node()
    );

    NumberMap.prototype.build = function () {
      this.output_div = document.createElement("span");
        this.output_div.style.fontSize = "3em";
        this.output_div.innerHTML = "&nbsp;";
      this.element.appendChild(this.output_div);

      this.element.appendChild(
        document.createElement("br")
      );
      
      this.map_textarea = document.createElement("textarea");
        this.map_textarea.style.outline = "none";
      this.element.appendChild(this.map_textarea);

      this.getInputDescriptors()["number"].addFlowListener((function (data) {
        this.output_div.innerHTML = data;

        var map = {};
        try {
          map = JSON.parse(this.map_textarea.value);
          this.map_textarea.style.border = "1px solid gray";
        } catch (e) {
          this.map_textarea.style.border = "1px solid red";
          console.error(e);
        }

        if (map.hasOwnProperty(data)) {
          // if the number is in the map.
          this.getOutputDescriptors()["mapped_number"].initiateFlow(map[data]);
        } else {
          // if the number isn't in the map.
          this.getOutputDescriptors()["unmapped_number"].initiateFlow(data);
        }
      }).bind(this));
    };

    NumberMap.prototype.getWindow = function () {
      return this.ui_window;
    };

    NumberMap.prototype.informWindowPrepared = function (div) {
      div.appendChild(this.element);
    };

    NumberMap.prototype.informConnected = function (endpoint, connection) {

    };

    NumberMap.prototype.informDisconnected = function (endpoint, connection) {

    };

    NumberMap.prototype.draw = function () {

    };

    return NumberMap;
  })();

  NodeLibrary.EnvelopeSource = (function () {
    function EnvelopeSource (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.EnvelopeSourceNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.setInputDescriptors({
      });

      this.setOutputDescriptors({
        "envelope": new Graph.Endpoint({
          node: this,
          name: "envelope",
          type: "Envelope",
          accepted_types: [
            "Envelope",
          ],
          direction: "output"
        })
      });

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Envelope",
        use_flex: true
      });
    }

    EnvelopeSource.prototype = Utilities.extend(
      new Graph.Node.EnvelopeSourceNode()
    );

    // UI

    EnvelopeSource.prototype.getWindow = function () {
      return this.ui_window;
    };
    
    EnvelopeSource.prototype.informWindowPrepared = function (div) {
      //
    };

    EnvelopeSource.prototype.draw = function () {
      //
    };
    
    // Graph

    EnvelopeSource.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["envelope"]:
          break;
      }
    };

    EnvelopeSource.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["envelope"]:
          break;
      }
    };

    EnvelopeSource.prototype.getEnvelopeForEndpoint = function (endpoint) {
      switch (endpoint) {
        case this.getOutputDescriptors()["envelope"]:
          var TEST_ENVELOPE = new Envelope.Path();
            TEST_ENVELOPE.addPoint(
              new Envelope.Point({
                value: 0,
                time: 0,
                transition: Envelope.Point.Transition.SET
              })
            );
            TEST_ENVELOPE.addPoint(
              new Envelope.Point({
                value: 1,
                time: 1,
                transition: Envelope.Point.Transition.LINEAR
              })
            );
            TEST_ENVELOPE.addPoint(
              new Envelope.Point({
                value: 0.5,
                time: 2,
                transition: Envelope.Point.Transition.LINEAR
              })
            );

          return TEST_ENVELOPE;
      }
    };

    return EnvelopeSource;
  })();

  NodeLibrary.EnvelopeTrigger = (function () {
    function EnvelopeTrigger (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.TriggerNode.apply(this, arguments);
      Graph.Node.EnvelopeDestinationNode.apply(this, arguments);
      Graph.Node.AudioParamUtiliserNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.active_envelope = null;
      this.active_audioparam = null;

      this.setInputDescriptors({
        "envelope": new Graph.Endpoint({
          node: this,
          name: "envelope",
          type: "Envelope",
          accepted_types: [
            "Envelope",
          ],
          direction: "input"
        }),
        "trigger": new Graph.Endpoint({
          node: this,
          name: "trigger",
          type: "Trigger",
          accepted_types: [
            "Trigger",
          ],
          direction: "input"
        })
      });

      this.setOutputDescriptors({
        "audioparam": new Graph.Endpoint({
          node: this,
          name: "audioparam",
          type: "AudioParam",
          accepted_types: [
            "AudioParam",
          ],
          direction: "output"
        })
      });

      this.setTriggerNames([
        "apply_envelope",
      ]);

      this.addTriggerListener("apply_envelope", (function () {
        if (!this.active_envelope) return;
        if (!this.active_audioparam) return;

        this.active_envelope.applyToAudioParamWithTimeOffset(
          this.active_audioparam,
          this.context.currentTime
        );
      }).bind(this));

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Envelope Trigger",
        use_flex: true
      });
    }

    EnvelopeTrigger.prototype = Utilities.extend(
      new Graph.Node.TriggerNode(),
      new Graph.Node.EnvelopeDestinationNode(),
      new Graph.Node.AudioParamUtiliserNode()
    );

    // UI

    EnvelopeTrigger.prototype.getWindow = function () {
      return this.ui_window;
    };
    
    EnvelopeTrigger.prototype.informWindowPrepared = function (div) {
      //
    };

    EnvelopeTrigger.prototype.draw = function () {
      //
    };
    
    // Graph

    EnvelopeTrigger.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        // INPUTS

        case this.getInputDescriptors()["envelope"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.active_envelope = other_node.getEnvelopeForEndpoint(other_endpoint);
          break;

        case this.getInputDescriptors()["trigger"]:
          // Do nothing, trigger source handles proxy creation.
          break;

        // OUTPUTS

        case this.getOutputDescriptors()["audioparam"]:
          var other_endpoint = connection.getOppositeEndpoint(endpoint);
          var other_node = other_endpoint.getNode();
          this.active_audioparam = other_node.getAudioParamForEndpoint(other_endpoint);
          break;
      }
    };

    EnvelopeTrigger.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
        // INPUTS

        case this.getInputDescriptors()["envelope"]:
          this.active_envelope = null;
          break;

        case this.getInputDescriptors()["trigger"]:
          // Do nothing, trigger source handles proxy destruction.
          break;

        // OUTPUTS

        case this.getOutputDescriptors()["audioparam"]:
          this.active_audioparam = null;
          break;
      }
    };

    EnvelopeTrigger.prototype.getTriggerNameForEndpoint = function (endpoint) {
      switch (endpoint) {
        case this.getInputDescriptors()["trigger"]:
          return "apply_envelope";
        default:
          return null;
      }
    };

    return EnvelopeTrigger;
  })();

  NodeLibrary.TriggerButton = (function () {
    function TriggerButton (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.TriggerNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.setInputDescriptors({
      });

      this.setOutputDescriptors({
        "trigger": new Graph.Endpoint({
          node: this,
          name: "trigger",
          type: "Trigger",
          accepted_types: [
            "Trigger",
          ],
          direction: "output"
        })
      });

      this.setTriggerNames([
        "trigger",
      ]);

      // FOR DEBUGGING ONLY
      this.addTriggerListener("trigger", function () {
        console.log("trigger");
      });

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Trigger Button",
        use_flex: true
      });
    }

    TriggerButton.prototype = Utilities.extend(
      new Graph.Node.TriggerNode()
    );

    // UI

    TriggerButton.prototype.getWindow = function () {
      return this.ui_window;
    };
    
    TriggerButton.prototype.informWindowPrepared = function (div) {
      this.trigger_button = document.createElement("button");
        this.trigger_button.addEventListener("click", (function () {
          this.launchTrigger("trigger");
        }).bind(this));
        this.trigger_button.appendChild(
          document.createTextNode("trigger")
        );
      div.appendChild(this.trigger_button);
    };

    TriggerButton.prototype.draw = function () {
      //
    };
    
    // Graph

    TriggerButton.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["trigger"]:
          var opposite_endpoint = connection.getOppositeEndpoint(endpoint);
          
          this.addTriggerListenerProxy(
            "trigger",
            opposite_endpoint.getNode(),
            opposite_endpoint.getNode().getTriggerNameForEndpoint(opposite_endpoint)
          );
          break;
      }
    };

    TriggerButton.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getOutputDescriptors()["trigger"]:
          var opposite_endpoint = connection.getOppositeEndpoint(endpoint);
          
          this.removeTriggerListenerProxy(
            "trigger",
            opposite_endpoint.getNode(),
            opposite_endpoint.getNode().getTriggerNameForEndpoint(opposite_endpoint)
          );
          break;
      }
    };

    TriggerButton.prototype.getTriggerNameForEndpoint = function (endpoint) {
      switch (endpoint) {
        case this.getOutputDescriptors()["trigger"]:
          return "trigger";
        default:
          return null;
      }
    };

    return TriggerButton;
  })();

  NodeLibrary.EnvelopePathsEditorTest = (function () {
    function EnvelopePathsEditorTest (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.setInputDescriptors({
      });

      this.setOutputDescriptors({
      });

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "Envelope Paths Editor Test",
        use_flex: false, resizable: false
      });
    }

    EnvelopePathsEditorTest.prototype = Utilities.extend(
      new Graph.Node()
    );

    // UI

    EnvelopePathsEditorTest.prototype.getWindow = function () {
      return this.ui_window;
    };
    
    EnvelopePathsEditorTest.prototype.informWindowPrepared = function (div) {
      this.path_editor = new UILibrary.EnvelopePathsEditor({
        x_min: -0.1, x_max: 1.1,
        y_min: -0.1, y_max: 1.1,
      });
      div.appendChild(this.path_editor.getElement());
    };

    EnvelopePathsEditorTest.prototype.draw = function () {
      //
    };
    
    // Graph

    EnvelopePathsEditorTest.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
      }
    };

    EnvelopePathsEditorTest.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
      }
    };

    return EnvelopePathsEditorTest;
  })();

  NodeLibrary.FlowUITestNode = (function () {
    function FlowUITestNode (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.apply(this, arguments);

      this.setInputDescriptors({
        "passive_in": new Graph.Endpoint({
          node: this,
          name: "passive_in",
          type: "notes",
          flow: "passive",
          accepted_types: [
            "notes"
          ],
          direction: "input"
        }),
        "active_in": new Graph.Endpoint({
          node: this,
          name: "passive_in",
          type: "notes",
          flow: "active",
          accepted_types: [
            "notes"
          ],
          direction: "input"
        })
      });

      this.setOutputDescriptors({
        "passive_out": new Graph.Endpoint({
          node: this,
          name: "passive_out",
          type: "notes",
          flow: "passive",
          accepted_types: [
            "notes"
          ],
          direction: "output"
        }),
        "active_out": new Graph.Endpoint({
          node: this,
          name: "passive_out",
          type: "notes",
          flow: "active",
          accepted_types: [
            "notes"
          ],
          direction: "output"
        })
      });

      this.ui_window = new WindowSystem.NodeWindow({
        node: this,
        title: "FlowUITestNode",
        draw_callback: this.draw.bind(this)
      });
    }

    FlowUITestNode.prototype = Utilities.extend(
      new Graph.Node()
    );

    FlowUITestNode.prototype.getWindow = function () {
      return this.ui_window;
    };

    FlowUITestNode.prototype.informWindowPrepared = function (div) {

    };

    FlowUITestNode.prototype.informConnected = function (endpoint, connection) {

    };

    FlowUITestNode.prototype.informDisconnected = function (endpoint, connection) {

    };

    FlowUITestNode.prototype.draw = function () {

    };

    return FlowUITestNode;
  })();

  return NodeLibrary;
});
