import logger from '~/shared/utils/logger';
import util from 'util';

export const errorMiddleware = (interceptor = () => null) => store => next => action => {
  try {
    return next(action);
  } catch (error) {
    let actionType = action.type ? `(${action.type})` : '';
    if (process.env.TEST) throw error;
    if (error.userLevelError) {
      logger.warn(`${error.name}${actionType}: ${error.message}`);
    } else {
      try {
        logger.error(`GenericError${actionType}:`, process.env.NODE_ENV === 'production' ? {
          message: error.message
          , stack: error.stack
        } : error);
      } catch (loggerError) {
        logger.error(`GenericError${actionType}:`, error);
        logger.error(`LOGGER ERROR ${actionType}:`, loggerError);
      }
    }
    return error;
    //next(action);
  }
};