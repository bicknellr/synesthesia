module("Synesthesia.AudioNode",
["Utilities", "Synesthesia"],
function () {

  var Utilities = require("Utilities");
  
  var Synesthesia = require("Synesthesia");

  Synesthesia.AudioNode = (function () {
    function AudioNode (params) {
      if (!params) return; // INTERFACE
    }

    AudioNode.prototype.getDestination = function () {
      throw new Error("Synesthesia.AudioNode(.getDestination): Not implemented.");
    };

    AudioNode.prototype.connect = function () {
      throw new Error("Synesthesia.AudioNode(.connect): Not implemented.");
    };

    AudioNode.prototype.disconnect = function () {
      throw new Error("Synesthesia.AudioNode(.disconnect): Not implemented.");
    };

    AudioNode.prototype.getParameters = function () {
      throw new Error("Synesthesia.AudioNode(.getParameters): Not implemented.");
    };

    AudioNode.prototype.setParameter = function () {
      throw new Error("Synesthesia.AudioNode(.setParameter): Not implemented.");
    };

    return AudioNode;
  })();

  Synesthesia.AudioSourceNode = (function () {
    function AudioSourceNode (params) {
      if (!params) return; // INTERFACE
      Synesthesia.AudioNode.apply(this, arguments);
    };
    
    AudioSourceNode.prototype = Utilities.extend(
      new Synesthesia.AudioNode()
    );

    return AudioSourceNode;
  })();

  Synesthesia.AudioProcessingNode = (function () {
    function AudioProcessingNode (params) {
      if (!params) return; // INTERFACE
      Synesthesia.AudioSourceNode.apply(this, arguments);
    };
    
    AudioProcessingNode.prototype = Utilities.extend(
      new Synesthesia.AudioSourceNode()
    );

    return AudioProcessingNode;
  })();
});
