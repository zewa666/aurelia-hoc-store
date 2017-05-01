import { MiddlewareBehaviorSubject } from './middleware-behavior-subject';
import { LogManager } from 'aurelia-framework';

const logger = LogManager.getLogger("State logger");


export const loggingMiddleware = (subject: MiddlewareBehaviorSubject<any>, value: any): any => {
  logger.info(value);

  return value;
}
