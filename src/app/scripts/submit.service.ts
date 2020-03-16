import { Injectable } from '@angular/core';
import { Logger } from '../../app/logger.service';
import { DataStoreService, Script } from '../scripts/datastore.service';

const INDETERMINATE = 0;
const SIMULATE = 1;
const REPRODUCE = 2;

type id = number;

@Injectable({
  providedIn: 'root',
})
export class SubmitService {
  lastId: id = 0;

  constructor(private logger: Logger, private ds: DataStoreService) { }

  canUp(targetId: id): boolean {

    if (this.isLocked(targetId)) {
      return false;
    }
    return this._canUp(targetId);
  }

  private _canUp(targetId: id): boolean {
    if (!this.isIndeterminate(targetId)) {
      return false;
    }

    let ok = false;
    let prev: id;
    [prev, ok] = this.ds.prevId(targetId);
    if (ok && !this.wasUp(prev)) {
      return false;
    }

    let next: id;
    [next, ok] = this.ds.nextId(targetId);
    if (ok && !this.isIndeterminate(next)) {
      return false;
    }
    return true;
  }
  canDown(targetId: id): boolean {
    // Only firstest script must not be down.
    if (targetId === 0) {
      return false;
    }
    if (this.isLocked(targetId)) {
      return false;
    }

    let next: id;
    let ok: boolean;
    [next, ok] = this.ds.nextId(targetId);
    if (ok) {
      return this._canUp(next);
    }
    return this.wasUp(targetId);
  }

  wasUp(targetId: id): boolean {
    return this.simulatedUp(targetId) || this.reproducedUp(targetId);
  }

  isIndeterminate(targetId: id): boolean {
    if (this.wasUp(targetId)) {
      return false;
    }
    return true;
  }

  simulatedUp(targetId: id): boolean {
    let s: Script;
    let ok: boolean;
    [s, ok] = this.ds.get(targetId);
    if (!ok) {
      this.logger.fatal(new Error(`id ${targetId} is not found.`));
    }
    return s.expectState === SIMULATE;
  }

  reproducedUp(targetId: id): boolean {
    let s: Script;
    let ok: boolean;
    [s, ok] = this.ds.get(targetId);
    if (!ok) {
      this.logger.fatal(new Error(`id ${targetId} is not found.`));
    }
    return s.expectState === REPRODUCE;
  }

  private isLocked(targetId: id) {
    return this.isActive(targetId);
  }

  isActive(targetId: id): boolean {
    let s: Script;
    let ok: boolean;
    [s, ok] = this.ds.get(targetId);
    if (!ok) {
      this.logger.error(new Error(`id ${targetId} is not found.`));
    }
    return s.active;
  }

  simulateUp(targetId: id): boolean {
    if (!this.canUp(targetId)) {
      return false;
    }
    const err = this.ds.updateExpect(targetId, SIMULATE);
    if (err !== null) {
      err.message = `Could not updateExpect script: ${err.message}`;
      this.logger.error(err);
    }
    return true;
  }

  reproduceUp(targetId: id): boolean {
    if (!this.canUp(targetId)) {
      return false;
    }
    const err = this.ds.updateExpect(targetId, REPRODUCE);
    if (err !== null) {
      err.message = `Could not updateExpect script: ${err.message}`;
      this.logger.error(err);
    }
    return true;
  }

  down(targetId: id): boolean {
    if (!this.canDown(targetId)) {
      return false;
    }
    const err = this.ds.updateExpect(targetId, INDETERMINATE);
    if (err !== null) {
      err.message = `Could not updateExpect script: ${err.message}`;
      this.logger.error(err);
    }
    return true;
  }
}
