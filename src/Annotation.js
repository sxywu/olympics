import React from 'react';
import * as d3 from "d3";
import _ from 'lodash';

var colors = {
  gold: [255, 215, 0],
  silver: [192, 192, 192],
  bronze: [165, 113, 100],
};

module.exports = React.createClass({
  render() {
    var style = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: this.props.width,
    };

    var format1 = d3.format('.1f');
    var format2 = d3.format('.2f');
    var annotations = _.map(this.props.scorePositions, (pos) => {
      var fontSize = 10;
      var posStyle = {
        position: 'absolute',
        fontSize,
        top: pos.y - 2 * fontSize,
        left: pos.x1,
        paddingLeft: pos.x2 - pos.x1 + 10,
        borderBottom: '1px solid',
        textAlign: 'right',
        cursor: 'pointer',
      };
      return (
        <div style={posStyle}>
          {format1(pos.score[0])} <br />
          {format2(pos.score[1])}
        </div>
      );
    });

    // events and countries for the flows
    var padding = 5;
    var xWidth = (this.props.width - 2 * this.props.padding - 2 * padding) /
      (this.props.data.length - 1);
    var eventsStyle = {
      marginLeft: this.props.padding - (xWidth + 2 * padding) / 2,
    };
    var events = _.chain(this.props.data)
      .groupBy((data) => data.event)
      .map((event, key) => {
        var eventStyle = {
          width: xWidth * event.length,
          marginTop: this.props.height - this.props.padding,
          // only the first one will have margin
          // marginLeft: (i === 1 ? this.props.padding - (xWidth / 2) : 0),
          margin: 2 * padding,
          padding: padding + 'px 0',
          borderTop: '1px solid',
          textAlign: 'center',
          display: 'inline-block',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
        };
        var countries = _.map(event, (country) => {
          var countryStyle = {
            width: xWidth - 6 * padding,
            // left: i * xWidth,
            margin: 2 * padding,
            padding,
            borderTop: '1px solid',
            lineHeight: '18px',
            display: 'inline-block',
          };
          // dot for medals
          var dotSize = 10;
          var dotStyle = {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize,
            backgroundColor: 'rgb(' + colors[country.medal] + ')',
            margin: '5px auto',
          };
          return (
            <div style={countryStyle}>
              <div style={dotStyle}></div>
              <div style={{fontSize: 14}}>{country.country}</div>
              <div style={{fontSize: 10}}>{format2(country.total)}</div>
              <div style={{fontSize: 10}}>{country.athletes.join(' & ')}</div>
            </div>
          );
        });

        return (
          <div style={eventStyle}>
            <div style={{fontSize: 16}}>{key}</div>
            {countries}
          </div>
        );
      }).value();

    return (
      <div style={style}>
        <div>
          {annotations}
        </div>
        <div style={eventsStyle}>
          {events}
        </div>
      </div>
    );
  }
});
