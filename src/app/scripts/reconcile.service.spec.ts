import { DataStoreService, Script, element } from '../scripts/datastore.service';
import { ReconcileService } from '../scripts/reconcile.service';
import { asyncData } from '../../utility/asyncData';
import { tick, fakeAsync } from '@angular/core/testing';
import { Logger } from '../../app/logger.service';

describe('ReconcileService', () => {
  let httpClientSpy: { get: jasmine.Spy };
  let logger: Logger;
  let rs: ReconcileService;
  let ds: DataStoreService;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    logger = new Logger();
    ds = new DataStoreService();
    rs = new ReconcileService(logger, ds, httpClientSpy as any);

  });

  it('getChanged', fakeAsync(() => {
    let s: Script;
    let ok: boolean;
    const expectedScript: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    httpClientSpy.get.and.returnValue(asyncData(expectedScript));
    rs.initialize().subscribe({
      error: (err: Error) => {
        fail(err);
      },
      complete: () => {
        expect(ds.getScripts().length).toBe(3);
      }
    });
    tick();
    [s, ok] = ds.get(1);
    s.expectState = ds.SIMULATE;
    [s, ok] = ds.get(2);
    s.realState = ds.SIMULATE;
    // So that,
    // 1 expected up
    // 2 expected down
    [s, ok] = rs.getChanged(ds.getScripts());
    expect(ok).toBe(true);
    expect(s.id).toBe(2);
    [s, ok] = ds.get(2);
    s.expectState = s.realState = ds.INDETERMINATE;
    [s, ok] = rs.getChanged(ds.getScripts());
    expect(ok).toBe(true);
    expect(s.id).toBe(1);
  }));

  it('should reconcile', fakeAsync(() => {
    const expectedScript: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    httpClientSpy.get.and.returnValue(asyncData(expectedScript));
    rs.initialize().subscribe({
      error: (err: Error) => {
        fail(err);
      },
      complete: () => {
        expect(ds.getScripts().length).toBe(3);
      }
    });

    tick();

    let updErr = ds.updateExpect(1, ds.SIMULATE);
    if (updErr != null) {
      fail(updErr);
    }
    updErr = ds.updateExpect(2, ds.REPRODUCE);
    if (updErr != null) {
      fail(updErr);
    }
    expect(rs.simulatedUp(1)).toBe(false);
    expect(rs.reproducedUp(2)).toBe(false);

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

    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(rs.simulatedUp(1)).toBe(true);
    expect(rs.reproducedUp(2)).toBe(true);
    expect(lastCalled).toBe(true);
  }));
});
