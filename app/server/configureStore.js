/**
 * Configure Store
 */
import logger from '~/shared/utils/logger';

//var http = require('http');

import {Record} from 'immutable';
import * as reducers from './reducers';
import {createStore, compose, applyMiddleware} from 'redux'
import thunk from 'redux-thunk';
import {reduxTimeoutMiddleware} from '../shared/utils/reduxTimeout'
import {combineReducers} from 'redux-immutable';
import {socketServer, socketStore, socketMiddleware} from './socket';
import {errorMiddleware} from './middleware/error';

import {ROOM_AFK_HOST_PERIOD, server$roomAfkHosts} from '../shared/actions/actions';

export class ServerRecord extends Record({
  connections: void 0
  , games: void 0
  , rooms: void 0
  , users: void 0
  , chat: void 0
}) {
}

export default (server, app) => {
  /**
   * Create HTTP server and sockets.
   */
  const reducer = combineReducers({
    ...reducers
  });

  const timeouts = {};
  app.set('timeouts', timeouts);

  const socket = socketServer(server, {path: '/api/socket-io'});
  const store = createStore(
    reducer
    , new ServerRecord()
    , applyMiddleware(
      errorMiddleware()
      , thunk
      , reduxTimeoutMiddleware(timeouts)
      , socketMiddleware(socket)
    )
  );

  app.set('store', store);

  const timeoutForAfkHosts = () => setTimeout(() => {
    store.dispatch(server$roomAfkHosts());
    timeoutForAfkHosts();
  }, ROOM_AFK_HOST_PERIOD);

  if (!process.env.TEST)
    timeoutForAfkHosts();

  socketStore(socket, store);
}