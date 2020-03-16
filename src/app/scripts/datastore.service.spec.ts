import { DataStoreService, id, element, Script } from '../scripts/datastore.service';
import { Logger } from '../../app/logger.service';
import { asyncData } from '../../utility/asyncData';

describe('DatastoreService', () => {
  let ds: DataStoreService;

  beforeEach(() => {
    ds = new DataStoreService();
  });

  it('prevId should be get', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }
    let scriptId: id;
    let ok: boolean;
    // when prevId is exist
    [scriptId, ok] = ds.prevId(1);
    expect(ok).toBe(true);
    expect(scriptId).toBe(0);
    // when prevId is not exist
    [scriptId, ok] = ds.prevId(0);
    expect(ok).toBe(false);
    expect(scriptId).toBe(0);
  });

  it('nextId should be get', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    let scriptId: id;
    let ok: boolean;
    // when prevId is exist
    [scriptId, ok] = ds.nextId(1);
    expect(ok).toBe(true);
    expect(scriptId).toBe(2);
    // when prevId is not exist
    [scriptId, ok] = ds.nextId(2);
    expect(ok).toBe(false);
    expect(scriptId).toBe(0);
  });

  it('scripts should be set', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(2);
    expect(ok).toBe(true);
    expect(s.id).toBe(2);
    expect(ds.getScripts().length).toBe(3);
  });

  it('element should be set', () => {
    const expected = {
      key: 'value',
    };
    expect(ds.setElement(expected)).toBe(null);
    expect(ds.getElement()).toBe(expected);
  });

  it('expectSimulateUp', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    expect(ds.expectSimulateUp(1)).toBe(null);
    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(ok).toBe(true);
    expect(s.expectState).toBe(ds.SIMULATE);
  });

  it('expectReproduceUp', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    expect(ds.expectReproduceUp(1)).toBe(null);
    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(ok).toBe(true);
    expect(s.expectState).toBe(ds.REPRODUCE);
  });

  it('expectDown', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    expect(ds.expectDown(1)).toBe(null);
    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(ok).toBe(true);
    expect(s.expectState).toBe(ds.INDETERMINATE);
  });

  it('realSimulateUp', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    err = ds.activate(1);
    if ( err !== null) {
      fail(err);
    }

    expect(ds.realSimulateUp(1)).toBe(null);
    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(ok).toBe(true);
    expect(s.realState).toBe(ds.SIMULATE);
  });

  it('realReproduceUp', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    err = ds.activate(1);
    if ( err !== null) {
      fail(err);
    }

    expect(ds.realReproduceUp(1)).toBe(null);
    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(ok).toBe(true);
    expect(s.realState).toBe(ds.REPRODUCE);
  });

  it('realDown', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    err = ds.activate(1);
    if ( err !== null) {
      fail(err);
    }

    expect(ds.realDown(1)).toBe(null);
    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(ok).toBe(true);
    expect(s.realState).toBe(ds.INDETERMINATE);
  });


  it('expectReproduceUp', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    expect(ds.expectReproduceUp(1)).toBe(null);
    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(ok).toBe(true);
    expect(s.expectState).toBe(ds.REPRODUCE);
  });

  it('expectDown', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    expect(ds.expectDown(1)).toBe(null);
    let s: Script;
    let ok: boolean;
    [s, ok] = ds.get(1);
    expect(ok).toBe(true);
    expect(s.expectState).toBe(ds.INDETERMINATE);
  });

  it('updateReal', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let s: Script;
    let ok: boolean;
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    [s, ok] = ds.get(2);
    if (!ok) {
      fail('Could not get script 2');
    }
    s.expectState = ds.SIMULATE;
    s.active = true;

    expect(ds.updateReal(2, ds.SIMULATE)).toBe(null);

    [s, ok] = ds.get(2);
    expect(ok).toBe(true);
    expect(s.realState).toBe(ds.SIMULATE);
  });

  it('activate/deactive', () => {
    const expected: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
    let err: Error;
    err = ds.setScripts(expected);
    if (err != null) {
      fail(err);
    }

    expect(ds.activate(1)).toBe(null);
    expect(ds.activate(1)).not.toBe(null);
    expect(ds.deactivate(2)).not.toBe(null);
    expect(ds.deactivate(1)).toBe(null);
  });

});
