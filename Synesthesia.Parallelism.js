module.declare("Synesthesia:Parallelism",
[
  "Utilities"
],
function () {

  var Utilities = module.require("Utilities");
  
  var Parallelism = {};

  Parallelism.ParallelismManager = (function () {
    function ParallelismManager (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.synesthesia = this.params.synesthesia;

      this.node_controller = this.params.node_controller;

      this.is_source = (typeof this.params.is_source !== "undefined" ? this.params.is_source : false);
    };

    ParallelismManager.prototype.informConnected = function (endpoint_desc, connection_desc) {
      if (this.node_controller.getInputDescriptorsArray().indexOf(endpoint_desc) != -1) {
        console.log("ParallelismManager(.informConnected): Connected input.");
      } else if (this.node_controller.getOutputDescriptorsArray().indexOf(endpoint_desc) != -1) {
        console.log("ParallelismManager(.informConnected): Connected output.");
      } else {
        throw new Error("ParallelismManager(.informConnected): The given endpoint descriptor doesn't seem to exist in the NodeController's set of endpoints.");
      }
    };

    ParallelismManager.prototype.informDisconnected = function (endpoint_desc, connection_desc) {
      if (this.node_controller.getInputDescriptorsArray().indexOf(endpoint_desc) != -1) {
        console.log("ParallelismManager(.informDisconnected): Disconnected input.");
      } else if (this.node_controller.getOutputDescriptorsArray().indexOf(endpoint_desc) != -1) {
        console.log("ParallelismManager(.informDisconnected): Disconnected output.");
      } else {
        throw new Error("ParallelismManager(.informDisconnected): The given endpoint descriptor doesn't seem to exist in the NodeController's set of endpoints.");
      }
    };

    return ParallelismManager;
  })();

  return Parallelism;
});
