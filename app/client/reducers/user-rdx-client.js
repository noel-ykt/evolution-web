import {createReducer} from '~/shared/utils';
import {Map, fromJS} from 'immutable';
import {UserModel} from '../../shared/models/UserModel';

const getInitialUser = () => {
  let user = null;
  if (typeof (window) != 'undefined') {
    user = (process.env.NODE_ENV === 'production'
      ? localStorage
      : sessionStorage).getItem('user');
  }
  if (user != null) {
    user = JSON.parse(user);
    if (typeof user === 'object') {
      user = new UserModel(user);
      if (user.token !== null) {
        return user;
      }
    }
  }
  return null;
};

//console.log('Storage User:', getInitialUser());
export const reducer = createReducer(getInitialUser(), {
  loginUser: (state, {user}) => {
    (process.env.NODE_ENV === 'production'
      ? localStorage
      : sessionStorage).setItem('user', JSON.stringify(user));
    return UserModel.fromJS(user);
  }
  , loginUserFailure: (user, data) => {
    (process.env.NODE_ENV === 'production'
      ? localStorage
      : sessionStorage).removeItem('user');
    return null;
  }
  , chatMessageUser: (user, {message}) => user.update('chat', chat => chat.receiveMessage(message))
  , userUpdateNameSelf: (state, {name}) => state.set(['login'], name)
});