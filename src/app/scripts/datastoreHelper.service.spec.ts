import { DataStoreHelperService } from '../scripts/datastoreHelper.service';
import { DataStoreService2 } from '../scripts/datastore2.service';
import { Logger } from '../../app/logger.service';
import { tick, flush, fakeAsync } from '@angular/core/testing';

describe('DataStoreHelperService', () => {
  let dh: DataStoreHelperService;
  let ds: DataStoreService2;
  let logger: Logger;

  beforeEach(fakeAsync(() => {
    ds = new DataStoreService2();
    logger = new Logger();
    dh = new DataStoreHelperService(logger, ds);
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    dh.setScripts(expected).subscribe({
      error: (err: Error) => {
        fail(err);
      },
    });
    tick();
  }));

  it('simulateUpTo', fakeAsync(() => {
    dh.simulateUpTo(0).subscribe((ok: boolean) => {expect(ok).toBe(false); });
    tick();
    dh.simulateUpTo(2).subscribe((ok: boolean) => {expect(ok).toBe(false); });
    tick();
    dh.simulateUpTo(1).subscribe((ok: boolean) => {expect(ok).toBe(true); });
    tick();
    dh.reproduceUpTo(2).subscribe((ok: boolean) => {expect(ok).toBe(true); });
    tick();
  }));
  it('reproduceUpTo', fakeAsync(() => {
    dh.reproduceUpTo(0).subscribe((ok: boolean) => {expect(ok).toBe(false); });
    tick();
    dh.reproduceUpTo(2).subscribe((ok: boolean) => {expect(ok).toBe(false); });
    tick();
    dh.reproduceUpTo(1).subscribe((ok: boolean) => {expect(ok).toBe(true); });
    tick();
    dh.reproduceUpTo(2).subscribe((ok: boolean) => {expect(ok).toBe(true); });
    tick();
  }));
  it('downTo', fakeAsync(() => {
    dh.downTo(2).subscribe((ok: boolean) => {expect(ok).toBe(false); });
    tick();
    dh.downTo(1).subscribe((ok: boolean) => {expect(ok).toBe(false); });
    tick();
    dh.downTo(0).subscribe((ok: boolean) => {expect(ok).toBe(false); });
    tick();
    dh.simulateUpTo(1).subscribe({error: (err) => fail(err)});
    tick();
    dh.downTo(0).subscribe((ok: boolean) => {expect(ok).toBe(true); });
    tick();
  }));
});
