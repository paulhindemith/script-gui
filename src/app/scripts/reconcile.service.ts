import { Injectable } from '@angular/core';
import { DataStoreService, Script, id, element } from '../scripts/datastore.service';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Logger } from '../../app/logger.service';

@Injectable({
  providedIn: 'root',
})
export class ReconcileService {
  private locked = false;
  private scriptUrl = 'http://localhost:8003/api/scripts';
  private runUrl = 'http://localhost:8003/api/run';
  private httpOptions: any = {
    headers: new Headers({
        'Cache-Control':  'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
        Pragma: 'no-cache',
        Expires: '0',
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }),
  };

  constructor(private logger: Logger, private ds: DataStoreService, private client: HttpClient) { }

  initialize(): Observable<Error> {
    return new Observable<Error>(subscriber => {
      this.fetchScripts().subscribe({
        next: (scripts: string[]) => {
          this.ds.setScripts(scripts);
          subscriber.complete();
          return null;
        },
        error: (err: Error) => {
          err.message = 'Could not fetch scripts: ' + err.message;
          return err;
        }
      });
    });
  }

  private fetchScripts(): Observable<any> {
    return this.client.get<any>(this.scriptUrl, this.httpOptions);
  }

  getScripts(): Script[] {
    return this.ds.getScripts();
  }

  simulatedUp(targetId: id): boolean {
    let s: Script;
    let ok: boolean;
    [s, ok] = this.ds.get(targetId);
    if (!ok) {
      this.logger.error(new Error(`id ${targetId} is not found.`));
    }
    return s.realState === this.ds.SIMULATE;
  }

  reproducedUp(targetId: id): boolean {
    let s: Script;
    let ok: boolean;
    [s, ok] = this.ds.get(targetId);
    if (!ok) {
      this.logger.error(new Error(`id ${targetId} is not found.`));
    }
    return s.realState === this.ds.REPRODUCE;
  }

  isActive(targetId: id): boolean {
    let s: Script;
    let ok: boolean;
    [s, ok] = this.ds.get(targetId);
    if (!ok) {
      this.logger.error(new Error(`id ${targetId} is not found.`));
    }
    return s.active;
  }

  reconcile(): Observable<Error> {
    if (this.locked) {
      this.logger.warn('Reconcile service is locked.');
      return null;
    }
    this.lock();
    const ss = this.ds.getScripts();
    return new Observable<Error>(subscriber => {
      this._reconcile(ss).subscribe({
        error: (err: Error) => {
          err.message = `Could not reconcile script: ${err.message}`;
          return err;
        },
        complete: () => {
          this.unlock();
          subscriber.complete();
          return null;
        }
      });
    });

  }

  getChanged(ss: Script[]): [Script, boolean] {
    for (const i of Object.keys(ss)) {
      const numI = Number(i);
      const inverseI = ss.length - 1 - numI;
      const s = ss[inverseI];
      if (s.expectState === this.ds.INDETERMINATE) {
        if (s.realState !== this.ds.INDETERMINATE) {
          return [s, true];
        }
      }
    }
    for (const s of ss) {
      if (s.expectState !== s.realState) {
        return [s, true];
      }
    }
    return [null, false];
  }

  private _reconcile(ss: Script[]): Observable<null> {
    return new Observable<null>(subscriber => {
      let s: Script;
      let ok: boolean;
      [s, ok] = this.getChanged(ss);
      if (!ok) {
        subscriber.complete();
        return;
      }

      const acErr = this.activate(s.id);
      if (acErr !== null) {
        subscriber.error(acErr);
      }

      const u = new URL(this.runUrl);
      switch (s.expectState) {
        case this.ds.INDETERMINATE:
          if (s.expectState === this.ds.SIMULATE) {
            u.pathname = `/api/simulate/${s.id}`;
          } else {
            u.pathname = `/api/reproduce/${s.id}`;
          }
          break;
        case this.ds.SIMULATE:
          u.pathname = `/api/simulate/${s.id}`;
          break;
        case this.ds.REPRODUCE:
          u.pathname = `/api/reproduce/${s.id}`;
          break;
      }
      const res = this.client.get(u.toString(), this.httpOptions);
      res.subscribe({
        next: (elm: element) => {
          let err: Error;
          err = this.ds.setElement(elm);
          if (err !== null) {
            err.message = `After finished script '${s.name}' Could not set Element: ${ + err.message}`;
            subscriber.error(err);
          }

          err = this.ds.updateReal(s.id, s.expectState);
          if (err !== null) {
            err.message = `After finished script '${s.name}' Could not update Real state: ${ + err.message}`;
            subscriber.error(err);
          }
        },
        error: (err: Error) => {
          err.message = 'Could not apply scripts: ' + err.message;
          subscriber.error(err);
        },
        complete: () => {
          const deacErr = this.deactivate(s.id);
          if (deacErr !== null) {
            subscriber.error(deacErr);
          }
          this.logger.info(`Reconciled ${s.name}`);
          subscriber.complete();
        }
      });
    });
  }

  private activate(targetId: id): Error {
    return this.ds.activate(targetId);
  }

  private deactivate(targetId: id): Error {
    return this.ds.deactivate(targetId);
  }

  private lock(): void {
    this.locked = true;
  }

  private unlock(): void {
    this.locked = false;
  }
}
