import { Injectable } from '@angular/core';

export type id = number;
export type element = any;
export interface Script {
  id: id;
  name: string;
  realState: number;
  expectState: number;
  active: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class DataStoreService {
  INDETERMINATE = 0;
  SIMULATE = 1;
  REPRODUCE = 2;
  private lastId: id = 0;
  private element: element;
  private scripts = new Map<id, Script>();
  private url = '/';
  private active: id = null;

  prevId(targetId: id): [id, boolean] {
    if (targetId === 0) {
      return [0, false];
    }
    return [targetId - 1, true];
  }

  nextId(targetId: id): [id, boolean] {
    if (targetId === this.lastId) {
      return [0, false];
    }
    return [targetId + 1, true];
  }

  get(targetId: id): [Script, boolean] {
    const target = this.scripts.get(targetId);
    if (target === undefined) {
      return [null, false];
    }
    return [target, true];
  }

  getScripts(): Script[] {
    const array: Script[] = [];
    for (const v of this.scripts.values()) {
      array.push(v);
    }
    return array;
  }

  setScripts(scripts: string[]): Error {
    let i = -1;
    for (const v of scripts) {
      i++;
      this.scripts.set(i, {
        id: i,
        name: v,
        realState: this.INDETERMINATE,
        expectState: this.INDETERMINATE,
        active: false
      });
    }
    this.lastId = i;
    // only 0 is reproduce state
    this.scripts.get(0).expectState = this.REPRODUCE;
    this.scripts.get(0).realState = this.REPRODUCE;
    return null;
  }

  getElement(): element {
    return this.element;
  }

  setElement(e: element): Error {
    this.element = e;
    return null;
  }

  canSimulateUp(targetId: id) {

  }

  expectSimulateUp(targetId: id): Error {
    const err = this.updateExpect(targetId, this.SIMULATE);
    if (err !== null) {
      return err;
    }
    return null;
  }

  expectReproduceUp(targetId: id): Error {
    const err = this.updateExpect(targetId, this.REPRODUCE);
    if (err !== null) {
      return err;
    }
    return null;
  }

  expectDown(targetId: id): Error {
    const err = this.updateExpect(targetId, this.INDETERMINATE);
    if (err !== null) {
      return err;
    }
    return null;
  }

  realSimulateUp(targetId: id): Error {
    const err = this.updateReal(targetId, this.SIMULATE);
    if (err !== null) {
      return err;
    }
    return null;
  }

  realReproduceUp(targetId: id): Error {
    const err = this.updateReal(targetId, this.REPRODUCE);
    if (err !== null) {
      return err;
    }
    return null;
  }

  realDown(targetId: id): Error {
    const err = this.updateReal(targetId, this.INDETERMINATE);
    if (err !== null) {
      return err;
    }
    return null;
  }

  updateExpect(targetId: id, type: number): Error {
    const target = this.scripts.get(targetId);
    if (target === undefined) {
      return new Error('Got unknown id ' + targetId);
    }
    if (target.active) {
      return new Error(`Script ${targetId} is locked during being active.`);
    }
    target.expectState = type;
    return null;
  }

  updateReal(targetId: id, type: number): Error {
    const target = this.scripts.get(targetId);
    if (target === undefined) {
      return new Error('Got unknown id ' + targetId);
    }
    if (!target.active) {
      return new Error(`Script ${targetId} can be changed only duriing being active.`);
    }
    target.realState = type;
    return null;
  }

  activate(targetId: id): Error {
    const target = this.scripts.get(targetId);
    if (target === undefined) {
      return new Error('Got unknown id ' + targetId);
    }
    if (this.active !== null) {
      return new Error(`Script ${targetId} is still active.`);
    }
    this.active = targetId;
    target.active = true;
    return null;
  }

  deactivate(targetId: id): Error {
    const target = this.scripts.get(targetId);
    if (target === undefined) {
      return new Error('Got unknown id ' + targetId);
    }
    if (this.active !== targetId) {
      return new Error(`Active script is ${this.active} but given ${targetId}.`);
    }
    this.active = null;
    target.active = false;
    return null;
  }
}
