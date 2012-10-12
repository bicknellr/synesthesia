module("Synesthesia.Graph",
["Utilities", "Synesthesia"],
function () {

  var Utilities = require("Utilities");
  
  var Synesthesia = require("Synesthesia");

  Synesthesia.Graph = {};

  Synesthesia.Graph.Endpoint = (function () {
    function Endpoint (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.node = this.params.node;
      if (!Utilities.conforms(Synesthesia.Graph.Node, this.node)) {
        throw new Error("Synesthesia.Graph.Endpoint: Given object is not a valid node.");
      }

      this.name = this.params.name;

      this.type = this.params.type;
      if (Endpoint.Types.indexOf(this.type) == -1) {
        throw new Error("Synesthesia.Graph.Endpoint: Invalid type.");
      }

      this.direction = this.params.direction;
      if (Endpoint.Directions.indexOf(this.direction) == -1) {
        throw new Error("Synesthesia.Graph.Endpoint: Invalid direction.");
      }

      this.connections = [];
    }

    Endpoint.Types = [
      "notes",
      "envelope",
      "AudioNode",
      "canvas" // Do audio first!
    ];

    Endpoint.Directions = [
      "input",
      "output"
    ];

    Endpoint.prototype.getNode = function () {
      return this.node;
    };

    Endpoint.prototype.getName = function () {
      return this.name;
    };

    Endpoint.prototype.getType = function () {
      return this.type;
    };

    Endpoint.prototype.getDirection = function () {
      return this.direction;
    };

    Endpoint.prototype.getConnections = function () {
      return [].concat(this.connections);
    };

    Endpoint.prototype.canConnectTo = function (other_endpoint) {
      return this.direction != other_endpoint.direction;
    };

    Endpoint.prototype.informConnected = function (new_connection) {
      this.connections.push(new_connection);
      this.node.informConnected(this, new_connection);
    };

    Endpoint.prototype.informDisconnected = function (rm_connection) {
      if (this.connections.indexOf(rm_connection) != -1) {
        this.connections.splice(
          this.connections.indexOf(rm_connection),
          1
        );
      }
      this.node.informDisconnected(this, rm_connection);
    };

    return Endpoint;
  })();

  Synesthesia.Graph.Connection = (function () {
    function Connection (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.from_endpoint = this.params.from_endpoint;
      this.to_endpoint = this.params.to_endpoint;
      console.log("from");
      console.log(this.from_endpoint);
      console.log("to");
      console.log(this.to_endpoint);
    }

    Connection.prototype.setFromEndpoint = function (from_endpoint) {
      this.from_endpoint = from_endpoint;
    };

    Connection.prototype.setToEndpoint = function (to_endpoint) {
      this.to_endpoint = to_endpoint;
    };

    Connection.prototype.getOppositeEndpoint = function (endpoint) {
      if (endpoint == this.from_endpoint) {
        return this.to_endpoint;
      } else if (endpoint == this.to_endpoint) {
        return this.from_endpoint;
      } else {
        return null;
      }
    };

    return Connection;
  })();

  Synesthesia.Graph.Node = (function () {
    function Node (params) {
      if (!params) return; // INTERFACE
      
      if (!Utilities.overrides(Synesthesia.Graph.Node, this)) {
        console.error("Synesthesia.Graph.Node: Subclass does not override.");
      }
    }

    /*
    Requests an array containing objects describing the inputs / outputs.
    The objects in this array are of type Graph.EndpointDescriptor
    */
    Node.prototype.getInputDescriptors = function () {
      throw new Error("Synesthesia.Graph.Node(.getInputDescriptors): Not implemented.");
    };

    Node.prototype.getOutputDescriptors = function () {
      throw new Error("Synesthesia.Graph.Node(.getOutputDescriptors): Not implemented.");
    };

    // Informs the node that a given connection has been connected to / disconnected from the given endpoint.
    Node.prototype.informConnected = function (endpoint, connection) {
      throw new Error("Synesthesia.Graph.Node(.informConnected): Not implemented.");
    };

    Node.prototype.informDisconnected = function (endpoint, connection) {
      throw new Error("Synesthesia.Graph.Node(.informDisconnected): Not implemented.");
    };

    /*
    // Asks if the node it is ever possible to connect the given connection to the given input / output.
    Node.prototype.canConnectInput = function (input_name, connection) {
      throw new Error("Synesthesia.Graph.Node(.canConnectInput): Not implemented.");
    };

    Node.prototype.canConnectOutput = function (output_name, connection) {
      throw new Error("Synesthesia.Graph.Node(.canConnectOutput): Not implemented.");
    };

    // Asks if the node is able to connect the given connection to the given input / output at this moment.
    Node.prototype.mayConnectInput = function (input_name, connection) {
      throw new Error("Synesthesia.Graph.Node(.mayConnectInput): Not implemented.");
    };

    Node.prototype.mayConnectOutput = function (output_name, connection) {
      throw new Error("Synesthesia.Graph.Node(.mayConnectOutput): Not implemented.");
    };

    // Connect the given connection to the given input / output.
    Node.prototype.connectInput = function (input_name, connection) {
      throw new Error("Synesthesia.Graph.Node(.connectInput): Not implemented.");
    };

    Node.prototype.connectOutput = function (output_name, connection) {
      throw new Error("Synesthesia.Graph.Node(.connectOutput): Not implemented.");
    };

    // Disconnect the given connection from the given input / output.
    Node.prototype.disconnectInput = function (input_name, connection) {
      throw new Error("Synesthesia.Graph.Node(.disconnectInput): Not implemented.");
    };

    Node.prototype.disconnectOutput = function (output_name, connection) {
      throw new Error("Synesthesia.Graph.Node(.disconnectOutput): Not implemeneted.");
    };

    // Asks the node to produce the given input / output.
    Node.prototype.getInput = function (connection) {
      throw new Error("Synesthesia.Graph.Node(.getInput): Not implemented.");
    };

    Node.prototype.getOutput = function (connection) {
      throw new Error("Synesthesia.Graph.Node(.getOutput): Not implemented.");
    };
    */

    //

    Node.prototype.draw = function () {
      throw new Error("Synesthesia.Graph.Node(.draw): Not implemented.");
    };

    return Node;
  })();

  Synesthesia.Graph.Node.AudioNode = (function () {
    function AudioNode () {
      Synesthesia.Graph.Node.apply(this, arguments);
    }
    
    AudioNode.prototype = Utilities.extend(
      new Synesthesia.Graph.Node()
    );

    return AudioNode;
  })();

  Synesthesia.Graph.Node.AudioSourceNode = (function () {
    function AudioSourceNode () {
      Synesthesia.Graph.Node.AudioNode.apply(this, arguments);

      this.src_dest_map = new Utilities.Map();
    }

    AudioSourceNode.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.AudioNode()
    );

    AudioSourceNode.GlobalConnectionMap = new Utilities.Map();

    AudioSourceNode.prototype.connectSourceToDestination = function (source_node, destination_node) {
      var connections = AudioSourceNode.GlobalConnectionMap.get(source_node);
      if (!connections) {
        connections = [];
        AudioSourceNode.GlobalConnectionMap.set(source_node, connections);
      }

      connections.push(destination_node);
      source_node.connect(destination_node);
    };

    AudioSourceNode.prototype.disconnectSourceFromDestination = function (source_node, destination_node) {
      var connections = AudioSourceNode.GlobalConnectionMap.get(source_node);
      if (!connections || connections.length == 0) {
        throw new Error("Synesthesia.Graph.Node.AudioSourceNode(.disconnectSourceFromDestination): Disconnect requested on a node that was not known to be connected.");
      }

      connections.splice(connections.indexOf(destination_node), 1);
      source_node.disconnect();
      for (var i = 0; i < connections.length; i++) {
        source_node.connect(connections[i]);
      }
    };

    return AudioSourceNode;
  })();

  Synesthesia.Graph.Node.AudioDestinationNode = (function () {
    function AudioDestinationNode () {
      Synesthesia.Graph.Node.AudioNode.apply(this, arguments);

      this.destination_map = new Utilities.Map();
    }

    AudioDestinationNode.prototype = Utilities.extend(
      new Synesthesia.Graph.Node.AudioNode()
    );

    AudioDestinationNode.prototype.getDestination = function (source) {
      throw new Error("Synesthesia.Graph.Node.AudioDestinationNode(.getDestination): Not implemented.");
    };

    return AudioDestinationNode;
  })();
});
