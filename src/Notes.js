import React from 'react';
var Remarkable = require('remarkable');
var md = new Remarkable({linkTarget: '_new', html: true});
import _ from 'lodash';

module.exports = React.createClass({

  componentWillMount() {
    this.notes = require('./notes/' + this.props.filename + '.md.js').default;
  },

  componentDidMount() {
    var imgs = this.refs.notes.getElementsByTagName('img');
    _.each(imgs, (img) => {
      var width = this.props.width - this.props.padding;
      // scale the images to the right width
      img.setAttribute('style', 'object-fit: cover;' +
        'object-position: center;' +
        'height: ' + width / 8 + 'px;' +
        'width: ' + (width / (imgs.length) - 4) + 'px');
    });
  },

  render() {
    var style = Object.assign({}, this.props.style);

    var rawMarkup = { __html: md.render(this.notes)};
    return (
      <div ref='notes' style={style} dangerouslySetInnerHTML={rawMarkup} />
    );
  }
});
