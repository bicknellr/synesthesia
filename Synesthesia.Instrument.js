module("Synesthesia.Instrument", ["Utilities", "Synesthesia", "Synesthesia.UI"], function () {

  var Utilities = require("Utilities");

  var Synesthesia = require("Synesthesia");

  Synesthesia.Instrument = (function () {
    function Instrument (params) {
      if (!params) return; // INTERFACE
      this.params = (typeof params !== "undefined" ? params : {});
      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.context;
      this.destination = this.context.createGainNode();
    };

    Instrument.prototype.connect = function (destination) {
      this.destination.connect(destination);
    };

    Instrument.prototype.handleInput = function () {
      throw new Error("Synesthesia.Instrument(.handleInput): Not implemented.");
    };

    return Instrument;
  })();

  Synesthesia.Instrument.Oscillator = (function () {
    function Oscillator (params) {
      Synesthesia.Instrument.apply(this, [params]);
      Synesthesia.UI.Drawable.apply(this, [params]);

      this.params = (typeof params !== "undefined" ? params : {});

      this.type = this.params.type || Oscillator.Type.SINE;

      this.osc_map = new Utilities.Map();

      // Defines the names of AudioParam values available on the underlying
      // node type used by this object.
      this.audioparams = [
        "frequency",
        "detune"
      ];
    }

    Oscillator.Type = {
      SINE: 0,
      SQUARE: 1,
      SAWTOOTH: 2,
      TRIANGLE: 3,
      CUSTOM: 4
    };

    Oscillator.prototype = Utilities.extend(
      new Synesthesia.UI.Drawable(),
      new Synesthesia.Instrument()
    );

    Oscillator.prototype.handleInput = function (input) {
      if (input.on) {
        for (var on_ix = 0; on_ix < input.on.length; on_ix++) {
          var cur_note = input.on[on_ix];
          var new_osc = this.context.createOscillator();
          new_osc.type = this.type;
          new_osc.frequency.setValueAtTime(cur_note.frequency, 0);
          new_osc.noteOn(0);
          new_osc.connect(this.destination);
          this.osc_map.set(cur_note, new_osc);
        }
      }
      if (input.off) {
        for (var off_ix = 0; off_ix < input.off.length; off_ix++) {
          var cur_note = input.off[off_ix];
          var cur_osc = this.osc_map.get(cur_note);
          cur_osc.disconnect();
          this.osc_map.remove(cur_note);
          delete cur_osc;
        }
      }
    };

    // UI

    /*
    Oscillator.prototype.draw = function (canvas) {

    };
    */

    return Oscillator;
  })();

});
