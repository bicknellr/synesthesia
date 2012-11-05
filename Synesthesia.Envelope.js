module.declare("Synesthesia:Envelope",
[],
function () {
  var Envelope = {};
  
  Envelope.Path = (function () {
    function Path (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.points = [];
    }

    Path.prototype.addPoint = function (new_point) {
      this.points.push(new_point);
    };

    Path.prototype.getPoints = function () {
      return [].concat(this.points);
    };

    Path.prototype.removePoint = function (rm_point) {
      if (this.points.indexOf(rm_point) == -1) return null;

      return this.points.splice(
        this.points.indexOf(rm_point),
        1
      );
    };

    Path.prototype.applyToAudioParamWithTimeOffset = function (audioparam, time_offset) {
      for (var point_ix = 0; point_ix < this.points.length; point_ix++) {
        var cur_point = this.points[point_ix];
        console.log("applying " + cur_point.getTransition());
        switch (cur_point.getTransition()) {
          case Envelope.Point.Transition.SET:
            audioparam.setValueAtTime(
              cur_point.getValue(),
              cur_point.getTime() + time_offset
            );
            break;
          case Envelope.Point.Transition.LINEAR:
            audioparam.linearRampToValueAtTime(
              cur_point.getValue(),
              cur_point.getTime() + time_offset
            );
            break;
          case Envelope.Point.Transition.EXPONENTIAL:
            audioparam.exponentialRampToValueAtTime(
              cur_point.getValue(),
              cur_point.getTime() + time_offset
            );
            break;
          case Envelope.Point.Transition.EXPONENTIAL_TARGET:
            audioparam.setTargetAtTime(
              cur_point.getValue(),
              cur_point.getTime() + time_offset,
              cur_point.getTimeConstant()
            );
            break;
          case Envelope.Point.Transition.CURVE:
            audioparam.setValueCurveAtTime(
              cur_point.getCurve(),
              cur_point.getTime() + time_offset,
              cur_point.getDuration()
            );
            break;
          default:
            console.error("Envelope.Path: Unrecognized transition type: " + cur_point.getTransition() + ".")
            break;
        }
      }
    };

    return Path;
  })();

  Envelope.Point = (function () {
    function Point (params) {
      this.params = (typeof params !== "undefined" ? params : {});

      this.value = this.params.value || 0;
      this.time = this.params.time || 0;
      this.transition = this.params.transition || Envelope.Point.Transition.SET;

      this.time_constant = this.params.time_constant || 0;

      this.curve = this.params.curve || [0];
      this.duration = this.params.duration || 0;
    }

    Point.Transition = {
      SET: 0,
      LINEAR: 1,
      EXPONENTIAL: 2,
      EXPONENTIAL_TARGET: 3,
      CURVE: 4
    };

    Point.prototype.getValue = function () {
      return this.value;
    };

    Point.prototype.setValue = function (new_value) {
      this.value = new_value;
    };

    Point.prototype.getTime = function () {
      return this.time;
    };

    Point.prototype.setTime = function (new_time) {
      this.time = new_time;
    };

    Point.prototype.getTransition = function () {
      return this.transition;
    };

    Point.prototype.setTransition = function (new_transition) {
      this.transition = new_transition;
    };

    //

    Point.prototype.getTimeConstant = function () {
      return this.time_constant;
    };

    Point.prototype.setTimeConstant = function (new_time_constant) {
      this.time_constant = new_time_constant;
    };

    //

    Point.prototype.getCurve = function () {
      return this.curve;
    };

    Point.prototype.setCurve = function (new_curve) {
      this.curve = new_curve;
    };

    Point.prototype.getDuration = function () {
      return this.duration;
    };

    Point.prototype.setDuration = function (new_duration) {
      this.duration = new_duration;
    };

    return Point;
  })();

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
