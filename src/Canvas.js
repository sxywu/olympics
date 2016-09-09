import React from 'react';
import * as d3 from "d3";
import _ from 'lodash';

// properties
var maxRadius = 85;
var TWO_PI = 2 * Math.PI;
var colors = {
  'China': [[255,0,0], [255,255,0]],
  'United States': [[187, 19, 62], [0, 44, 119]],
  'Great Britain': [[0, 39, 118], [198, 12, 48]],
  'Italy': [[0, 146, 70], [206, 43, 55]],
  'Australia': [[0, 0, 139], [255, 0, 0]],
  'Malaysia': [[1, 0, 102], [255, 204, 0]],
  'Canada': [ [255, 255, 255], [255, 0, 0]],
  'F': [250,176,189],
  'M': [187,209,222]
};

// generate the data for just one of the circles in the flow line
// majority of this function is taken from
// Dan Gries's tutorial http://rectangleworld.com/blog/archives/462
// in particular the function setLinePoints
function generateCircleData(scores, yScale) {
  var circle = {
    first: {x: 0, y: 1}
  };
  var last = {x: 1, y: 1};
  var minY = 1;
  var maxY = 1;
  var point, nextPoint;
  var dx, newX, newY;

  // connect first point with the last
  circle.first.next = last;
  _.each(scores, (score) => {
    point = circle.first;
    while (point.next) {
      nextPoint = point.next;
      dx = nextPoint.x - point.x;
      newX = 0.5 * (point.x + nextPoint.x);
      newY = 0.5 * (point.y + nextPoint.y);
      // vary the y-pos by the score, but subtract it
      // by what is around the mid-point so that
      // some are positive and others are negative
      newY += dx * (yScale(score) * 2 - 1);

      var newPoint = {x: newX, y: newY};

      //min, max
      if (newY < minY) {
        minY = newY;
      }
      else if (newY > maxY) {
        maxY = newY;
      }

      // insert mid-point
      newPoint.next = nextPoint;
      point.next = newPoint;

      point = nextPoint;
    }
  })

  // normalize to values between 0 and 1
  if (maxY !== minY) {
    var normalizeRate = 1/(maxY - minY);
    point = circle.first;
    while (point != null) {
      point.y = normalizeRate*(point.y - minY);
      point = point.next;
    }
  }

  return circle;
}

function tweenPoints(circle1, circle2) {
  // interpolate all the points of the circles
  var interpolators = _.map(circle1, function(point1, i) {
    return {
      x: d3.interpolate(point1.x, circle2[i].x),
      y: d3.interpolate(point1.y, circle2[i].y)
    };
  });
  return function(t) {
    return _.map(interpolators, function(interpolate) {
      return {x: interpolate.x(t), y: interpolate.y(t)};
    });
  };
}

