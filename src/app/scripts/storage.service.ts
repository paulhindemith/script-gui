import { Injectable } from '@angular/core';
import { element } from '../scripts/reconcile2.service';
import { V } from '../scripts/datastore2.service';

export const scriptsKey = 'scripts';
export const elementKey = 'element';
export const vKey = 'v';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private element: element = null;
  private scripts: string[] = [];
  private V: V = null;

  constructor() { }

  initialize(scripts: string[]): void {
    const savedSs = JSON.parse(localStorage.getItem(scriptsKey));
    const result = this.isEqualScripts(scripts, savedSs);
    if (!result) {
      this.clear();
      this.saveScripts(scripts);
      return;
    }
    this.element = this.getElementFromStorage();
    this.V = this.getVFromStorage();
    this.saveScripts(scripts);
  }

  hasData(): boolean {
    return this.V !== null;
  }

  getElement(): element {
    return this.element;
  }

  getV(): V {
    return this.V;
  }

  saveEleemntToStorage(e: element): void {
    localStorage.setItem(elementKey, JSON.stringify(e));
  }

  private getElementFromStorage(): element {
    const v = localStorage.getItem(elementKey);
    if (v === null) {
      return null;
    }
    return JSON.parse(v);
  }

  saveVToStorage(v: V): void {
    // [[k1, "v1"], [k2, "v2"]]
    const kvArray = [...v];
    localStorage.setItem(vKey, JSON.stringify(kvArray));
  }

  private getVFromStorage(): V {
    const v = localStorage.getItem(vKey);
    if (v === null) {
      return null;
    }
    const kvArray = JSON.parse(v);
    console.log(kvArray[0]);
    return new Map(kvArray);
  }

  private saveScripts(scripts: string[]): void {
    localStorage.setItem(scriptsKey, JSON.stringify(scripts));
  }

  private isEqualScripts(ss1: string[], ss2: string[]): boolean {
    if (ss1 == null || ss2 == null) {
      return false;
    }
    let i = 0;
    for (const s1 of ss1) {
      if (ss2[i] !== s1) {
        return false;
      }
      i++;
    }
    return true;
  }

  private clear(): void {
    localStorage.clear();
  }

}
