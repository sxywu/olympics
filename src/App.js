import React from 'react';
import * as d3 from "d3";
import _ from 'lodash';
import data from './data/diving.json';
import Section from './Section.js';

module.exports = React.createClass({
  getInitialState() {
    return {
      data: this.processData(data),
    }
  },

  processData(data) {
    var maxRadius = 50;
    this.radiusScale = d3.scaleLog().range([maxRadius / 4, maxRadius]);
    this.yScale = d3.scaleLinear().range([0, 1]);

    _.each(data, (d) => {
      // create an artifical first score
      d.breakdown.unshift(d.breakdown[0]);
      d.processed = _.map(d.breakdown, function(score) {
        return _.map(score[2], function(num) {return num * score[0]});
      });
    });

    var difficulty = _.chain(data).map('breakdown').flatten().map(0).value();
    var maxDiff = _.max(difficulty);
    var scores = _.chain(data).map('processed').flattenDeep().value();
    var minY = _.min(scores);
    var maxY = _.max(scores);

    this.radiusScale.domain([1, maxDiff]);
    this.yScale.domain([minY, maxY]);

    return data;
  },

  render() {
    var women = _.filter(this.state.data, (d) => d.gender === 'W');
    var men = _.filter(this.state.data, (d) => d.gender === 'M');
    var scales = {radiusScale: this.radiusScale, yScale: this.yScale};

    return (
      <div>
        <Section data={women} scales={scales} />
        <Section data={men} scales={scales} />
      </div>
    );
  }
});
