module.declare("Synesthesia:NodeLibrary:Oscillator",
[
  "Utilities",
  "Synesthesia:Graph",
  "Synesthesia:Parallelism",
  "Synesthesia:UILibrary"
],
function () {

  var Utilities = module.require("Utilities");

  var Graph = module.require("Synesthesia:Graph");
  var Parallelism = module.require("Synesthesia:Parallelism");
  var UILibrary = module.require("Synesthesia:UILibrary");

  var Oscillator = {};

  Oscillator.Type = {
    SINE: 0,
    SQUARE: 1,
    SAWTOOTH: 2,
    TRIANGLE: 3//,
    //CUSTOM: 4
  };

  Oscillator.Node = (function () {
    function OscillatorNode (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.NoteDestinationNode.apply(this, arguments);
      Graph.Node.AudioSourceNode.apply(this, arguments);

      // BEGIN

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.controller = this.params.controller;

      this.on_handle_notes = this.params.on_handle_notes || function () {};

      this.destination = this.context.createGainNode();

      this.type = this.params.type || Oscillator.Type.SINE;

      this.osc_map = new Utilities.Map();

      this.setInputDescriptors({
        "notes": new Graph.Endpoint({
          name: "notes",
          node: this,
          descriptor: this.controller.getInputDescriptors()["notes"],
          direction: "input",
          type: "notes",
          accepted_types: [
            "notes"
          ]
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
          name: "waveform",
          node: this,
          descriptor: this.controller.getOutputDescriptors()["waveform"],
          direction: "output",
          type: "AudioNode",
          accepted_types: [
            "AudioNode",
            "AudioParam"
          ],
        })
      });
    }

    OscillatorNode.prototype = Utilities.extend(
      new Graph.Node.NoteDestinationNode(),
      new Graph.Node.AudioSourceNode()
    );

    OscillatorNode.prototype.getType = function () {
      return this.type;
    };

    OscillatorNode.prototype.setType = function (new_type) {
      this.type = new_type;

      var osc_keys = this.osc_map.getKeys();
      for (var key_ix = 0; key_ix < osc_keys.length; key_ix++) {
        var cur_osc = this.osc_map.get(osc_keys[key_ix]);

        cur_osc.type = this.type;
      }
    };

    // Synesthesia.Instrument

    OscillatorNode.prototype.handleNotes = function (notes) {
    /*
      if (this.on_handle_notes && typeof this.on_handle_notes == "function") {
        this.on_handle_notes(notes);
      } else {
        this.playNotes(notes);
      }
    };

    OscillatorNode.prototype.playNotes = function (notes) {
    */
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

    OscillatorNode.prototype.informConnected = function (endpoint, connection) {
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

    OscillatorNode.prototype.informDisconnected = function (endpoint, connection) {
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

    return OscillatorNode;
  })();

  Oscillator.Controller = (function () {
    function OscillatorController (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.NodeController.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;

      this.type = Oscillator.Type.SINE;

      this.next_osc_id = 0;
      this.osc_map = new Utilities.Map();

      this.setInputDescriptors({
        "notes": new Graph.EndpointDescriptor({
          name: "notes",
          node_controller: this,
          direction: "input",
          type: "notes",
          accepted_types: [
            "notes"
          ]
        })
      });
      this.setOutputDescriptors({
        "waveform": new Graph.EndpointDescriptor({
          name: "waveform",
          node_controller: this,
          direction: "output",
          type: "AudioNode",
          accepted_types: [
            "AudioNode",
            "AudioParam"
          ]
        })
      });

      // Must come after setting input/output descriptors.
      this.setParallelismManager(
        new Parallelism.ParallelismManager({
          synesthesia: this.synesthesia,
          node_controller: this
        })
      );

      this.parallelism_source = new Parallelism.ParallelismSource();

      this.getParallelismManager().selectParallelismSource({
        source: this.parallelism_source,
        custom_listener: (function (channel_event) {
          console.log(channel_event);
        }).bind(this)
      });

      this.ui_window = null;
    }

    OscillatorController.prototype = Utilities.extend(
      new Graph.NodeController()
    );

    // Graph.NodeController

    OscillatorController.prototype.informWindowPrepared = function (ui_window) {
      this.ui_window = ui_window;
      this.ui_window.setTitle("Oscillator");

      this.type_radiogroup = new UILibrary.RadioGroup({
        options: [
          { label: "sine", value: Oscillator.Type.SINE, selected: true },
          { label: "square", value: Oscillator.Type.SQUARE },
          { label: "sawtooth", value: Oscillator.Type.SAWTOOTH },
          { label: "triangle", value: Oscillator.Type.TRIANGLE },
        ],
        callback_select: (function (selected_option) {
          this.type = selected_option.value;

          var channels = this.getParallelismManager().getActiveChannels();
          for (var channel_ix = 0; channel_ix < channels.length; channel_ix++) {
            var cur_node = this.getParallelismManager().getNodeForChannel(channels[channel_ix]);
            cur_node.setType(this.type);
          };

        }).bind(this)
      });

      this.type_labeleddiv = new UILibrary.LabeledDiv({
        label: "Type",
        content: this.type_radiogroup.getElement()
      });
      this.ui_window.getContentDiv().appendChild(this.type_labeleddiv.getElement());
    };

    OscillatorController.prototype.informConnected = function (endpoint, connection) {
    };

    OscillatorController.prototype.informDisconnected = function (endpoint, connection) {
    };

    /*
    OscillatorController.prototype.onHandleNotes = function (osc_id, notes) {
      console.log("osc_id: " + osc_id);
      console.log(notes);

      if (notes.off) {
        for (var off_ix = 0; off_ix < notes.off.length; off_ix++) {
          var cur_note = notes.off[off_ix];
          var cur_osc = this.osc_map.get(cur_note);
          if (!cur_osc) return;
          //cur_osc.disconnect();
          this.parallelism_source.destroyChannel(cur_osc); //
          this.osc_map.remove(cur_note);
          delete cur_osc;
        }
      }

      if (notes.on) {
        for (var on_ix = 0; on_ix < notes.on.length; on_ix++) {
          var cur_note = notes.on[on_ix];
          var new_osc = this.produceParallelizableNode();
          new_osc.playNotes({source: notes.source, on: [cur_note]});
          this.parallelism_source.createChannel(new_osc);
          this.osc_map.set(cur_note, new_osc);
        }
      }
    };
    */

    OscillatorController.prototype.produceParallelizableNode = function () {
      var osc_id = this.next_osc_id;
      return new Oscillator.Node({
        synesthesia: this.synesthesia,
        controller: this,
        type: this.type
      });
      this.next_osc_id++;
    };

    return OscillatorController;
  })();

  return Oscillator;
});
