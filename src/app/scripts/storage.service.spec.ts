import { StorageService, scriptsKey, elementKey, vKey } from '../scripts/storage.service';

describe('StorageService', () => {
let ss: StorageService;
let store = {};

beforeEach(() => {
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
  ss = new StorageService();
});

it('if equal scripts', () => {
  const expectedScript: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
  store[scriptsKey] = JSON.stringify(expectedScript);
  store[elementKey] = JSON.stringify({k: 'v'});
  const expectV = new Map([[0, {}]]);
  store[vKey] = JSON.stringify([...expectV]);
  ss.initialize(expectedScript);
  const v = ss.getV();
  expect(v.size).toBe(1);
  const e = ss.getElement();
  expect(e.k).toBe('v');
  });

it('if not equal scripts', () => {
  const expectedScript: string[] = ['0', 'logger/unit-test', 'k8sclient/unit-test'];
  store[scriptsKey] = JSON.stringify(expectedScript);
  store[elementKey] = JSON.stringify({k: 'v'});
  const expectV = new Map([[0, {}]]);
  store[vKey] = JSON.stringify([...expectV]);

  expectedScript.push('someDifferentValue');
  ss.initialize(expectedScript);
  const v = ss.getV();
  expect(v).toBe(null);
  const e = ss.getElement();
  expect(e).toBe(null);
  });
});
