import React from 'react';
import * as d3 from "d3";
import _ from 'lodash';

// properties
var width = 1000;
var maxRadius = 50;
var padding = 75;
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
  getInitialState() {
    return {
      flows: [],
    }
  },

  componentDidMount() {
    this.refs.canvas.width = width;
    this.ctx = this.refs.canvas.getContext('2d');
    this.ctx.globalCompositeOperation = 'overlay';

    var flows = this.generateFlowData(this.props.data);

    var height = _.maxBy(flows, 'totalLength').totalLength * 0.5 + 2 * padding;
    this.refs.canvas.height = height;
    _.each(flows, (flow) => {
      flow.centerY = height - padding;
    });

    this.calculateCircles(flows);
    var scorePositions = this.drawFlowsAndReturnPositions(flows);

    this.props.updateScorePositions(scorePositions);
    this.setState({flows});
  },

  // generate the flow line, given one event for one team
  generateFlowData(teams) {
    var xWidth = (width - 2 * padding) / (teams.length - 1);
    return _.map(teams, (team, i) => {
      var gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
      gradient.addColorStop(1, 'rgba(' + colors[team.country][0] + ',0.1)');
      gradient.addColorStop(0, 'rgba(' + colors[team.country][1] + ',0.1)');

      return {
        width: xWidth,
        centerX: xWidth * i + padding,
        stroke: gradient,
        fill: 'rgba(' + colors[team.gender] + ', 0.01)',
        radii: _.map(team.breakdown, (scores) => {
          return this.props.scales.radiusScale(scores[0]);
        }),
        points: _.map(team.processed, (scores) => {
          return generateCircleData(scores, this.props.scales.yScale);
        }),
        length: _.map(team.breakdown, (scores) => {
          return Math.floor(scores[1]) * 4;
        }),
        rotations: _.map(team.breakdown, (scores) => {
          return scores[1] / team.total;
        }),
        totalLength: Math.floor(team.total) * 4,
        elapsed: 0,
        data: team
      }
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
        this.ctx.strokeStyle = flow.stroke;

        var xOffset = 0;
        // for each of the interpolators, draw the circle length amount of times
        _.times(length, (i) => {
          this.ctx.beginPath();
          drawCount += 1;

          flow.centerY -= 0.5;
          xOffset = (_.last(flow.radii) / 3) *
            Math.sin(drawCount/flow.data.total * TWO_PI);
          this.ctx.setTransform(1, 0, 0, 1, flow.centerX + xOffset, flow.centerY);

          var points = interpolator(i / length);
          _.each(points, (pos) => {
            this.ctx.lineTo(pos.x, pos.y);
          });

          this.ctx.closePath();
          this.ctx.stroke();
        });

        // calculate the positions of each score
        var x1 = flow.centerX + xOffset;
        var maxX = _.maxBy(flow.circles[i + 1], 'x').x;
        var maxY = _.maxBy(flow.circles[i + 1], 'y').y;
        return {
          x1: x1,
          x2: x1 + maxX,
          y: flow.centerY,
          score: flow.data.breakdown[i + 1]
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
