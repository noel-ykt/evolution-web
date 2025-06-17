import React from 'react';
import PropTypes from 'prop-types'

export default class Promise extends React.Component {
  static propTypes = {
    children: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {resolved: null};
  }

  componentDidMount() {
    this.$isMounted = true;
    this.props.children
      .then((resolved = null) => {
        if (this.$isMounted) this.setState({resolved});
      })
  }

  componentWillUnmount() {
    this.$isMounted = false;
  }

  render() {
    return <span>{this.state.resolved}</span>;
  }
}