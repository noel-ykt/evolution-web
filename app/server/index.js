import globals from '../globals';
import logger, {loggerOnline} from '../shared/utils/logger'
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import configureStore from './configureStore';
import database from './database';

import frontendDevelopment from './frontend.development';
import frontendProduction from './frontend.production';
import webpackConfig from '../webpack.client.babel';
import 'source-map-support/register'

database.ready.then(() => {
  logger.info('NODE_ENV =', process.env.NODE_ENV);

  const app = express();

  app.use(bodyParser.json());

  const server = http.createServer(app);
  app.set('port', process.env.PORT || 2000);

  configureStore(server, app);

  require('./routes/index')(app);

  (process.env.NODE_ENV === 'development' ? frontendDevelopment : frontendProduction)(webpackConfig, app);

  server.on('error', onError);
  server.on('listening', onListening);
  server.listen(app.get('port'), () => {
    loggerOnline.info('Server started');
    console.log(`App is running at port ${app.get('port')} in ${app.get('env')} env`);
    console.log('Press CTRL-C to stop\n');
  });

  /* Redirect http to https */
  app.get('*', function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production')
      res.redirect('https://' + req.hostname + req.url);
    else
      next() /* Continue to other routes if we're not redirecting */
  });

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
      console.log(err.stack);
      console.log('err.status', err.status);

      res
        .status(err.status >= 100 && err.status < 600 ? err.status : 500)
        .json({
          message: err.stack,
          error: err
        });
    });
  } else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
      res
        .status(err.status >= 100 && err.status < 600 ? err.status : 500)
        .json({
          message: err.message,
          error: {}
        });
    });
  }

  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof process.env.PORT === 'string'
      ? 'Pipe ' + process.env.PORT
      : 'Port ' + process.env.PORT;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    logger.info('Listening on ' + bind);
    logger.info('process.env.NODE_ENV=', process.env.NODE_ENV);
  }
}).catch(console.error);