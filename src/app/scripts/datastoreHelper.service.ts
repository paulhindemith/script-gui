import { Injectable } from '@angular/core';
import { Observable, empty } from 'rxjs';

import { Logger } from '../../app/logger.service';
import { DataStoreService2, scriptId, f, fi, mapping, mappingI, s, V, View,
  simulateup, simulatedown, reproduceup, reproducedown  } from '../scripts/datastore2.service';
import { StorageService } from '../scripts/storage.service';

@Injectable({
  providedIn: 'root',
})
export class DataStoreHelperService {
  private scripts: string[];

  constructor(protected logger: Logger, protected ds: DataStoreService2, protected storage: StorageService) { }

  getIds(): scriptId[] {
    const ids = Object.keys(this.scripts);
    return ids.map(id => Number(id));
  }

  getName(id: scriptId): string {
    return this.scripts[id];
  }

  getV(): V {
    return this.ds.getV();
  }

  setScripts(scripts: string[]): Observable<null> {
    return new Observable<null>(subscriber => {
      this.scripts = scripts;

      const dataM = new Map<s, Map<f, mapping>>();
      for (const theS of Object.keys(scripts)) {
        const theNumS = Number(theS);
        const m = new Map<f, mapping>();
        for (const theF of this.ds.getF()) {
          m.set(theF, this.mappingScript());
        }
        dataM.set(theNumS, m);
      }

      const dataMI = new Map<s, Map<fi, mappingI>>();
      for (const theS of Object.keys(scripts)) {
        const theNumS = Number(theS);
        const m = new Map<fi, mappingI>();
        for (const theF of this.ds.getFI()) {
          m.set(theF, this.mappingIScript());
        }
        dataMI.set(theNumS, m);
      }
      this.ds.setMapping(dataM, dataMI).subscribe({
        error: (err: Error) => {
          err.message = `Could not setMapping: ${err.message}`;
          subscriber.error(err);
        },
        complete: () => {
          subscriber.complete();
        }
      });
    });
  }

  getScripts(): string[] {
    return this.scripts;
  }

  canUpTo(id: scriptId): boolean {
    const err = this.ds.validateApply(id, simulateup);
    return err === null;
  }

  canDownTo(id: scriptId): boolean {
    const views = this.ds.getV();
    const view = views.get(id + 1);
    if (view === undefined) {
      return false;
    }
    const err = this.ds.validateCancel(id, view.lastF);
    return err === null;
  }

  wasUpTo(id: scriptId): boolean {
    return this.simulatedUpTo(id) || this.reproducedUpTo(id);
  }

  simulatedUpTo(id: scriptId): boolean {
    const views = this.ds.getV();
    const view = views.get(id);
    return view !== undefined && view.lastF === simulateup;
  }

  reproducedUpTo(id: scriptId): boolean {
    const views = this.ds.getV();
    const view = views.get(id);
    return view !== undefined && view.lastF === reproduceup;
  }

  simulateUpTo(id: scriptId): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      this.ds.apply(id, simulateup).subscribe({
        error: (err: Error) => {
          err.message = `Could not simulateUp: ${err.message}`;
          this.logger.error(err);
          subscriber.next(false);
        },
        complete: () => {
          this.logger.info(`simulatedUp ${id}`);
          this.storage.saveVToStorage(this.ds.getV());
          subscriber.next(true);
        }
      });
    });
  }

  reproduceUpTo(id: scriptId): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      this.ds.apply(id, reproduceup).subscribe({
        error: (err: Error) => {
          err.message = `Could not reproduceup: ${err.message}`;
          this.logger.error(err);
          subscriber.next(false);
        },
        complete: () => {
          this.logger.info(`reproducedUp ${id}`);
          this.storage.saveVToStorage(this.ds.getV());
          subscriber.next(true);
        }
      });
    });
  }

  downTo(id: scriptId): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      const viewSadd1 = this.ds.getV().get(id + 1);
      if (viewSadd1 === undefined) {
        this.logger.error(new Error(`v_${id + 1} is undefined`));
        subscriber.next(false);
        return;
      }
      this.ds.cancel(id, viewSadd1.lastF).subscribe({
        error: (err: Error) => {
          err.message = `Could not down: ${err.message}`;
          this.logger.error(err);
          subscriber.next(false);
        },
        complete: () => {
          this.logger.info(`down ${id}`);
          this.storage.saveVToStorage(this.ds.getV());
          subscriber.next(true);
        }
      });
    });
  }

  setView(view: View): Observable<boolean> {
    console.log('called');
    return new Observable<boolean>(subscriber => {
      this.ds.apply(view.lastS, view.lastF).subscribe({
        error: (err: Error) => {
          err.message = `Could not down: ${err.message}`;
          subscriber.error(err);
        },
        complete: () => {
          this.logger.info(`applied v_(${view.lastS}, ${view.lastF})`);
          subscriber.complete();
        }
      });
    });
  }

  protected mappingScript(): (theS: s, theF: f) => Observable<null> {
    return (theS: s, theF: f): Observable<null> => empty();
  }

  protected mappingIScript(): (theS: s, theFi: fi) => Observable<null> {
    return (theS: s, theFi: fi): Observable<null> => empty();
  }

}
