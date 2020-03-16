import { Observable, empty } from 'rxjs';
import { tick, flush, fakeAsync } from '@angular/core/testing';

import {
  DataStoreService2, M, MI, f, fi, s, mapping, mappingI,
  simulateup, simulatedown, reproduceup, reproducedown } from '../scripts/datastore2.service';

interface TestCase {
  f?: f;
  s?: s;
  wantErr?: boolean;
}
interface TestCaseI {
  fi?: fi;
  s?: s;
  wantErr?: boolean;
}

describe('DatastoreService', () => {
  let ds: DataStoreService2;
  const calledM = new Set();
  const calledMI = new Set();
  const dataM: M = new Map<s, Map<f, mapping>>([
    [0, new Map<f, mapping>([
      [simulateup,  (): Observable<null> => {calledM.add(`0_${simulateup}`); return empty(); }],
      [reproduceup, (): Observable<null> => {calledM.add(`0_${reproduceup}`); return empty(); }]
    ])],
    [1, new Map<f, mapping>([
      [simulateup,  (): Observable<null> => {calledM.add(`1_${simulateup}`); return empty(); }],
      // [reproduceup, (): Observable<null> => {calledM.add(`1_${reproduceup}`); return empty(); }]
    ])],
    [2, new Map<f, mapping>([
      [simulateup,  (): Observable<null> => {calledM.add(`2_${simulateup}`); return empty(); }],
      [reproduceup, (): Observable<null> => {calledM.add(`2_${reproduceup}`); return empty(); }]
    ])],
    [3, new Map<f, mapping>([
      [simulateup,  (): Observable<null> => {calledM.add(`3_${simulateup}`); return empty(); }],
      [reproduceup, (): Observable<null> => {calledM.add(`3_${reproduceup}`); return empty(); }]
    ])]
  ]);
  const dataMI: MI = new Map<s, Map<fi, mappingI>>([
    [0, new Map<fi, mappingI>([
      [simulatedown,  (): Observable<null> => {calledMI.add(`0_${simulatedown}`); return empty(); }],
      // [reproducedown, (): Observable<null> => {calledMI.add(`0_${reproducedown}`); return empty(); }]
    ])],
    [1, new Map<fi, mappingI>([
      [simulatedown,  (): Observable<null> => {calledMI.add(`1_${simulatedown}`); return empty(); }],
      [reproducedown, (): Observable<null> => {calledMI.add(`1_${reproducedown}`); return empty(); }]
    ])],
    [2, new Map<fi, mappingI>([
      [simulatedown,  (): Observable<null> => {calledMI.add(`2_${simulatedown}`); return empty(); }],
      [reproducedown, (): Observable<null> => {calledMI.add(`2_${reproducedown}`); return empty(); }]
    ])],
    [3, new Map<fi, mappingI>([
      [simulatedown,  (): Observable<null> => {calledMI.add(`3_${simulatedown}`); return empty(); }],
      [reproducedown, (): Observable<null> => {calledMI.add(`3_${reproducedown}`); return empty(); }]
    ])]
  ]);

  describe('apply', () => {
    beforeEach(fakeAsync(() => {
      ds = new DataStoreService2();
      ds.setMapping(dataM, dataMI).subscribe({
        error: (err: Error) => {
          fail(err);
        },
      });
      tick();
    }));

    const testApply = (tc: TestCase): void => {
      tc.s = tc.s !== undefined ? tc.s : 1;
      tc.f = tc.f !== undefined ? tc.f : simulateup;
      if (!tc.wantErr) {
        expect(ds.getV().get(tc.s)).toBeFalsy();
      }
      ds.apply(tc.s, tc.f).subscribe({
        error: (err: Error) => {
          if (!tc.wantErr) {
            fail(err);
          }
        },
        complete: () => {
          if (tc.wantErr) {
            fail('must catch error');
          } else {
            expect(calledM.has(`${tc.s}_${tc.f}`)).toBe(true);
            expect(ds.getV().get(tc.s)).toBeTruthy();
          }
        }
      });
      tick();
    };

    it('s is in the domain', fakeAsync(() => {
      testApply({
        s: 1
      });
      tick();
    }));

    it('s is not in the domain', fakeAsync(() => {
      testApply({
        s: 0,
        wantErr: true,
      });
    }));

    it('f is in the domain', fakeAsync(() => {
      testApply({
        f: simulateup
      });
    }));

    it('f is not in the domain', fakeAsync(() => {
      testApply({
        f: 2,
        wantErr: true,
      });
    }));

    it('mapping is not defined', fakeAsync(() => {
      testApply({
        s: 1,
        f: reproduceup,
        wantErr: true
      });
    }));
    it('view is not defined', fakeAsync(() => {
      testApply({
        s: 2,
        wantErr: true
      });
    }));
  });

  describe('cancel', () => {
    beforeEach(fakeAsync(() => {
      ds = new DataStoreService2();
      ds.setMapping(dataM, dataMI).subscribe({
        error: (err: Error) => {
          fail(err);
        }
      });
      tick();
      ds.apply(1, simulateup).subscribe({
        error: (err: Error) => {
          fail(err);
        }
      });
      tick();
    }));

    const testCancel = (tc: TestCaseI): void => {
      tc.s = tc.s !== undefined ? tc.s : 0;
      tc.fi = tc.fi !== undefined ? tc.fi : simulatedown;

      if (!tc.wantErr) {
        expect(ds.getV().get(tc.s + 1)).toBeTruthy();
      }
      ds.cancel(tc.s, tc.fi).subscribe({
        error: (err: Error) => {
          if (!tc.wantErr) {
            fail(err);
          }
        },
        complete: () => {
          if (tc.wantErr) {
            fail('must catch error');
          } else {
            expect(calledMI.has(`${tc.s}_${tc.fi}`)).toBe(true);
            expect(ds.getV().get(tc.s + 1)).toBeFalsy();
          }
        }
      });
      tick();
    };

    it('s is in the domain', fakeAsync(() => {
      testCancel({
        s: 0
      });
    }));

    it('s is not in the domain', fakeAsync(() => {
      testCancel({
        s: 2,
        wantErr: true,
      });
    }));

    it('f is in the domain', fakeAsync(() => {
      testCancel({
        fi: 0
      });
    }));

    it('view is not defined', fakeAsync(() => {
      testCancel({
        s: 1,
        wantErr: true
      });
    }));

    it('last mapping is correct', fakeAsync(() => {
      ds.apply(2, 0).subscribe({
        error: (err: Error) => {
          fail(err);
        }
      });
      tick();
      testCancel({
        s: 1,
        fi: 0,
      });
    }));
    it('last mapping is different', fakeAsync(() => {
      ds.apply(2, 0).subscribe({
        error: (err: Error) => {
          fail(err);
        }
      });
      tick();
      testCancel({
        s: 1,
        fi: 1,
        wantErr: true
      });
    }));
  });

});
