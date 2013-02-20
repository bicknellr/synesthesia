module.declare("Synesthesia:NodeLibrary:KeyboardInput",
[
  "Utilities",
  "Synesthesia:Graph",
  "Synesthesia:Parallelism",
  "Synesthesia:UILibrary",
  "Synesthesia:Envelope"
],
function () {

  var Utilities = module.require("Utilities");

  var Graph = module.require("Synesthesia:Graph");
  var Parallelism = module.require("Synesthesia:Parallelism");
  var UILibrary = module.require("Synesthesia:UILibrary");

  var Envelope = module.require("Synesthesia:Envelope");

  var KeyboardInput = {};

  KeyboardInput.Node = (function () {
    function KeyboardInputNode (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.Node.NoteSourceNode.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.context = this.synesthesia.getContext();

      this.controller = this.params.controller;

      this.notes = {};

      window.addEventListener("keydown", this.keydown.bind(this), false);
      window.addEventListener("keyup", this.keyup.bind(this), false);

      this.keyToFrequencyMapping = function (keyCode) {
        var frequencies = {
            /* bottom row */
            90: 261.626, // Z
            83: 277.183, // S
            88: 293.665, // X
            68: 311.127, // D
            67: 329.628, // C
            
            86: 349.228, // V
            71: 369.994, // G
            66: 391.995, // B
            72: 415.305, // H
            78: 440.000, // N
            74: 466.164, // J
            77: 493.883, // M
            
            188: 523.251, // comma
            76: 554.365, // L
            190: 587.330, // period
            186: 622.254, // semicolon
            191: 659.255, // slash
            
            /* top row */
            81: 523.251, // Q
            50: 554.365, // 2
            87: 587.330, // W
            51: 622.254, // 3
            69: 659.255, // E
            
            82: 698.456, // R
            53: 739.989, // 5
            84: 783.991, // T
            54: 830.609, // 6
            89: 880.000, // Y
            55: 932.328, // &
            85: 987.767, // U
            
            73: 1046.50, // I
            57: 1108.73, // 9
            79: 1174.66, // O
            48: 1244.51, // 0
            80: 1318.51 // P
        };

        return frequencies[keyCode];
      };

      this.setInputDescriptors({});

      this.setOutputDescriptors({
        "notes": new Graph.Endpoint({
          name: "notes",
          node: this,
          descriptor: this.controller.getOutputDescriptors()["notes"],
          type: "notes",
          accepted_types: [
            "notes"
          ],
          direction: "output"
        })
      });

    }

    KeyboardInputNode.prototype = Utilities.extend(
      new Graph.Node.NoteSourceNode()
    );

    KeyboardInputNode.prototype.keydown = function (e) {
      if (this.notes["" + e.keyCode]) return;

      var frequency = this.keyToFrequencyMapping(e.keyCode);
      if (!frequency) return;

      var note = new Envelope.Note({
        frequency: frequency
      });

      this.notes["" + e.keyCode] = note;

      this.distributeNotes({
        source: this,
        on: [note]
      });
    };

    KeyboardInputNode.prototype.keyup = function (e) {
      if (!this.notes["" + e.keyCode]) return;

      this.distributeNotes({
        source: this,
        off: [this.notes["" + e.keyCode]]
      });

      delete this.notes["" + e.keyCode];
    };

    KeyboardInputNode.prototype.informConnected = function (endpoint, new_connection) {
      this.connectToNoteDestination(
        new_connection.getOppositeEndpoint(endpoint).getNode()
      );
    };

    KeyboardInputNode.prototype.informDisconnected = function (endpoint, rm_connection) {
      this.disconnectFromNoteDestination(
        rm_connection.getOppositeEndpoint(endpoint).getNode()
      );
    };

    return KeyboardInputNode;
  })();

  KeyboardInput.Controller = (function () {
    function KeyboardInputController (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      Graph.NodeController.apply(this, arguments);

      this.synesthesia = this.params.synesthesia;
      this.setInputDescriptors({});

      this.setOutputDescriptors({
        "notes": new Graph.EndpointDescriptor({
          name: "notes",
          node_controller: this,
          direction: "output",
          type: "notes",
          accepted_types: [
            "notes"
          ]
        })
      });

      this.ONLY_NODE = new KeyboardInput.Node({
        synesthesia: this.synesthesia,
        controller: this
      });

      // Must come after setting input/output descriptors.
      this.setParallelismManager(
        new Parallelism.ParallelismManager({
          synesthesia: this.synesthesia,
          node_controller: this
        })
      );

      this.ui_window = null;
    }

    KeyboardInputController.prototype = Utilities.extend(
      new Graph.NodeController()
    );

    // Graph.NodeController

    KeyboardInputController.prototype.informWindowPrepared = function (ui_window) {
      this.ui_window = ui_window;
      this.ui_window.setTitle("KeyboardInput");
    };

    KeyboardInputController.prototype.informConnected = function (endpoint, connection) {
    };

    KeyboardInputController.prototype.informDisconnected = function (endpoint, connection) {
    };

    KeyboardInputController.prototype.produceParallelizableNode = function () {
      return this.ONLY_NODE;
    };

    return KeyboardInputController;
  })();

  return KeyboardInput;
});
