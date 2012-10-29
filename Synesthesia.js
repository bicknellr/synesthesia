module.declare("Synesthesia",
["Utilities", "Synesthesia:UI"],
function (exports) {

  var Utilities = module.require("Utilities");

  var UI = module.require("Synesthesia:UI");

  var Synesthesia = (function () {
    function Synesthesia (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      if (typeof Synesthesia.AudioContext === "undefined") {
        throw new Error("Synesthesia: AudioContext not supported!");
      }
      this.context = new Synesthesia.AudioContext();

      this.container = this.params.container;

      this.UI = new UI({
        container: this.container
      });
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

    Synesthesia.prototype.getUI = function () {
      return this.UI;
    };

    return Synesthesia;
  })();

  return Synesthesia;
});
