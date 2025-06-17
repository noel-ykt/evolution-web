import logger from '../../shared/utils/logger';
import {promisify} from '../../shared/utils/index';
import querystring from 'querystring';
import request from 'request';
const requestGet = promisify(request.get);
import {db$findUser, db$registerUser, db$updateUserByAuth} from './db';
import {AUTH_TYPE} from '../../shared/constants';
import {server$injectUser} from '../../shared/actions/actions';

const API_VERSION = process.env.VK_API_VERSION || '5.73';

export const server$oauthVKRegister = (protocol = 'http', host, code) => (dispatch, getState) => {
  const VK_API_ACCESS_TOKEN = {
    client_id: process.env.VK_API_ID
    , client_secret: process.env.VK_API_SECRET
    , redirect_uri: `${protocol}://${host}/api/oauth/vk`
    , code
    , v: API_VERSION
  };
  const accessTokenUri = 'https://oauth.vk.com/access_token?' + querystring.stringify(VK_API_ACCESS_TOKEN);

  return requestGet(accessTokenUri)
    .then((response) => {
      const body = (typeof response.body === 'string') ? JSON.parse(response.body) : response.body;
      if (body.error) throw new Error('server$oauthVKRegister:' + response.body);
      return body;
    })
    .then(({access_token, expires_in, user_id}) =>
      db$findUser(AUTH_TYPE.VK, user_id)
        .then((user) => server$getUserInfo(user_id, access_token, expires_in)
          .then((userInfo) => ({
            name: userInfo.first_name + ' ' + userInfo.last_name
            , auth: {
              type: AUTH_TYPE.VK
              , id: user_id
              , name: userInfo.first_name + ' ' + userInfo.last_name
              , access_token
              , expires_in
            }
          }))
          .then((updateObject) => {
            return (user === null
              ? db$registerUser(updateObject)
              : db$updateUserByAuth(AUTH_TYPE.VK, user_id, updateObject))
              .then(() => db$findUser(AUTH_TYPE.VK, user_id))
              .then((result) => dispatch(server$injectUser(result._id.toString(), result.name, AUTH_TYPE.VK, result.awards)))
          })
        )
    )
    .then((user) => user.token)
    .catch(err => {
      logger.error(err);
      throw err;
    });
};

export const server$getUserInfo = (user_id, access_token, expires_in) =>
  requestGet('https://api.vk.com/method/users.get?' + querystring.stringify({
      access_token
      , v: API_VERSION
    }))
    .then((response) => {
      const body = (typeof response.body === 'string') ? JSON.parse(response.body) : response.body;
      if (body.error) throw new Error('server$getUserInfo:' + response.body);
      return body;
    })
    .then(({response}) => {
      if (response.length !== 1) throw new Error('Invalid login response');
      return response[0];
    });