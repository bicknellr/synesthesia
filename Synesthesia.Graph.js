/*
  Synesthesia:Graph

    This module handles the internal representation of the graph. This
    describes how nodes are connected, the ways those connections are
    managed and the mechanism by which each of those connections has
    the attributes associated with it propagated through the graph.
    Propagation methods depend upon the type of information and which
    node is oriented as the source or destination for that type.

    This module should not have an associated CSS file.
    No part of this file should make reference to any type of display mechanism or properties.
*/
module.declare("Synesthesia:Graph",
["Utilities"],
function () {

  var Utilities = module.require("Utilities");
  
  var Graph = {};

  Graph.Endpoint = (function () {
    function Endpoint (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.node = this.params.node;
      if (!Utilities.conforms(Graph.Node, this.node)) {
        throw new Error("Graph.Endpoint: Given object is not a valid node.");
      }

      this.name = this.params.name;

      this.type = this.params.type;
      if (Endpoint.Types.indexOf(this.type) == -1) {
        throw new Error("Graph.Endpoint: Invalid type '" + this.type + "'.");
      }

      this.accepted_types = this.params.accepted_types;
      for (var i = 0; i < this.accepted_types.length; i++) {
        if (Endpoint.Types.indexOf(this.accepted_types[i]) == -1) {
          throw new Error("Graph.Endpoint: Invalid accepted type '" + this.accpeted_types[i] + "'.");
        }
      }

      this.direction = this.params.direction;
      if (Endpoint.Directions.indexOf(this.direction) == -1) {
        throw new Error("Graph.Endpoint: Invalid direction.");
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

  Graph.Connection = (function () {
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

  Graph.Node = (function () {
    function Node (params) {
      if (!params) return; // INTERFACE
      
      this.input_descriptors = {};
      this.output_descriptors = {};
    }

    Node.prototype.setInputDescriptors = function (descriptors) {
      this.input_descriptors = descriptors;
    };

    Node.prototype.setOutputDescriptors = function (descriptors) {
      this.output_descriptors = descriptors;
    };

    /*
    Requests an array containing objects describing the inputs / outputs.
    The objects in this array are of type Graph.EndpointDescriptor
    */
    Node.prototype.getInputDescriptors = function () {
      var o = new Object();
      Utilities.copy_properties(this.input_descriptors, o);
      return o;
    };

    Node.prototype.getOutputDescriptors = function () {
      var o = new Object();
      Utilities.copy_properties(this.output_descriptors, o);
      return o;
    };

    Node.prototype.getInputDescriptorsArray = function () {
      var descriptors = [];
      for (var descriptor_name in this.input_descriptors) {
        if (!this.input_descriptors.hasOwnProperty(descriptor_name)) continue;

        descriptors.push(this.input_descriptors[descriptor_name]);
      }
      return descriptors;
    };

    Node.prototype.getOutputDescriptorsArray = function () {
      var descriptors = [];
      for (var descriptor_name in this.output_descriptors) {
        if (!this.output_descriptors.hasOwnProperty(descriptor_name)) continue;

        descriptors.push(this.output_descriptors[descriptor_name]);
      }
      return descriptors;
    };

    // Informs the node that a given connection has been connected to / disconnected from the given endpoint.
    Node.prototype.informConnected = function (endpoint, connection) {
      throw new Error("Graph.Node(.informConnected): Not implemented.");
    };

    Node.prototype.informDisconnected = function (endpoint, connection) {
      throw new Error("Graph.Node(.informDisconnected): Not implemented.");
    };

    return Node;
  })();

  Graph.Node.NoteSourceNode = (function () {
    function NoteSourceNode (params) {
      if (!params) return;

      Graph.Node.apply(this, arguments);

      if (!Utilities.overrides(Graph.Node.NoteSourceNode, this)) {
        console.error("Graph.Node.NoteSourceNode: Subclass does not override.");
      }
    }

    NoteSourceNode.GlobalConnectionMap = new Utilities.Map();

    NoteSourceNode.prototype = Utilities.extend(
      new Graph.Node()
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
        console.warn("Graph.Node.NoteSourceNode(.connectToNoteDestination): Already connected to the requested node.");
      }
    };

    NoteSourceNode.prototype.disconnectFromNoteDestination = function (destination_node) {
      var connections = NoteSourceNode.GlobalConnectionMap.get(this);
      if (!connections) {
        throw new Error("Graph.Node.NoteSourceNode(.disconnectFromNoteDestination): Disconnect requested on a node that was not known to be connected.");
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

  Graph.Node.NoteDestinationNode = (function () {
    function NoteDestinationNode (params) {
      if (!params) return;

      if(!Utilities.overrides(Graph.Node.NoteDestinationNode, this)) {
        console.error("Graph.Node.NoteDestinationNode: Subclass does not override.");
      }
    }

    NoteDestinationNode.prototype.handleNotes = function (notes) {
      throw new Error("Graph.Node.NoteDestinationNode(.handleNotes): Not implemented.");
    };

    return NoteDestinationNode;
  })();

  Graph.Node.AudioNode = (function () {
    function AudioNode () {
      Graph.Node.apply(this, arguments);
    }
    
    AudioNode.prototype = Utilities.extend(
      new Graph.Node()
    );

    return AudioNode;
  })();

  Graph.Node.AudioSourceNode = (function () {
    function AudioSourceNode () {
      Graph.Node.AudioNode.apply(this, arguments);

      this.src_dest_map = new Utilities.Map();
    }

    AudioSourceNode.prototype = Utilities.extend(
      new Graph.Node.AudioNode()
    );

    AudioSourceNode.GlobalConnectionMap = new Utilities.Map();

    AudioSourceNode.prototype.connectSourceToDestination = function (source_node, destination_node) {
      var connections = AudioSourceNode.GlobalConnectionMap.get(source_node);
      if (!connections) {
        connections = [];
        AudioSourceNode.GlobalConnectionMap.set(source_node, connections);
      }

      // Prevent copies of connections.
      if (connections.indexOf(destination_node) != -1) {
        return;
      }

      connections.push(destination_node);
      source_node.connect(destination_node);
    };

    AudioSourceNode.prototype.disconnectSourceFromDestination = function (source_node, destination_node) {
      var connections = AudioSourceNode.GlobalConnectionMap.get(source_node);
      if (!connections || connections.length == 0) {
        throw new Error("Graph.Node.AudioSourceNode(.disconnectSourceFromDestination): Disconnect requested on a node that was not known to be connected.");
      }

      // Remove all copies (only one expected) of the connection.
      while (connections.indexOf(destination_node) != -1) {
        connections.splice(connections.indexOf(destination_node), 1);
      }

      // Disconnect the source node (from all).
      source_node.disconnect();

      // Reconnect all other nodes.
      for (var i = 0; i < connections.length; i++) {
        source_node.connect(connections[i]);
      }
    };

    return AudioSourceNode;
  })();

  Graph.Node.AudioDestinationNode = (function () {
    function AudioDestinationNode () {
      Graph.Node.AudioNode.apply(this, arguments);

      this.destination_map = new Utilities.Map();
    }

    AudioDestinationNode.prototype = Utilities.extend(
      new Graph.Node.AudioNode()
    );

    AudioDestinationNode.prototype.getDestinationForInput = function (input_endpoint) {
      throw new Error("Graph.Node.AudioDestinationNode(.getDestinationForInput): Not implemented.");
    };

    return AudioDestinationNode;
  })();

  return Graph;
});
