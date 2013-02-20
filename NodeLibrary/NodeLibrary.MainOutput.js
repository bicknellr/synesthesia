module.declare("Synesthesia:NodeLibrary:MainOutput",
[
  "Utilities",
  "Synesthesia:Graph",
  "Synesthesia:Parallelism"
],
function () {

  var Utilities = module.require("Utilities");

  var Graph = module.require("Synesthesia:Graph");
  var Parallelism = module.require("Synesthesia:Parallelism");

  var MainOutput = {};

  MainOutput.Node = (function () {
    function MainOutputNode (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;

      this.controller = this.params.controller;

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
        })
      });

      this.setOutputDescriptors({});
    }

    MainOutputNode.prototype = Utilities.extend(
      new Graph.Node.AudioDestinationNode()
    );

    // Graph.Node

    MainOutputNode.prototype.informConnected = function (endpoint, connection) {

    };

    MainOutputNode.prototype.informDisconnected = function (endpoint, connection) {

    };

    // Graph.Node.AudioDestinationNode

    MainOutputNode.prototype.getDestinationForInput = function (input_endpoint) {
      switch (input_endpoint) {
        case this.getInputDescriptors()["waveform"]:
          return this.synesthesia.getDestination();
      }
    };

    return MainOutputNode;
  })();

  MainOutput.Controller = (function () {
    function MainOutputController (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.NodeController.apply(this, [{}]);

      this.synesthesia = this.params.synesthesia;

      this.setInputDescriptors({
        "waveform": new Graph.EndpointDescriptor({
          node_controller: this,
          name: "waveform",
          direction: "input",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ]
        })
      });

      this.setOutputDescriptors({});

      this.ONLY_NODE = new MainOutput.Node({
        synesthesia: this.synesthesia,
        controller: this
      });

      // Must come after setting input/output descriptors.
      this.setParallelismManager(
        new Parallelism.ParallelismManager({
          synesthesia: this.synesthesia,
          node_controller: this
        })
      );

      this.ui_window = null;
    }

    MainOutputController.prototype = Utilities.extend(
      new Graph.NodeController()
    );

    // Graph.NodeController

    MainOutputController.prototype.informWindowPrepared = function (ui_window) {
      this.ui_window = ui_window;
      this.ui_window.setTitle("Main Output");
    };

    MainOutputController.prototype.informConnected = function (endpoint, connection) {

    };

    MainOutputController.prototype.informDisconnected = function (endpoint, connection) {

    };

    MainOutputController.prototype.produceParallelizableNode = function () {
      return this.ONLY_NODE;
    };

    return MainOutputController;
  })();

  return MainOutput;
});
