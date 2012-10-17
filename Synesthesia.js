module("Synesthesia", ["Utilities"], function (exports) {

  var Utilities = require("Utilities");

  var Synesthesia = (function () {
    function Synesthesia (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.inputs = [];

      this.input_mapping = new Utilities.Map();

      this.instruments = [];

      if (typeof Synesthesia.AudioContext === "undefined") {
        throw new Error("Synesthesia: AudioContext not supported!");
      }
      this.context = new Synesthesia.AudioContext();
    }

    Synesthesia.requestAnimationFrame = (
      window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : null ||
      window.webkitRequestAnimationFrame ? window.webkitRequestAnimationFrame.bind(window) : null
    );

    Synesthesia.AudioContext = window.AudioContext || window.webkitAudioContext;

    Synesthesia.prototype.getContext = function () {
      return this.context;
    };

    Synesthesia.prototype.getDestination = function () {
      return this.context.destination;
    };

    // Inputs
    Synesthesia.prototype.addInput = function (input) {
      this.inputs.push(input);
    };

    Synesthesia.prototype.removeInput = function (input) {
      return this.inputs.splice(this.inputs.indexOf(input), 1)[0];
    };

    Synesthesia.prototype.input = function (input) {
      var receiving_instruments = this.input_mapping.get(input.source);
      if (!receiving_instruments || receiving_instruments.length == 0) {
        return;
      }
      receiving_instruments.forEach(function (instrument) {
        instrument.handleInput(input);
      });
    };
    
    // I/O
    Synesthesia.prototype.mapInput = function (input, instrument) {
      var mapping = this.input_mapping.get(input);
      if (!mapping) {
        this.input_mapping.set(input, []);
        mapping = this.input_mapping.get(input);
      }

      mapping.push(instrument);
    };

    Synesthesia.prototype.unmapInput = function (input, instrument) {
      var mapping = this.input_mapping.get(input);
      if (!mapping) {
        return null;
      }

      return mapping.splice(mapping.indexOf(instrument), 1)[0];
    };

    // Instruments
    Synesthesia.prototype.addInstrument = function (instrument) {
      this.instruments.push(instrument);
    };

    Synesthesia.prototype.removeInstrument = function (instrument) {
      return this.instruments.splice(this.instruments.indexOf(instrument), 1)[0];
    };

    return Synesthesia;
  })();

  Synesthesia.Note = (function () {
    function Note (params) {
      this.params = (typeof params !== "undefined" ? params : {});
      
      this.frequency = this.params.frequency || 0;
      this.velocity = this.params.velocity || 0;
    };

    return Note;
  })();

  return Synesthesia;
});
