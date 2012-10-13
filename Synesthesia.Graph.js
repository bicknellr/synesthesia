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
        throw new Error("Synesthesia.Graph.Endpoint: Invalid type '" + this.type + "'.");
      }

      this.accepted_types = this.params.accepted_types;
      for (var i = 0; i < this.accepted_types.length; i++) {
        if (Endpoint.Types.indexOf(this.accepted_types[i]) == -1) {
          throw new Error("Synesthesia.Graph.Endpoint: Invalid accepted type '" + this.accpeted_types[i] + "'.");
        }
      }

      this.direction = this.params.direction;
      if (Endpoint.Directions.indexOf(this.direction) == -1) {
        throw new Error("Synesthesia.Graph.Endpoint: Invalid direction.");
      }

      this.max_connections = this.params.max_connections || Infinity;

      this.connections = [];
    }

    Endpoint.Types = [
      "notes",
      "AudioNode",
      "AudioParam",
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

    Endpoint.prototype.getAcceptedTypes = function () {
      return this.accepted_types;
    };

    Endpoint.prototype.getMaxConnections = function () {
      return this.max_connections;
    };

    Endpoint.prototype.getDirection = function () {
      return this.direction;
    };

    Endpoint.prototype.getConnections = function () {
      return [].concat(this.connections);
    };

    Endpoint.prototype.canConnectTo = function (other_endpoint) {
      // Can't be the same direction.
      if (this.direction == other_endpoint.getDirection()) return false;
      
      // Other endpoint must accept this endpoint type.
      if (other_endpoint.getAcceptedTypes().indexOf(this.type) == -1) return false;
      // Other endpoint can't be maxed out.
      if (other_endpoint.getConnections().length >= other_endpoint.getMaxConnections()) return false;

      // This endpoint must accept other endpoint type.
      if (this.accepted_types.indexOf(other_endpoint.getType()) == -1) return false;
      // This endpoint can't be maxed out.
      if (this.connections.length >= this.max_connections) return false;

      return true;
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
      /*
      console.log("from");
      console.log(this.from_endpoint);
      console.log("to");
      console.log(this.to_endpoint);
      */
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

    // UI
    // TODO: Should this method be part of a UI class?

    Node.prototype.draw = function () {
      throw new Error("Synesthesia.Graph.Node(.draw): Not implemented.");
    };

    return Node;
  })();

  Synesthesia.Graph.Node.NoteSourceNode = (function () {
    function NoteSourceNode (params) {
      if (!params) return;

      Synesthesia.Graph.Node.apply(this, arguments);

      if (!Utilities.overrides(Synesthesia.Graph.Node.NoteSourceNode, this)) {
        console.error("Synesthesia.Graph.Node.NoteSourceNode: Subclass does not override.");
      }
    }

    NoteSourceNode.GlobalConnectionMap = new Utilities.Map();

    NoteSourceNode.prototype = Utilities.extend(
      new Synesthesia.Graph.Node()
    );

    NoteSourceNode.prototype.connectToNoteDestination = function (destination_node) {
      var connections = NoteSourceNode.GlobalConnectionMap.get(this);
      if (!connections) {
        connections = [];
        NoteSourceNode.GlobalConnectionMap.set(this, connections);
      }
      if (connections.indexOf(destination_node) == -1) {
        connections.push(destination_node);
      } else {
        console.warn("Synesthesia.Graph.Node.NoteSourceNode(.connectToNoteDestination): Already connected to the requested node.");
      }
    };

    NoteSourceNode.prototype.disconnectFromNoteDestination = function (destination_node) {
      var connections = NoteSourceNode.GlobalConnectionMap.get(this);
      if (!connections) {
        throw new Error("Synesthesia.Graph.Node.NoteSourceNode(.disconnectFromNoteDestination): Disconnect requested on a node that was not known to be connected.");
      }
      while (connections.indexOf(destination_node) != -1) {
        connections.splice(connections.indexOf(destination_node), 1);
      }
    };

    NoteSourceNode.prototype.distributeNotes = function (notes) {
      var connections = NoteSourceNode.GlobalConnectionMap.get(this);
      if (!connections) return;
      
      for (var i = 0; i < connections.length; i++) {
        connections[i].handleNotes(notes);
      }
    };

    return NoteSourceNode;
  })();

  Synesthesia.Graph.Node.NoteDestinationNode = (function () {
    function NoteDestinationNode (params) {
      if (!params) return;

      if(!Utilities.overrides(Synesthesia.Graph.Node.NoteDestinationNode, this)) {
        console.error("Synesthesia.Graph.Node.NoteDestinationNode: Subclass does not override.");
      }
    }

    NoteDestinationNode.prototype.handleNotes = function (notes) {
      throw new Error("Synesthesia.Graph.Node.NoteDestinationNode(.handleNotes): Not implemented.");
    };

    return NoteDestinationNode;
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
