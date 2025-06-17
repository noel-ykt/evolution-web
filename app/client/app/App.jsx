import React from 'react';
import T from 'i18n-react';
import {connect} from 'react-redux';
import {compose} from 'recompose';

import {Router} from "react-router";
import routes from "../routes/index";

import CssBaseline from '@material-ui/core/CssBaseline';
import {withStyles} from '@material-ui/core/styles';

import AppBar from './appbar/AppBar';
import {PortalsContext, PortalTarget} from '../views/utils/PortalTarget.jsx'
import ErrorReporter from '../components/ErrorReporter.jsx';
import AppModal from "./modals/AppModal";

const styles = theme => ({
  root: {
    display: 'flex'
    , height: '100%'
  }
  , appBarSpacer: theme.mixins.toolbar
  , content: {
    flexGrow: 1
    //, padding: theme.spacing.unit
    , overflow: 'hidden'

    , display: 'flex'
    , flexDirection: 'column'
  }
});

export const App = ({classes}) => {
  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar />
      <ErrorReporter />
      <AppModal />
      <div className={classes.content}>
        <div className={classes.appBarSpacer} />
        {routes}
      </div>
      <svg width="100%" height="100%"
           style={{position: 'absolute', left: '0', top: '0', zIndex: 100, pointerEvents: 'none'}}>
        <PortalTarget name='game-svg' container='g' />
      </svg>
      <div width="100%" height="100%"
           style={{position: 'absolute', left: '0', top: '0', zIndex: 100, pointerEvents: 'none'}}>
        <PortalTarget name='tooltips' />
      </div>
    </div>
  );
}

export const AppView = compose(
  PortalsContext
  , withStyles(styles)
)(App);

export default AppView;