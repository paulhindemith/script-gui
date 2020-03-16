import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type scriptId = number;
export type f = number;
export type F = number[];
export type fi = number;
export type FI = number[];
export type s = scriptId;
export type mapping = (theS: s, theF: f) => Observable<null>;
export type mappingI = (theS: s, theFi: fi) => Observable<null>;
export type M =  Map<s, Map<f, mapping>>;
export type MI =  Map<s, Map<fi, mappingI>>;
type mappingID = string;
export interface View {
  lastMappingID: mappingID;
  lastF: f;
  lastS: s;
}
export type V =  Map<s, View>;

export const simulateup: f = 0;
export const reproduceup: f = 1;
export const simulatedown: fi = 0;
export const reproducedown: fi = 1;

function mappingID(expectS: s, expectF: f): mappingID {
  return `s${expectS}:f${expectF}`;
}

@Injectable({
  providedIn: 'root',
})
export class DataStoreService2 {
  private F: F = [simulateup, reproduceup];
  private FI: FI = [simulatedown, reproducedown];
  private M: M;
  private MI: MI;
  private V: V = new Map<s, View>();
  private lastView: s;

  getF(): F {
    return this.F;
  }

  getFI(): FI {
    return this.FI;
  }

  getM(): M {
    return this.M;
  }

  getMI(): MI {
    return this.MI;
  }

  getV(): V {
    return this.V;
  }

  setMapping(dataM: M, dataMI: MI): Observable<null> {
    return new Observable<null>(subscriber => {
      if (this.M || this.MI) {
        subscriber.error( new Error('Only once can be called.'));
        return;
      }
      if (dataM.size !== dataMI.size) {
        subscriber.error( new Error('dataM.size is Not same as dataMI.size.'));
        return;
      }
      this.M = dataM;
      this.MI = dataMI;
      this._apply(0, reproduceup).subscribe({
        error: (err: Error) => {
          err.message = `Could not apply: ${err.message}`;
          subscriber.error(err);
        },
        complete: () => {
          subscriber.complete();
        }
      });
    });
  }

  apply(expectS: s, expectF: f): Observable<null> {
    return new Observable<null>(subscriber => {
      const err = this.validateApply(expectS, expectF);
      if (err !== null) {
        err.message = `Can not apply m_(${expectS},${expectF}): ${err.message}`;
        subscriber.error(err);
        return;
      }
      this._apply(expectS, expectF).subscribe({
        error: (errA: Error) => {
          errA.message = 'Could not complete apply scripts: ' + errA.message;
          subscriber.error(errA);
        },
        complete: () => {
          subscriber.complete();
        }
      });
    });
  }

  validateApply(expectS: s, expectF: f): Error {
    let err: Error;
    err = this.forAllPreSAndS(expectS);
    if (err !== null) {
      return err;
    }
    err = this.forAllF(expectF);
    if (err !== null) {
      return err;
    }
    err = this.IsMappingFDefined(expectS, expectF);
    if (err !== null) {
      return err;
    }
    err = this.isLastView(expectS - 1);
    if (err !== null) {
      return err;
    }
    return null;
  }

  private _apply(expectS: s, expectF: f): Observable<null> {
    return new Observable<null>(subscriber => {
      let resMapping: mapping;
      let err: Error;
      [resMapping, err] = this.getMapping(expectS, expectF);
      if (err !== null) {
        err.message = `Could not get mapping: ${err.message}`;
        subscriber.error(err);
        return;
      }
      resMapping(expectS, expectF).subscribe({
        error: (errM: Error) => {
          errM.message = 'Could not complete mapping: ' + errM.message;
          subscriber.error(errM);
        },
        complete: () => {
          const expectView: View = {
            lastMappingID: mappingID(expectS, expectF),
            lastF: expectF,
            lastS: expectS,
          };

          const setView = (givenS: s, givenView: View): Error => {
            const view = this.V.get(expectS);
            if (view !== undefined) {
              return new Error(`v_${expectS} has been defiend`);
            }
            this.V.set(givenS, givenView);
            this.lastView = givenView.lastS;
            return null;
          };

          err = setView(expectS, expectView);
          if (err !== null) {
            err.message = `Could not setView: ${err.message}`;
            subscriber.error(err);
            return;
          }
          subscriber.complete();
        }
      });
    });
  }

  cancel(expectS: s, expectFI: fi): Observable<null> {
    return new Observable<null>(subscriber => {
      const err = this.validateCancel(expectS, expectFI);
      if (err !== null) {
        err.message = `Can not cancel mi_(${expectS},${expectFI}): ${err.message}`;
        subscriber.error(err);
        return;
      }
      this._cancel(expectS, expectFI).subscribe({
        error: (errC: Error) => {
          errC.message = 'Could not complete cancel scripts: ' + errC.message;
          subscriber.error(errC);
        },
        complete: () => {
          subscriber.complete();
        }
      });
    });
  }

  validateCancel(expectS: s, expectFI: fi): Error {
    let err: Error;
    err = this.forAllSAndPostS(expectS);
    if (err !== null) {
      return err;
    }
    err = this.IsMappingFIDefined(expectS, expectFI);
    if (err !== null) {
      return err;
    }
    err = this.isLastView(expectS + 1);
    if (err !== null) {
      return err;
    }
    let mID: mappingID;
    [mID, err] = this. inverseOfFI(expectS, expectFI);
    if (err !== null) {
      return err;
    }
    err = this.IsLastMappingOfView(expectS + 1, mID);
    if (err !== null) {
      return err;
    }
    return null;
  }

