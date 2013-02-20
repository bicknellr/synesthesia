module.declare("Synesthesia:NodeLibrary:Gain",
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

  var Gain = {};

  Gain.Node = (function () {
    function GainNode (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioSourceNode.apply(this, arguments);
      Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.controller = this.params.controller;

      this.node = null;
      if (this.context.createGain) {
        this.node = this.context.createGain();
      } else if (this.context.createGainNode) {
        this.node = this.context.createGainNode();
      }

      this.setInputDescriptors({
        "waveform": new Graph.Endpoint({
          name: "waveform",
          node: this,
          descriptor: this.controller.getInputDescriptors()["waveform"],
          direction: "input",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ]
        }),
        "gain": new Graph.Endpoint({
          name: "gain",
          node: this,
          descriptor: this.controller.getInputDescriptors()["gain"],
          direction: "input",
          type: "AudioParam",
          accepted_types: [
            "AudioParam",
            "AudioNode"
          ]
        })
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
          ]
        })
      });
    }

    GainNode.prototype = Utilities.extend(
      new Graph.Node.AudioSourceNode(),
      new Graph.Node.AudioDestinationNode()
    );

    // Graph.Node

    GainNode.prototype.informConnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getInputDescriptors()["gain"]:
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

    GainNode.prototype.informDisconnected = function (endpoint, connection) {
      switch (endpoint) {
        case this.getInputDescriptors()["gain"]:
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

    // Graph.Node.AudioDestinationNode

    GainNode.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.node;
        case this.getInputDescriptors()["gain"]:
          return this.node.gain;
      }
    };

    // LOCAL

    GainNode.prototype.setGain = function (value) {
      // TODO: Why?
      if (value < 0.01) {
        value = 0;
      }
      this.node.gain.setValueAtTime(value, 0);
    };

    return GainNode;
  })();

  Gain.Controller = (function () {
    function GainController (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.NodeController.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;

      this.setInputDescriptors({
        "waveform": new Graph.EndpointDescriptor({
          name: "waveform",
          node_controller: this,
          direction: "input",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ]
        }),
        "gain": new Graph.EndpointDescriptor({
          name: "gain",
          node_controller: this,
          direction: "input",
          type: "AudioParam",
          accepted_types: [
            "AudioParam",
            "AudioNode"
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

      this.ui_window = null;

      /*
      this.gain_sync = new Utilities.SynchronizedValue();
      this.gain_sync.addListener(this, (function (new_value) {
        this.node.gain.value = new_value;
      }).bind(this));
      this.gain_sync.setValue(this, this.node.gain.value);
      */
    }

    GainController.prototype = Utilities.extend(
      new Graph.NodeController()
    );

    // Graph.NodeController

    GainController.prototype.informWindowPrepared = function (ui_window) {
      this.ui_window = ui_window;
      this.ui_window.setTitle("Gain");

      this.ui_window.getContentDiv().appendChild(
        document.createTextNode("NOT IMPLEMENTED")
      );

      this.gain_drag_value =  new UILibrary.DragValue({
        sync_value: this.gain_sync,
        min_value: 0,
        max_value: 1,
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
      this.ui_window.getContentDiv().appendChild(table_element);
    };

    GainController.prototype.informConnected = function (endpoint, connection) {
    };

    GainController.prototype.informDisconnected = function (endpoint, connection) {
    };

    GainController.prototype.produceParallelizableNode = function () {
      return new Gain.Node({
        synesthesia: this.synesthesia,
        controller: this
      });
    };

    return GainController;
  })();

  return Gain;
});
