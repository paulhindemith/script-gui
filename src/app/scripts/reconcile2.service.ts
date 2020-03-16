import { Injectable } from '@angular/core';
import { DataStoreHelperService } from '../scripts/datastoreHelper.service';
import { DataStoreService2, scriptId, f, fi, mapping, mappingI, s, View,
  simulateup, simulatedown, reproduceup, reproducedown  } from '../scripts/datastore2.service';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Logger } from '../../app/logger.service';

export type element = any;

@Injectable({
  providedIn: 'root',
})
export class ReconcileService2 extends DataStoreHelperService {
  private element: element;
  private activeId: scriptId = null;
  private locked = false;
  private firstestApply0 = true;
  private url = 'http://localhost:8003/';
  private httpOptions: any = {
    headers: new Headers({
        'Cache-Control':  'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
        Pragma: 'no-cache',
        Expires: '0',
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }),
  };

  constructor(protected logger: Logger, protected ds: DataStoreService2, private dh: DataStoreHelperService, private client: HttpClient) {
    super(logger, ds);
  }

  initialize(): Observable<Error> {
    return new Observable<Error>(subscriber => {
      const cloneDs = () => {
        this.ds = new DataStoreService2();
        this.setScripts(this.dh.getScripts()).subscribe({
          error: (err: Error) => {
            err.message = `Could not clone DataStoreService2: ${err.message}`;
            subscriber.error(err);
          },
          complete: () => {
            subscriber.complete();
          }
        });
      };

      const registerScripts = (scripts: string[]) => {
        this.dh.setScripts(scripts).subscribe({
          error: (err: Error) => {
            err.message = `Could not setScripts: ${err.message}`;
            subscriber.error(err);
          },
          complete: () => {
            cloneDs();
          }
        });
      };

      this.fetchScripts().subscribe({
        next: (scripts: string[]) => {
          registerScripts(scripts);
        },
        error: (err: Error) => {
          err.message = 'Could not fetch scripts: ' + err.message;
        },
      });
    });
  }

  private fetchScripts(): Observable<any> {
    const u = new URL(this.url);
    u.pathname = `/api/scripts`;
    return this.client.get<any>(u.toString(), this.httpOptions);
  }

  isActive(id: scriptId): boolean {
    return this.activeId === id;
  }

  reconcile(): Observable<Error> {
    if (this.locked) {
      this.logger.info('Reconcile service is locked.');
      return null;
    }
    this.lock();
    return new Observable<Error>(subscriber => {
      const ss = this.getScripts();
      this._reconcile(ss).subscribe({
        error: (err: Error) => {
          err.message = `Could not reconcile script: ${err.message}`;
          this.unlock();
          subscriber.error(err);
        },
        complete: () => {
          this.unlock();
          subscriber.complete();
        }
      });
    });

  }

  getChanged(): [View, string, boolean] {
    const viewsR = this.getV();
    const viewsE = this.dh.getV();
    const lastViewRId = viewsR.size - 1;
    const getShouldDownId = (): [View, boolean] => {
      for (let i = lastViewRId; i >= 0; i--) {
        const viewR = viewsR.get(i);
        const viewE = viewsE.get(i);
        if (!viewE) {
          return [viewR, true];
        }
        if (viewR.lastMappingID !== viewE.lastMappingID) {
          return [viewR, true];
        }
      }
      return [null, false];
    };
    let shouldBeDownToViewR: View;
    let ok: boolean;
    [shouldBeDownToViewR, ok] = getShouldDownId();
    if (ok) {
      return [shouldBeDownToViewR, 'down', true];
    }

    if (viewsE.size > viewsR.size) {
      const shouldBeUpAsViewE = viewsE.get(lastViewRId + 1);
      return [shouldBeUpAsViewE, 'up', true];
    }
    return [null, null, false];
  }

  private _reconcile(ss: string[]): Observable<Error> {
    return new Observable<null>(subscriber => {
      let theView: View;
      let upDown: string;
      let ok: boolean;
      [theView, upDown, ok] = this.getChanged();
      if (!ok) {
        subscriber.complete();
        return;
      }

      this.activate(theView.lastS);
      let res: Observable<null>;
      switch (upDown) {
        case 'down':
          res = this.ds.cancel(theView.lastS - 1, theView.lastF);
          break;
        case 'up':
          res = this.ds.apply(theView.lastS, theView.lastF);
          break;
      }
      res.subscribe({
        error: (err: Error) => {
          this.deactivate();
          subscriber.error(err);
        },
        complete: () => {
          this.deactivate();
          subscriber.complete();
        }
      });
    });
  }

  protected mappingScript(): (theS: s, theF: f) => Observable<null> {
    return this.mappingCommonScript();
  }

  protected mappingIScript(): (theS: s, theFi: fi) => Observable<null> {
    return this.mappingCommonScript();
  }

  private mappingCommonScript(): (theS: s, theF: f | fi) => Observable<null> {
    return (theS: s, theF: f): Observable<null> => {
      return new Observable<null>(subscriber => {
        if (this.firstestApply0) {
          this.firstestApply0 = false;
          subscriber.complete();
          return;
        }
        const u = new URL(this.url);
        switch (theF) {
          case simulateup:
            u.pathname = `/api/simulate/${theS}`;
            break;
          case reproduceup:
            u.pathname = `/api/reproduce/${theS}`;
            break;
        }
        const res = this.client.get(u.toString(), this.httpOptions);
        res.subscribe({
          next: (elm: element) => {
            this.setElement(elm);
          },
          error: (err: Error) => {
            err.message = 'http error: ' + err.message;
            subscriber.error(err);
          },
          complete: () => {
            this.logger.info(`Reconciled ${this.getName(theS)}`);
            subscriber.complete();
          }
        });
      });
    };
  }

  private setElement(elm: element) {
    this.element = elm;
  }

  private activate(id: scriptId): void {
    this.activeId = id;
  }

  private deactivate(): void {
    this.activeId = null;
  }

  private lock(): void {
    this.locked = true;
  }

  private unlock(): void {
    this.locked = false;
  }
}
