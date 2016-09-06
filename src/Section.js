import React from 'react';
import _ from 'lodash';
import Canvas from './Canvas.js';
import Annotation from './Annotation.js';

module.exports = React.createClass({
  getInitialState() {
    return {
      width: 1200,
      padding: 175,
      scorePositions: [],
    }
  },

  updatePositions(scorePositions, height) {
    scorePositions = _.flattenDeep(scorePositions);
    this.setState({scorePositions, height});
  },

  render() {
    var style = {
      position: 'relative',
    };

    return (
      <div style={style}>
        <Canvas {...this.props} {...this.state}
          updatePositions={this.updatePositions} />
        <Annotation {...this.props} {...this.state} />
      </div>
    );
  }
});
