import React from 'react';
// import _ from 'lodash';
import Canvas from './Canvas.js';
import Annotation from './Annotation.js';

module.exports = React.createClass({

  getInitialState() {
    return {
      scorePositions: [],
    }
  },

  updateScorePositions(scorePositions) {
    scorePositions = _.flattenDeep(scorePositions);
    this.setState({scorePositions});
  },

  render() {
    var style = {
      position: 'relative',
    };

    return (
      <div style={style}>
        <Canvas {...this.props}
          updateScorePositions={this.updateScorePositions} />
        <Annotation {...this.state} />
      </div>
    );
  }
});
