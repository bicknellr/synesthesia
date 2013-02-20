module.declare("Synesthesia:Parallelism",
[
  "Utilities",
  "Synesthesia:Graph"
],
function () {

  var Utilities = module.require("Utilities");

  var Graph = module.require("Synesthesia:Graph");
  
  var Parallelism = {};

  // Only for use in ParallelismManager.
  var GainUtilityNode = (function () {
      function GainUtilityNode (params) {
        this.params = (typeof params !== "undefined" ? params : {});

        Graph.Node.AudioSourceNode.apply(this, arguments);
        Graph.Node.AudioDestinationNode.apply(this, arguments);

        this.node = this.params.node;

        this.setInputDescriptors({
          "waveform": new Graph.Endpoint({
            name: "waveform",
            node: this,
            descriptor: new Graph.EndpointDescriptor({
              name: "waveform",
              node_controller: null,
              direction: "input",
              type: "AudioNode",
              accepted_types: [
                "AudioNode"
              ]
            }),
            direction: "input",
            type: "AudioNode",
            accepted_types: [
              "AudioNode"
            ]
          })
        });
        this.setOutputDescriptors({
          "waveform": new Graph.Endpoint({
            name: "waveform",
            node: this,
            descriptor: new Graph.EndpointDescriptor({
              name: "waveform",
              node_controller: null,
              direction: "output",
              type: "AudioNode",
              accepted_types: [
                "AudioNode"
              ]
            }),
            direction: "output",
            type: "AudioNode",
            accepted_types: [
              "AudioNode"
            ]
          })
        });
      }

      GainUtilityNode.prototype = Utilities.extend(
        new Graph.Node.AudioSourceNode(),
        new Graph.Node.AudioDestinationNode()
      );

      GainUtilityNode.prototype.getDestinationForInput = function () {
        return this.node;
      };

      GainUtilityNode.prototype.informConnected = function (endpoint, connection) {
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

      GainUtilityNode.prototype.informDisconnected = function (endpoint, connection) {
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

      return GainUtilityNode;
  })();

  Parallelism.ParallelismSource = (function () {
    function ParallelismSource (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.channels = [];

      this.listeners = [];
    }

    ParallelismSource.prototype.getChannels = function () {
      return this.channels.concat([]);
    };

    ParallelismSource.prototype.createChannel = function (new_channel_node) {
      if (this.channels.indexOf(new_channel_node) != -1) {
        throw new Error("ParallelismSource(.createChannel): Channel already exists.");
      }

      this.channels.push(new_channel_node);
      
      for (var listener_ix = 0; listener_ix < this.listeners.length; listener_ix++) {
        this.listeners[listener_ix]({
          type: "create",
          channel: new_channel_node
        });
      }
    };

    ParallelismSource.prototype.destroyChannel = function (rm_channel_node) {
      while (this.channels.indexOf(rm_channel_node) != -1) {
        this.channels.splice(
          this.channels.indexOf(rm_channel_node),
          1
        );
      }

      for (var listener_ix = 0; listener_ix < this.listeners.length; listener_ix++) {
        this.listeners[listener_ix]({
          type: "destroy",
          channel: rm_channel_node
        });
      }
    };

    ParallelismSource.prototype.addChannelListener = function (new_channel_listener) {
      if (typeof new_channel_listener != "function") {
        throw new Error("ParallelismSource(.addChannelListener): Listener is not a function.");
      }

      if (this.listeners.indexOf(new_channel_listener) == -1) {
        this.listeners.push(new_channel_listener);
      }
    };

    ParallelismSource.prototype.removeChannelListener = function (rm_channel_listener) {
      while (this.listeners.indexOf(rm_channel_listener) != -1) {
        this.listeners.splice(
          this.listeners.indexOf(rm_channel_listener),
          1
        );
      }
    };

    return ParallelismSource;
  })();

  Parallelism.EndpointParallelismManager = (function () {
    function EndpointParallelismManager (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.synesthesia = this.params.synesthesia;

      this.node_parallelism_manager = this.params.node_parallelism_manager;

      this.endpoint_desc = this.params.endpoint_desc;

      this.merge_gain = new GainUtilityNode({
        node: this.synesthesia.getContext().createGainNode()
      });

      this.conn_desc_to_conn_arr_map = new Utilities.Map();
    }

    EndpointParallelismManager.prototype.informConnected = function (new_connection_desc) {
      var local_pm = this.node_parallelism_manager;
      var opposite_endpoint_desc = new_connection_desc.getOppositeEndpoint(this.endpoint_desc);
      var opposite_pm = opposite_endpoint_desc.getNodeController().getParallelismManager();

      // Connect inbound node as appropriate.

      // All connections generated for this connection descriptor should be added here
      // and will be mapped at the end of the function.
      var connections_generated = [];

      if (local_pm.getSelectedParallelismSource() == opposite_pm.getSelectedParallelismSource()) {
      // If they are parallelized over the same thing, connect each corresponding node.

        var opposite_pkeys = opposite_pm.getActiveChannels(); // This should be exactly the same as calling from the local PM!

        for (var pkey_ix = 0; pkey_ix < opposite_pkeys.length; pkey_ix++) {
          var local_node_for_pkey = this.node_parallelism_manager.getNodeForChannel(opposite_pkeys[pkey_ix]);

          var opposite_node_for_pkey = opposite_pm.getNodeForChannel(opposite_pkeys[pkey_ix]);
          var opposite_endpoint_for_pkey = opposite_endpoint_desc.getEndpointForNode(opposite_node_for_pkey);

          var new_connection = new Graph.Connection({
            from_endpoint: opposite_endpoint_for_pkey,
            to_endpoint: this.endpoint_desc.getEndpointForNode(local_node_for_pkey)
          });
          opposite_endpoint_for_pkey.informConnected(
            new_connection
          );
          this.endpoint_desc.getEndpointForNode(local_node_for_pkey).informConnected(
            new_connection
          );

          connections_generated.push(new_connection);
        }
      } else {

        // This code may eliminate the need for merge gains...
        var local_pkeys = local_pm.getActiveChannels();
        var opposite_pkeys = opposite_pm.getActiveChannels();

        for (var local_pkey_ix = 0; local_pkey_ix < local_pkeys.length; local_pkey_ix++) {
          var local_node = local_pm.getNodeForChannel(local_pkeys[local_pkey_ix]);
          var local_endpoint = this.endpoint_desc.getEndpointForNode(local_node);

          for (var opposite_pkey_ix = 0; opposite_pkey_ix < opposite_pkeys.length; opposite_pkey_ix++) {
            var opposite_node = opposite_pm.getNodeForChannel(opposite_pkeys[opposite_pkey_ix]);
            var opposite_endpoint = opposite_endpoint_desc.getEndpointForNode(opposite_node);

            var new_connection = new Graph.Connection({
              from_endpoint: opposite_endpoint,
              to_endpoint: local_endpoint 
            });
            opposite_endpoint.informConnected(
              new_connection
            );
            local_endpoint.informConnected(
              new_connection
            );

            connections_generated.push(new_connection);
          }
        }
      }

      this.conn_desc_to_conn_arr_map.set(new_connection_desc, connections_generated);
    };

    EndpointParallelismManager.prototype.informDisconnected = function (rm_connection_desc) {
      var connections_associated = this.conn_desc_to_conn_arr_map.get(rm_connection_desc);
      
      for (var conn_ix = 0; conn_ix < connections_associated.length; conn_ix++) {
        var cur_conn = connections_associated[conn_ix];

        cur_conn.getFromEndpoint().getNode().informDisconnected(
          cur_conn.getFromEndpoint(),
          cur_conn
        );
        cur_conn.getToEndpoint().getNode().informDisconnected(
          cur_conn.getToEndpoint(),
          cur_conn
        );
      }

      this.conn_desc_to_conn_arr_map.remove(rm_connection_desc);
    };

    return EndpointParallelismManager;
  })();

  Parallelism.ParallelismManager = (function () {
    function ParallelismManager (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.synesthesia = this.params.synesthesia;

      this.node_controller = this.params.node_controller;

      this.output_desc_to_endpoint_pm_map = new Utilities.Map(); // Maps output descriptors to their endpoint PMs.
      this.endpoint_pm_to_conn_desc_map = new Utilities.Map(); // Maps endpoint PMs to their associated connection descriptors.
      // Build endpoint PM map.
      (function () {
        var output_endpoint_descriptors = this.node_controller.getOutputDescriptorsArray();
        for (var endpoint_desc_ix = 0; endpoint_desc_ix < output_endpoint_descriptors.length; endpoint_desc_ix++) {
          var cur_endpoint_desc = output_endpoint_descriptors[endpoint_desc_ix];

          var new_endpoint_pm = new Parallelism.EndpointParallelismManager({
            synesthesia: this.synesthesia,
            node_parallelism_manager: this,
            endpoint_desc: cur_endpoint_desc
          });

          // Map output endpoint descriptor to endpoint PM.
          this.output_desc_to_endpoint_pm_map.set(
            cur_endpoint_desc,
            new_endpoint_pm
          );

          // Initialize endpoint PM connection descriptor list to empty.
          this.endpoint_pm_to_conn_desc_map.set(
            new_endpoint_pm,
            []
          );
        }
      }).call(this);

      // By default, no parallelization.
      this.selected_parallelism_source = null;
      this.channel_to_node_map = new Utilities.Map();

      // Initiate the default single channel.
      this.channel_to_node_map.set(
        null,
        this.node_controller.produceParallelizableNode()
      );
    };

    ParallelismManager.prototype.getDownstreamParallelismManagers = function () {
      var results = new Utilities.Set();

      var outputs = this.node_controller.getOutputDescriptorsArray();
      for (var output_ix = 0; output_ix < outputs.length; output_ix++) {
        var cur_output = outputs[output_ix];
        
        var endpoints = cur_output.getEndpoints();
        for (var endpoint_ix = 0; endpoint_ix < endpoints.length; endpoint_ix++) {
          var cur_endpoint = endpoints[endpoint_ix];

          var connections = cur_endpoint.getConnections();
          for (var conn_ix = 0; conn_ix < connections.length; conn_ix++) {
            var cur_connection = connections[conn_ix];

            var other_pm = cur_connection.getOppositeEndpoint(cur_endpoint).getDescriptor().getNodeController().getParallelismManager();
            results.add(other_pm);
          }
        }
      }

      return results.toArray();
    };

    ParallelismManager.prototype.getUpstreamParallelismManagers = function () {
      var results = new Utilities.Set();

      var inputs = this.node_controller.getInputDescriptorsArray();
      for (var input_ix = 0; input_ix < inputs.length; input_ix++) {
        var cur_input = inputs[input_ix];
        
        var endpoints = cur_input.getEndpoints();
        for (var endpoint_ix = 0; endpoint_ix < endpoints.length; endpoint_ix++) {
          var cur_endpoint = endpoints[endpoint_ix];

          var connections = cur_endpoint.getConnections();
          for (var conn_ix = 0; conn_ix < connections.length; conn_ix++) {
            var cur_connection = connections[conn_ix];

            var other_pm = cur_connection.getOppositeEndpoint(cur_endpoint).getDescriptor().getNodeController().getParallelismManager();
            results.add(other_pm);
          }
        }
      }

      return results.toArray();
    };

    ParallelismManager.prototype.selectParallelismSource = function (params) {
      var parallelism_source = params.source;

      var potential_sources = this.getAvailableParallelismSources();
      if (potential_sources.indexOf(parallelism_source) == -1) {
        console.warn("ParallelismManager(.selectParallelismSource): Attempted to select an unavailable / unknown parallelism source.");
      }
      
      // SET NEW SOURCE
      this.selected_parallelism_source = parallelism_source;

      this.hardRewire();
    };

    ParallelismManager.prototype.hardRewire = function () {
      // Disconnect and reconnect everything to effectively rearrange the graph as desired.

      var output_endpoint_descriptors = this.node_controller.getOutputDescriptorsArray();
      for (var endpoint_desc_ix = 0; endpoint_desc_ix < output_endpoint_descriptors.length; endpoint_desc_ix++) {
        var cur_endpoint_desc = output_endpoint_descriptors[endpoint_desc_ix];

        var cur_endpoint_pm = this.output_desc_to_endpoint_pm_map.get(cur_endpoint_desc);
        var conn_descs_for_endpoint_pm = this.endpoint_pm_to_conn_desc_map.get(cur_endpoint_pm);
        for (var conn_desc_ix = 0; conn_desc_ix < conn_descs_for_endpoint_pm.length; conn_desc_ix++) {
          var cur_conn_desc = conn_descs_for_endpoint_pm[conn_desc_ix];

          // Force the endpoint PM to reorganize the graph for every connection it manages.
          cur_endpoint_pm.informDisconnected(cur_conn_desc);
          cur_endpoint_pm.informConnected(cur_conn_desc);
        }
      }
    };

    ParallelismManager.prototype.getSelectedParallelismSource = function () {
      return this.selected_parallelism_source;
    };

    ParallelismManager.prototype.getAvailableParallelismSources = function () {
      var available_sources = new Utilities.Set();
      available_sources.add(null);

      var input_nodes = [];
      var input_descriptors = this.node_controller.getInputDescriptorsArray();
      for (var endpoint_desc_ix = 0; endpoint_desc_ix < input_descriptors.length; endpoint_desc_ix++) {
        var cur_endpoint_desc = input_descriptors[endpoint_desc_ix];

        var connection_descriptors = cur_endpoint_desc.getConnectionDescriptors();
        for (var conn_desc_ix = 0; conn_desc_ix < connection_descriptors.length; conn_desc_ix++) {
          var cur_conn_desc = connection_descriptors[conn_desc_ix];

          var other_node = cur_conn_desc.getOppositeEndpoint(cur_endpoint_desc).getNodeController();

          var inbound_parallelism_source = other_node.getParallelismManager().getSelectedParallelismSource();
          if (inbound_parallelism_source) {
            available_sources.add(inbound_parallelism_source);
          }
        }
      }

      return available_sources.toArray();
    };

    ParallelismManager.prototype.getActiveChannels = function () {
      return this.channel_to_node_map.getKeys().concat([]);
    };

    ParallelismManager.prototype.getNodeForChannel = function (channel) {
      return this.channel_to_node_map.get(channel);
    };

    ParallelismManager.prototype.informConnected = function (endpoint_desc, connection_desc) {
      // Upstream (output-end) PM connects and informs nodes ONLY.

      if (this.node_controller.getOutputDescriptorsArray().indexOf(endpoint_desc) != -1) {
        // We are the upstream PM; continue.
        console.log("ParallelismManager(.informConnected): Connecting output...");
      } else if (this.node_controller.getInputDescriptorsArray().indexOf(endpoint_desc) != -1) {
        // We are the downstream PM; do nothing.
        console.log("ParallelismManager(.informConnected): (input-end)");
        return;
      } else {
        // The endpoint given wasn't found, something bad happened.
        throw new Error("ParallelismManager(.informConnected): The given endpoint descriptor doesn't seem to exist in the NodeController's set of endpoints.");
      }

      // Delegate connection to the proper endpoint PM.
      var endpoint_pm = this.output_desc_to_endpoint_pm_map.get(endpoint_desc)
      endpoint_pm.informConnected(connection_desc);

      // Update the endpoint PM to connection descriptor list map.
      this.endpoint_pm_to_conn_desc_map.get(endpoint_pm).push(connection_desc);
    };

    ParallelismManager.prototype.informDisconnected = function (endpoint_desc, connection_desc) {
      // Upstream (output-end) PM disconnects and informs nodes ONLY.

      if (this.node_controller.getOutputDescriptorsArray().indexOf(endpoint_desc) != -1) {
        // We are the upstream PM; continue.
        console.log("ParallelismManager(.informDisconnected): Disconnecting output...");
      } else if (this.node_controller.getInputDescriptorsArray().indexOf(endpoint_desc) != -1) {
        // We are the downstream PM; do nothing.
        console.log("ParallelismManager(.informDisconnected): (input-end)");
        return;
      } else {
        // The endpoint given wasn't found, something bad happened.
        throw new Error("ParallelismManager(.informDisconnected): The given endpoint descriptor doesn't seem to exist in the NodeController's set of endpoints.");
      }
 
      // Delegate disconnection to the proper endpoint PM.
      var endpoint_pm = this.output_desc_to_endpoint_pm_map.get(endpoint_desc)
      endpoint_pm.informDisconnected(connection_desc);

      // Update the endpoint PM to connection descriptor list map.
      this.endpoint_pm_to_conn_desc_map.get(endpoint_pm).splice(
        this.endpoint_pm_to_conn_desc_map.get(endpoint_pm).indexOf(connection_desc),
        1
      );
    };

    return ParallelismManager;
  })();

  return Parallelism;
});
