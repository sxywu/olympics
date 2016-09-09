import React from 'react';
import * as d3 from "d3";
import _ from 'lodash';
import data from './data/diving.json';
import Section from './Section.js';
import Notes from './Notes.js';

module.exports = React.createClass({
  getInitialState() {
    return {
      width: 1200,
      padding: 175,
      allData: this.processData(data),
    }
  },

  processData(data) {
    var maxRadius = 80;
    this.radiusScale = d3.scaleLinear().range([maxRadius / 20, maxRadius]);
    this.yScale = d3.scaleLinear().range([0, 1]);

    data = _.chain(data)
      .sortBy((d) => new Date(d.date))
      .map((d) => {
        // create an artifical first score
        d.breakdown.unshift(d.breakdown[0]);
        d.processed = _.map(d.breakdown, function(score) {
          return _.map(score[2], function(num) {return num * score[0]});
        });
        return d;
      }).value();

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
    var scales = {radiusScale: this.radiusScale, yScale: this.yScale};
    var sections = _.chain(this.state.data)
      .groupBy('event')
      .map((data) => {
        return (<Section data={data} scales={scales} />);
      }).value();

    var style = {
      width: this.state.width,
      margin: 'auto',
    };
    var notesStyle = {
      width: this.state.width - this.state.padding,
      padding: this.state.padding / 6 + 'px ' + this.state.padding / 2 + 'px',
      fontSize: 14,
    }

    return (
      <div style={style}>
        <Notes style={notesStyle} filename='header' />
        {sections}
      </div>
    );
  }
});
