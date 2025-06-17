import React from 'react';
import T from 'i18n-react';
import PropTypes from 'prop-types'
import RIP from 'react-immutable-proptypes'
import {connect} from 'react-redux';
import {compose, withStateHandlers} from 'recompose';
import Validator from "validatorjs";

import Button from "@material-ui/core/Button";
import withStyles from "@material-ui/core/styles/withStyles";

import EvoTextField from "../components/EvoTextField";

import {RuleRegisteredUserName} from "../../shared/models/UserModel";
import {userUpdateNameRequest} from '../../shared/actions/auth'

const styles = theme => ({
  root: {
    margin: theme.spacing()
  }
});

const changeNameStyles = theme => ({
  root: {
    display: 'flex'
    , alignItems: 'center'
  }
  , margin: {
    margin: theme.spacing()
  }
});

const ChangeName = compose(
  withStyles(changeNameStyles)
  , withStateHandlers({name: '', error: null}
    , {
      setName: () => (e) => {
        const name = e.target.value;

        const validation = new Validator({name}, {name: RuleRegisteredUserName});

        validation.check();

        return {
          name
          , error: validation.errors.errors.name
        }
      }
    })
  , connect(null, {userUpdateNameRequest})
)(({classes, name, setName, error, userUpdateNameRequest}) => (
  <div className={classes.root}>
    <div className={classes.margin}>
      <EvoTextField
        name='username'
        label={T.translate('App.Profile.Name')}
        value={name}
        onChange={setName}
        error={error}
      /></div>
    <div className={classes.margin}>
      <Button variant='contained'
              color='primary'
              disabled={!name || !!error}
              onClick={e => userUpdateNameRequest(name)}>
        {T.translate('App.Profile.NameChange')}
      </Button>
    </div>
  </div>
));

const Component = ({classes}) => (
  <div className={classes.root}>
    <h1>{T.translate('App.Profile.Title')}</h1>
    <div>
      <ChangeName />
    </div>
  </div>);

export default compose(
  withStyles(styles)
  , connect(
    (state, props) => {
      const user = state.user;
      return {user}
    }
  )
  // , branch(({game, uiv3}) => uiv3 && game, renderComponent(GameUIv3))
  // , branch(get('game'), renderComponent(Game))
  // , branch(get('room'), renderComponent(Room))
)(Component);