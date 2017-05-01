import { BehaviorSubject } from 'rxjs';

export class MiddlewareBehaviorSubject<T> extends BehaviorSubject<T> {
  
  private middlewares: ((subject: MiddlewareBehaviorSubject<T>, val: T) => T)[]; 

  constructor(initialValue: T, middlewares?: ((subject: MiddlewareBehaviorSubject<T>, val: T) => T)[]) {
    super(initialValue);

    this.middlewares = middlewares;
  }

  next(value: T): void {
    if (this.middlewares && this.middlewares.length) {
      const result = this.middlewares.reduce( (curr, next) => next(this, value), value);
      super.next(result);
    }
  }
}
