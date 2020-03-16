import { Injectable } from '@angular/core';

// tslint:disable:no-console
@Injectable({
  providedIn: 'root'
})
export class Logger {
  info(message: string) {
    console.info(message);
  }
  warn(message: string) {
    console.warn(message);
  }
  error(err: Error) {
    console.error('name: ' + err.name + ', message: ' + err.message);
  }
  fatal(err: Error) {
    console.error('name: ' + err.name + ', message: ' + err.message);
    throw err;
  }
}
