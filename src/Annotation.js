import React from 'react';
import * as d3 from "d3";
import _ from 'lodash';

module.exports = React.createClass({

  render() {
    var style = {
      position: 'absolute',
      top: 0,
      left: 0,
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

    return (
      <div style={style}>
        {annotations}
      </div>
    );
  }
});
