import { DebugElement } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { BrowserModule, By } from '@angular/platform-browser';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { MockWebApiService } from '../app/mock-web-api.service';
import { tick, flush, fakeAsync, discardPeriodicTasks, ComponentFixture } from '@angular/core/testing';


describe('AppComponent', () => {
  const mockApiDelay = 500;
  let store = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        BrowserModule,
        MatTableModule,
        MatCheckboxModule,
        BrowserAnimationsModule,
        HttpClientModule,
        HttpClientInMemoryWebApiModule.forRoot(MockWebApiService, { delay: mockApiDelay })
      ]
    }).compileComponents();

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


  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });


  it('main', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.dataSource.length).toBe(0);

    fixture.detectChanges(); // ngOnInit
    tick(mockApiDelay);
    fixture.detectChanges(); // display data

    expect(app.dataSource.length).toBeGreaterThan(0);
    expect(app.simulatedUpTo(1)).toBe(false);
    app.simulateUpTo(1);
    tick();

    expect(app.simulatedUpTo(1)).toBe(true);
    expect(app.realSimulatedUpTo(1)).toBe(false);

    tick(app.reconcileInterval); // wait for next interval
    tick(mockApiDelay);
    expect(app.realSimulatedUpTo(1)).toBe(true);
    discardPeriodicTasks();
  }));

  describe('checked should be reconcile', () => {
    let fixture;
    let app;
    let appDe: DebugElement;
    const checkRows = (expects: any[]) => {
      for (const row of expects) {
        for (const type of ['down', 'simulateup', 'reproduceup']) {
          const el = appDe.query(By.css(`mat-checkbox[data-${type}-script-id="${row.id}"]`)).nativeElement;
          expect(el.getAttribute('ng-reflect-disabled')).toBe(String(row[type].disabled));
          expect(el.getAttribute('ng-reflect-checked')).toBe(String(row[type].checked));
        }
      }
    };
    const simulate = (id: number) => {
      const labelEl: HTMLElement = appDe.query(By.css(`mat-checkbox[data-simulateup-script-id="${id}"] label`)).nativeElement;
      labelEl.click();
    };
    const reproduce = (id: number) => {
      const labelEl: HTMLElement = appDe.query(By.css(`mat-checkbox[data-reproduceup-script-id="${id}"] label`)).nativeElement;
      labelEl.click();
    };
    const down = (id: number) => {
      const labelEl: HTMLElement = appDe.query(By.css(`mat-checkbox[data-down-script-id="${id}"] label`)).nativeElement;
      labelEl.click();
    };
    const checkTd = (expected: any) => {
      let tdDe;
      switch (expected.type) {
        case 'simulated':
          tdDe = appDe.query(By.css(`td[data-simulateup-script-id="${expected.id}"]`));
          expect(tdDe.classes.simulated).toBe(expected.simulated);
          break;
        case 'reproduced':
          tdDe = appDe.query(By.css(`td[data-reproduceup-script-id="${expected.id}"]`));
          expect(tdDe.classes.reproduced).toBe(expected.reproduced);
          break;
      }
      expect(tdDe.classes.reconciledup).toBe(expected.reconciledup);
    };
    const checkTr = (expected: any) => {
      const trDe = appDe.query(By.css(`tr[data-script-id="${expected.id}"]`));
      expect(trDe.classes.active).toBe(expected.activeState);
    };


    beforeEach(() => {
      fixture = TestBed.createComponent(AppComponent);
      appDe = fixture.debugElement;
      app = fixture.componentInstance;
    });

    it('CheckRows-Firstest state', fakeAsync(() => {
      fixture.detectChanges(); // ngOnInit
      tick(mockApiDelay);
      fixture.detectChanges(); // display data

      expect(app.dataSource.length).toBeGreaterThan(0);

      const ini = Date.now();
      const turnSetInterval = (now) => {
        tick(app.reconcileInterval - (now - ini) % app.reconcileInterval);
      };
      checkRows([
        {
          id: 0,
          down: {disabled: true, checked: true},
          simulateup: {disabled: true, checked: false},
          reproduceup: {disabled: true, checked: true},
        },
        {
          id: 1,
          down: {disabled: true, checked: false},
          simulateup: {disabled: false, checked: false},
          reproduceup: {disabled: false, checked: false},
        },
        {
          id: 2,
          down: {disabled: true, checked: false},
          simulateup: {disabled: true, checked: false},
          reproduceup: {disabled: true, checked: false},
        },
      ]);

      // turn setInterval
      turnSetInterval(Date.now());
      // Click id 1 simulate
      simulate(1);
      fixture.detectChanges();

      checkTd({
        id: 1,
        type: 'simulated',
        reconciledup: undefined,
        simulated: true,
      });

      checkTr({
        id: 1,
        activeState: undefined
      });
      tick(app.reconcileInterval); // wait for next interval
      fixture.detectChanges(); // active

      checkTr({
        id: 1,
        activeState: true
      });

      tick(mockApiDelay);
      fixture.detectChanges();

      checkTd({
        id: 1,
        type: 'simulated',
        reconciledup: true,
        simulated: true,
      });

      checkRows([
        {
          id: 0,
          down: {disabled: true, checked: true},
          simulateup: {disabled: true, checked: false},
          reproduceup: {disabled: true, checked: true},
        },
        {
          id: 1,
          down: {disabled: false, checked: true},
          simulateup: {disabled: true, checked: true},
          reproduceup: {disabled: true, checked: false},
        },
        {
          id: 2,
          down: {disabled: true, checked: false},
          simulateup: {disabled: false, checked: false},
          reproduceup: {disabled: false, checked: false},
        },
      ]);

      // turn setInterval
      turnSetInterval(Date.now());

      // Click id 2 reproduce
      reproduce(2);
      fixture.detectChanges();
      checkTd({
        id: 2,
        type: 'reproduced',
        reconciledup: undefined,
        reproduced: true,
      });

      checkTr({
        id: 2,
        activeState: undefined
      });
      tick(app.reconcileInterval); // wait for next interval
      fixture.detectChanges();

      checkTr({
        id: 2,
        activeState: true
      });

      tick(mockApiDelay);
      fixture.detectChanges();

      checkTd({
        id: 2,
        type: 'reproduced',
        reconciledup: true,
        reproduced: true,
      });

      checkRows([
        {
          id: 1,
          down: {disabled: true, checked: true},
          simulateup: {disabled: true, checked: true},
          reproduceup: {disabled: true, checked: false},
        },
        {
          id: 2,
          down: {disabled: false, checked: true},
          simulateup: {disabled: true, checked: false},
          reproduceup: {disabled: true, checked: true},
        },
      ]);

      // turn setInterval
      turnSetInterval(Date.now());
      // Click id 2 down
      down(2);
      fixture.detectChanges();
      checkTd({
        id: 2,
        type: 'reproduced',
        reconciledup: true,
        reproduced: undefined,
      });

      checkTr({
        id: 2,
        activeState: undefined
      });
      tick(app.reconcileInterval); // wait for next interval
      fixture.detectChanges();

      checkTr({
        id: 2,
        activeState: true
      });

      tick(mockApiDelay);
      fixture.detectChanges();

      checkTd({
        id: 2,
        type: 'reproduced',
        reconciledup: undefined,
        reproduced: undefined,
      });

      checkRows([
        {
          id: 1,
          down: {disabled: false, checked: true},
          simulateup: {disabled: true, checked: true},
          reproduceup: {disabled: true, checked: false},
        },
        {
          id: 2,
          down: {disabled: true, checked: false},
          simulateup: {disabled: false, checked: false},
          reproduceup: {disabled: false, checked: false},
        },
      ]);
      flush();
      discardPeriodicTasks();
    }));
  });
});
