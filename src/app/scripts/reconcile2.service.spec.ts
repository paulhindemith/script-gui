import { DataStoreHelperService } from '../scripts/datastoreHelper.service';
import { DataStoreService2, View } from '../scripts/datastore2.service';
import { ReconcileService2, element } from '../scripts/reconcile2.service';
import { StorageService } from '../scripts/storage.service';
import { asyncData } from '../../utility/asyncData';
import { tick, fakeAsync } from '@angular/core/testing';
import { Logger } from '../../app/logger.service';

describe('ReconcileService2', () => {
  let httpClientSpy: { get: jasmine.Spy };
  let logger: Logger;
  let rs: ReconcileService2;
  let ds: DataStoreService2;
  let storage: StorageService;
  let dh: DataStoreHelperService;
  let store = {};

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    ds = new DataStoreService2();
    logger = new Logger();
    storage = new StorageService();
    dh = new DataStoreHelperService(logger, ds, storage);
    rs = new ReconcileService2(logger, ds, dh, httpClientSpy as any, storage);

    store = {};
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      if (!store[key]) {
        return null;
      }
      return store[key];
    });
    spyOn(localStorage, 'setItem').and.callFake((key, value) => {
      return store[key] = value + '';
    });
    spyOn(localStorage, 'clear').and.callFake(() => {
        store = {};
    });
  });

  it('getChanged', fakeAsync(() => {
    const expectedScript: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    httpClientSpy.get.and.returnValue(asyncData(expectedScript));
    rs.initialize().subscribe({
      error: (err: Error) => {
        fail(err);
      },
      complete: () => {
        expect(dh.getScripts().length).toBe(3);
      }
    });
    tick();
    dh.simulateUpTo(1).subscribe({error: (err) => fail(err)});
    tick();
    dh.reproduceUpTo(2).subscribe({error: (err) => fail(err)});
    tick();

    let theView: View;
    let upDown: string;
    let ok: boolean;
    [theView, upDown, ok] = rs.getChanged();
    expect(ok).toBe(true);
    expect(theView.lastMappingID).toBe('s1:f0');
    expect(upDown).toBe('up');
  }));

  it('should reconcile', fakeAsync(() => {
    const expectedScript: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    httpClientSpy.get.and.returnValue(asyncData(expectedScript));
    rs.initialize().subscribe({
      error: (err: Error) => {
        fail(err);
      },
      complete: () => {
        expect(dh.getScripts().length).toBe(3);
      }
    });
    tick();

    dh.simulateUpTo(1).subscribe({error: (err) => fail(err)});
    tick();
    dh.reproduceUpTo(2).subscribe({error: (err) => fail(err)});
    tick();

    let lastCalled = false;
    const expectedElement: element = {k: 'v'};
    httpClientSpy.get.and.returnValue(asyncData(expectedElement));

    // First loop reconciles simulate at id = 1,
    // second loop reconciles reproduce at id = 2,
    for (let i = 0; i < 2; i++) {
      const res = rs.reconcile();
      expect(res).not.toBe(null);
      const mustNullCauseLocked = rs.reconcile();
      expect(mustNullCauseLocked).toBe(null);

      res.subscribe({
        error: (err: Error) => {
          fail(err);
        },
        complete: () => {
          lastCalled = true;
        }
      });
      tick();
    }
    expect(rs.simulatedUpTo(1)).toBe(true);
    expect(rs.reproducedUpTo(2)).toBe(true);
    expect(lastCalled).toBe(true);

    dh.downTo(1).subscribe({error: (err) => fail(err)});
    tick();

    rs.reconcile().subscribe({
      error: (err: Error) => {
        fail(err);
      },
    });
    tick();
    expect(rs.simulatedUpTo(1)).toBe(true);
    expect(rs.reproducedUpTo(2)).toBe(false);
  }));
});
