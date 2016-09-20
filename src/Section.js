import React from 'react';
import _ from 'lodash';
import Canvas from './Canvas.js';
import Annotation from './Annotation.js';

module.exports = React.createClass({
  getInitialState() {
    return {
      scorePositions: [],
      selected: null,
    }
  },

  onSelectAnnotation(selected) {
    this.setState({selected})
  },

  updatePositions(scorePositions, height) {
    scorePositions = _.chain(scorePositions)
      .flattenDeep().reverse().value();
    this.setState({scorePositions, height});
  },

  render() {
    var style = {
      position: 'relative',
    };
    // var notesStyle = {
    //   width: this.props.width - this.props.padding,
    //   padding: '10px ' + this.props.padding / 2 + 'px',
    //   fontSize: 12,
    // };

    return (
      <div style={style}>
        <Canvas {...this.props} {...this.state}
          updatePositions={this.updatePositions} selected={this.state.selected} />
        <Annotation {...this.props} {...this.state}
          selected={this.state.selected} onSelect={this.onSelectAnnotation} />
      </div>
    );
  }
});