module.exports = React.createClass({
  componentDidMount() {
    this.refs.canvas.width = this.props.width;
    this.ctx = this.refs.canvas.getContext('2d');
    this.ctx.globalCompositeOperation = 'overlay';

    this.flows = this.generateFlowData(this.props.data);

    this.height = _.maxBy(this.flows, 'totalLength').totalLength * 0.5 + this.props.padding;
    this.refs.canvas.height = this.height;
    _.each(this.flows, (flow) => {
      flow.centerY = this.height - this.props.padding / 2;
    });

    this.calculateCircles(this.flows);
    this.updateCircleColors(this.flows, this.props.selected)
    var scorePositions = this.drawFlowsAndReturnPositions(this.flows);

    this.props.updatePositions(scorePositions, this.height);
  },

  componentWillReceiveProps(nextProps) {
    // don't rerender if nothing's changed:
    // 1. there was nothing selected and there still isn't
    // 2. there's something selected but it's the same as the last
    if ((!this.props.selected && !nextProps.selected) ||
      (this.props.selected && nextProps.selected &&
      this.props.selected.index === nextProps.selected.index)) {
      return;
    }
    // first reset transform and clear the canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.props.width, this.height);

    // reset each flow's y value
    _.each(this.flows, (flow) => {
      flow.centerY = this.height - this.props.padding / 2;
    });
    // recolor the circles
    this.updateCircleColors(this.flows, nextProps.selected)
    this.drawFlowsAndReturnPositions(this.flows);
  },

  // generate the flow line, given one event for one team
  generateFlowData(teams) {
    var xWidth = (this.props.width - 2 * this.props.padding) / (this.props.data.length - 1);
    return _.map(teams, (team, i) => {
      return {
        width: xWidth,
        centerX: xWidth * i + this.props.padding,
        radii: _.map(team.breakdown, (scores) => {
          return this.props.scales.radiusScale(scores[0]);
        }),
        points: _.map(team.processed, (scores) => {
          return generateCircleData(scores, this.props.scales.yScale);
        }),
        length: _.map(team.breakdown, (scores) => {
          return Math.floor(scores[1]) * 3.75;
        }),
        rotations: _.map(team.breakdown, (scores) => {
          return scores[1] / team.total;
        }),
        totalLength: Math.floor(team.total) * 3.75,
        elapsed: 0,
        data: team
      }
    });
  },

  updateCircleColors(flows, selected) {
    var grayGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
    grayGradient.addColorStop(1, 'rgba(102,102,102,0.01)');
    grayGradient.addColorStop(0, 'rgba(207,207,207,0.01)');

    _.each(flows, (flow) => {
      var colorGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
      colorGradient.addColorStop(1, 'rgba(' + colors[flow.data.country][0] + ',0.1)');
      colorGradient.addColorStop(0, 'rgba(' + colors[flow.data.country][1] + ',0.1)');

      flow.strokes = _.map(flow.interpolators, (interpolator, i) => {
        // if there's nothing selected, everything should be colored
        if (!selected) return colorGradient;
        // if something IS selected, only color the ones matching the event and round
        return selected.index === i ? colorGradient : grayGradient;
      });
    });
  },

  // given set of points making up a squiggly line
  // turn it into a squiggly imperfect circle
  // also calculate the interpolators for them
  calculateCircles(flows) {
    _.each(flows, (flow) => {
      flow.circles = [];
      flow.interpolators = [];
      var prevCircle = null;
      _.each(flow.points, function(points, i) {
        // calculate circles
        var point = points.first;
        var rotation = flow.rotations[i];
        var radii = flow.radii[i];
        var circle = [];

        var theta = TWO_PI * (point.x + rotation);
        var radius = radii * point.y;
        var x = radius * Math.cos(theta);
        var y = radius * Math.sin(theta);
        circle.push({x: x, y: y});

        while (point.next) {
          point = point.next;

          // given its x and y, calculate its theta and radius
          theta = TWO_PI * (point.x + rotation);
          radius = radii * point.y;

          x = radius * Math.cos(theta);
          y = radius * Math.sin(theta);

          circle.push({x: x, y: y});
        }
        flow.circles.push(circle);

        // now calculate the interpolators
        if (prevCircle) {
          var interpolators = tweenPoints(prevCircle, circle);
          flow.interpolators.push(interpolators);
        }

        prevCircle = circle;
      });
    });
  },

  // draw the flows and also return the positions that each score is at
  drawFlowsAndReturnPositions(flows) {
    return _.map(flows, (flow) => {
      var drawCount = 0;

      return _.map(flow.interpolators, (interpolator, i) => {
        var length = flow.length[i + 1];
        this.ctx.strokeStyle = flow.strokes[i];

        var xOffset = 0;
        // for each of the interpolators, draw the circle length amount of times
        _.times(length, (i) => {
          this.ctx.beginPath();
          drawCount += 1;

          var points = interpolator(i / length);
          var minX = _.minBy(points, 'x').x;
          var maxX = _.maxBy(points, 'x').x;

          flow.centerY -= 0.5;
          xOffset = (_.last(flow.radii) / 3) *
            Math.sin(drawCount/flow.data.total * TWO_PI) - (maxX - minX) / 2;
          this.ctx.setTransform(1, 0, 0, 1, flow.centerX + xOffset, flow.centerY);

          _.each(points, (pos) => {
            this.ctx.lineTo(pos.x, pos.y);
          });

          this.ctx.closePath();
          this.ctx.stroke();
        });

        // calculate the positions of each score
        var x1 = flow.centerX + xOffset;
        var maxX = _.maxBy(flow.circles[i + 1], 'x').x;
        return {
          x1: x1,
          x2: x1 + maxX,
          y: flow.centerY,
          index: i,
          score: flow.data.breakdown[i + 1],
          data: flow.data,
        };
      });
    });
  },

  render() {
    return (
      <canvas ref='canvas' />
    );
  }
});
