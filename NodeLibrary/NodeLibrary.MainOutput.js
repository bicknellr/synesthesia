module.declare("Synesthesia:NodeLibrary:MainOutput",
[
  "Utilities",
  "Synesthesia:Graph"
],
function () {

  var Utilities = module.require("Utilities");

  var Graph = module.require("Synesthesia:Graph");

  var MainOutput = {};

  MainOutput.Node = (function () {
    function MainOutputNode (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.AudioDestinationNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
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

  MainOutput.UI = (function () {
    function MainOutputUI (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.NodeUI.apply(this, [{}]);

      this.setInputDescriptors({
        "waveform": new Graph.EndpointDescriptor({
          node_ui: this,
          name: "waveform",
          direction: "input",
          type: "AudioNode",
          accepted_types: [
            "AudioNode"
          ]
        })
      });

      this.setOutputDescriptors({});

      this.nodes = this.params.nodes || [];

      this.ui_window = null;
    }

    MainOutputUI.prototype = Utilities.extend(
      new Graph.NodeUI()
    );

    // Graph.NodeUI

    MainOutputUI.prototype.informWindowPrepared = function (ui_window) {
      this.ui_window = ui_window;
      this.ui_window.setTitle("Main Output");
    };

    MainOutputUI.prototype.informConnected = function (endpoint, connection) {

    };

    MainOutputUI.prototype.informDisconnected = function (endpoint, connection) {

    };

    return MainOutputUI;
  })();

  return MainOutput;
});
