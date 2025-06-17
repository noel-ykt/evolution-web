import React from 'react';
import {Root} from '../../client/app/Root.jsx';
import {syncHistoryWithStore} from '../../client/configuration/routing'

export const mountClient = (store) => {
  return mount(<Root store={store} history={syncHistoryWithStore(store, store.getHistory())}/>);
};