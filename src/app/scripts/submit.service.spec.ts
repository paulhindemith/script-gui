import { DataStoreService, Script, element } from '../scripts/datastore.service';
import { SubmitService } from '../scripts/submit.service';
import { Logger } from '../../app/logger.service';
import { asyncData } from '../../utility/asyncData';
import { tick, fakeAsync } from '@angular/core/testing';

describe('SubmitService', () => {
  let ss: SubmitService;
  let ds: DataStoreService;
  let logger: Logger;

  beforeEach(() => {
    ds = new DataStoreService();
    logger = new Logger();
    ss = new SubmitService(logger, ds);
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }
  });

  it('simulateUp', () => {
    expect(ss.simulateUp(0)).toBe(false);
    expect(ss.simulateUp(2)).toBe(false);
    expect(ss.simulateUp(1)).toBe(true);
    expect(ss.reproduceUp(2)).toBe(true);
  });
  it('reproduceUp', () => {
    expect(ss.reproduceUp(0)).toBe(false);
    expect(ss.reproduceUp(2)).toBe(false);
    expect(ss.reproduceUp(1)).toBe(true);
    expect(ss.reproduceUp(2)).toBe(true);
  });
  it('down', () => {
    expect(ss.down(0)).toBe(false);
    expect(ss.down(2)).toBe(false);
    expect(ss.down(1)).toBe(false);
    if (!ss.simulateUp(1)) {
      fail('Could not simulate up.');
    }
    expect(ss.down(1)).toBe(true);
  });
  it('when active', () => {
    let s: Script;
    let ok: boolean;
    if (!ss.simulateUp(1)) {
      fail('Script simulate is fail.');
    }
    expect(ss.canUp(1)).toBe(false); // was already up
    expect(ss.canDown(1)).toBe(true); // was already up
    [s, ok] = ds.get(1);
    s.active = true;
    expect(ss.canDown(1)).toBe(false); // During being active
    s.active = false;
    s.realState = ds.SIMULATE;

    if (!ss.simulateUp(2)) {
      fail('Script simulate is fail.');
    }
    [s, ok] = ds.get(2);
    s.realState = ds.SIMULATE;

    if (!ss.down(2)) {
      fail('Script down is fail.');
    }

    expect(ss.canUp(2)).toBe(true); // was already down
    expect(ss.canDown(2)).toBe(false); // was already down
    expect(ss.canUp(1)).toBe(false); // was already up
    expect(ss.canDown(1)).toBe(true); // next script 2 was already down
    [s, ok] = ds.get(2);
    s.active = true;
    expect(ss.canUp(2)).toBe(false); // During being active
    // Next script 2 is disabled but script 1 keeps enable.
    // Because canDown(n) uses _canup(n+1) function in its internal, it should be checkd.
    expect(ss.canDown(1)).toBe(true);

    s.active = false;
    s.realState = ds.INDETERMINATE;
  });
});