  private _cancel(expectS: s, expectFi: fi) {
    return new Observable<null>(subscriber => {
      let resMappingI: mappingI;
      let err: Error;
      [resMappingI, err] = this.getMappingI(expectS, expectFi);
      if (err !== null) {
        err.message = `Could not get mapping: ${err.message}`;
        subscriber.error(err);
        return;
      }

      resMappingI(expectS, expectFi).subscribe({
        error: (errMi: Error) => {
          errMi.message = 'Could not complete mappingI: ' + errMi.message;
          subscriber.error(errMi);
        },
        complete: () => {
          const removeView = (givenS: s): Error => {
            this.V.delete(givenS);
            this.lastView = expectS;
            return null;
          };
          err = removeView(expectS + 1);
          if (err !== null) {
            subscriber.error(err);
            return;
          }
          subscriber.complete();
        }
      });
    });
  }

  private getMapping(expectS: s, expectF: f): [mapping, Error] {
    const mappingS = this.M.get(expectS);
    if (mappingS === undefined) {
      return [undefined, new Error(`m_${expectS} must be defined in M.`)];
    }
    const mappingSF =  mappingS.get(expectF);
    if (mappingSF === undefined) {
      return [undefined, new Error(`m_(${expectS},${expectF}) must be defined in M.`)];
    }
    return [mappingSF, null];
  }

  private getMappingI(expectS: s, expectFi: f): [mapping, Error] {
    const mappingS = this.MI.get(expectS);
    if (mappingS === undefined) {
      return [undefined, new Error(`m_${expectS} must be defined in MI.`)];
    }
    const mappingSFi =  mappingS.get(expectFi);
    if (mappingSFi === undefined) {
      return [undefined, new Error(`m_(${expectS},${expectFi}) must be defined in MI.`)];
    }
    return [mappingSFi, null];
  }

  private isLastView(expectS: s): Error {
    const viewS = this.V.get(expectS);
    if (viewS === undefined) {
      return new Error(`v_${expectS} must be defined in V.`);
    }
    if (viewS.lastS !== this.lastView) {
      return new Error(`lastView is ${this.lastView} but got ${viewS.lastS}.`);
    }
    return null;
  }

  private IsMappingFDefined(expectS: s, expectF: f): Error {
    let resMapping: mapping ;
    let err: Error ;
    [resMapping, err] = this.getMapping(expectS, expectF);
    if (err !== null) {
      return err;
    }
    return null;
  }

  private IsMappingFIDefined(expectS: s, expectFi: fi): Error {
    let resMappingI: mappingI ;
    let err: Error ;
    [resMappingI, err] = this.getMappingI(expectS, expectFi);
    if (err !== null) {
      return err;
    }
    return null;
  }

  private inverseOfFI(expectS: s, expectFi: fi): [mappingID, Error] {
    let resMapping: mapping ;
    let err: Error ;
    // m_(si, f1) <->  m_(si-1, fi1), m_(si, f2) <->  m_(si-1, fi2), ...  , m_(si, fn) <->  m_(si-1, fin)
    [resMapping, err] = this.getMapping(expectS + 1, expectFi);
    if (err !== null) {
      return [undefined, err];
    }
    return [mappingID(expectS + 1, expectFi), null];
  }

  private IsLastMappingOfView(expectS: s, expectMappingID: mappingID): Error {
    const viewS = this.V.get(expectS);
    if (viewS === undefined) {
      return new Error(`v_${expectS} must be defined in V.`);
    }
    if (viewS.lastMappingID !== expectMappingID) {
      return new Error(`mapping is different lastMappingID is ${viewS.lastMappingID} but got ${expectMappingID}.`);
    }
    return null;
  }

  private forAllF(expectF: f): Error {
    if (expectF < 0) {
      return new Error(`f must be greater than 0, but given ${expectF}.`);
    }
    if (this.F.length < expectF) {
      return new Error(`f must be less than or equal to ${this.F.length}, but given ${expectF}.`);
    }
    return null;
  }

  private forAllPreSAndS(expectS: s): Error {
    let err: Error;
    err = this.forAllS(expectS - 1);
    if (err !== null) {
      err.message = `Caught error forAllPreSAndS: ${err.message}`;
      return err;
    }
    err = this.forAllS(expectS);
    if (err !== null) {
      err.message = `Caught error forAllPreSAndS: ${err.message}`;
      return err;
    }
    return null;
  }

  private forAllSAndPostS(expectS: s): Error {
    let err: Error;
    err = this.forAllS(expectS);
    if (err !== null) {
      err.message = `Caught error forAllSAndPostS: ${err.message}`;
      return err;
    }
    err = this.forAllS(expectS + 1);
    if (err !== null) {
      err.message = `Caught error forAllSAndPostS: ${err.message}`;
      return err;
    }
    return null;
  }

  private forAllS(expectS: s): Error {
    if (expectS < 0) {
      return new Error(`s must be greater than 0, but given ${expectS}.`);
    }
    if ((this.M.size - 1) < expectS) {
      return new Error(`s must be less than or equal to ${this.M.size - 1}, but given ${expectS}.`);
    }
    return null;
  }
}
