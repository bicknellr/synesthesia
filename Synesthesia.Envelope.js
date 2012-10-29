module.declare("Synesthesia:Envelope",
[],
function () {
  var Envelope = {};

  Envelope.Note = (function () {
    function Note (params) {
      this.params = (typeof params !== "undefined" ? params : {});
      
      this.frequency = this.params.frequency || 0;
      this.velocity = this.params.velocity || 0;
    };

    return Note;
  })();

  return Envelope;
});
