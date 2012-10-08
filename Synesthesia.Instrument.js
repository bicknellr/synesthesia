module("Synesthesia.Instrument",
["Utilities", "Synesthesia", "Synesthesia.AudioNode", "Synesthesia.UI"],
function () {

  var Utilities = require("Utilities");

  var Synesthesia = require("Synesthesia");

  Synesthesia.Instrument = (function () {
    function Instrument (params) {
      if (!params) return; // INTERFACE
      Synesthesia.AudioSourceNode.apply(this, arguments);

      this.params = (typeof params !== "undefined" ? params : {});

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.context;
      this.destination = this.context.createGainNode();
    };

    Instrument.prototype = Utilities.extend(
      new Synesthesia.AudioSourceNode()
    );

    Instrument.prototype.connect = function (destination) {
      this.destination.connect(destination);
    };

    Instrument.prototype.getDestination = function () {
      return this.destination;
    };

    Instrument.prototype.handleInput = function () {
      throw new Error("Synesthesia.Instrument(.handleInput): Not implemented.");
    };

    return Instrument;
  })();

  Synesthesia.Instrument.Oscillator = (function () {
    function Oscillator (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Synesthesia.UI.Node.apply(this, arguments);
      this.title = "Oscillator";
      
      Synesthesia.Instrument.apply(this, arguments);

      // BEGIN

      this.type = this.params.type || Oscillator.Type.SINE;

      this.osc_map = new Utilities.Map();

      // Defines the names of AudioParam values available on the underlying
      // node type used by this object.
      this.audioparams = [
        "frequency",
        "detune"
      ];

      this.div = null;
    }

    Oscillator.Type = {
      SINE: 0,
      SQUARE: 1,
      SAWTOOTH: 2,
      TRIANGLE: 3//,
      //CUSTOM: 4
    };

    Oscillator.prototype = Utilities.extend(
      new Synesthesia.UI.Node(),
      new Synesthesia.Instrument()
    );

    // Synesthesia.Instrument

    Oscillator.prototype.handleInput = function (input) {
      if (input.on) {
        for (var on_ix = 0; on_ix < input.on.length; on_ix++) {
          var cur_note = input.on[on_ix];
          var new_osc = this.context.createOscillator();
          new_osc.type = this.type;
          new_osc.frequency.setValueAtTime(cur_note.frequency, 0);
          new_osc.noteOn(0);
          new_osc.connect(this.getDestination());
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

    // Synesthesia.UI.Node

    Oscillator.prototype.getInputDescriptors = function () {
      return [
        { name: "notes",
          type: "notes"
        },
        { name: "frequency",
          type: "envelope",
          range: [0, 20000]
        },
        { name: "velocity",
          type: "envelope",
          range: [0, 1]
        }
      ];
    };

    Oscillator.prototype.getOutputDescriptors = function () {
      return [
        { name: "waveform",
          type: "AudioNode"
        }
      ];
    };

    Oscillator.prototype.informPrepared = function () {
      //Synesthesia.UI.Node.prototype.attachDiv.apply(this, arguments); // SUPER

      // TEST
      this.type_select = document.createElement("select");
        for (var type_name in Oscillator.Type) {
          if (!Oscillator.Type.hasOwnProperty(type_name)) continue;
          var new_type = document.createElement("option");
            new_type.innerHTML = type_name;
            new_type.value = Oscillator.Type[type_name];
          this.type_select.appendChild(new_type);
        }
        this.type_select.addEventListener("change", (function () {
          this.type = parseInt(this.type_select.item(this.type_select.selectedIndex).value);
        }).bind(this), false);
      this.div.appendChild(this.type_select);

      this.div.appendChild(
        document.createElement("br")
      );
      
      this.canvas = document.createElement("canvas");
        this.canvas.width = "300";
        this.canvas.height = "300";
      this.div.appendChild(this.canvas);
    };

    Oscillator.prototype.draw = function () {
      var ctx = this.canvas.getContext("2d");

      ctx.save();

        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        var notes = this.osc_map.getKeys();
        for (var i = 0; i < notes.length; i++) {
          ctx.beginPath();
          ctx.arc(
            this.canvas.width / 2, this.canvas.height / 2,
            notes[i].frequency / 10,
            0, 2 * Math.PI
          );
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.stroke();
        }

      ctx.restore();
    };

    return Oscillator;
  })();

});
