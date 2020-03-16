 import { Component, OnInit } from '@angular/core';
 import { MatTableDataSource } from '@angular/material/table';
 import { Observable } from 'rxjs';

 import { DataStoreHelperService } from '../app/scripts/datastoreHelper.service';
 import { scriptId } from '../app/scripts/datastore2.service';
 import { ReconcileService2 } from '../app/scripts/reconcile2.service';
 import { Logger } from '../app/logger.service';

 @Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  displayedColumns: string[] = ['select', 'script', 'simulate', 'reproduce', 'empty'];
  dataSource: scriptId[] = [];
  reconcileInterval = 3000;

  constructor(private logger: Logger, private dh: DataStoreHelperService, private rs: ReconcileService2) {}

  ngOnInit() {
    this.rs.initialize().subscribe({
      error: (err) => {
        err.message = `Could not initialize ReconcileService: ${err.message}`;
        this.logger.fatal(err);
      },
      complete: () => {
        this.dataSource = this.dh.getIds();
        this.logger.info('ReconcileService initialize finished.');
        this.main();
      }
    });
  }

  getName(id: scriptId): string {
    return this.dh.getName(id);
  }

  main() {
    this.logger.info('Start reconcile service.');
    setInterval(() => {
      const rec = this.rs.reconcile();
      if (rec === null) {
        return;
      }
      rec.subscribe({
        error: (err: Error) => {
          err.message = `Could not reconcile: ${err.message}`;
          this.logger.error(err);
        }
      });
    }, this.reconcileInterval);
  }

  canUpTo(id: scriptId): boolean {
    return this.dh.canUpTo(id);
  }
  canDownTo(id: scriptId): boolean {
    return this.dh.canDownTo(id);
  }
  simulatedUpTo(id: scriptId): boolean {
    return this.dh.simulatedUpTo(id);
  }
  reproducedUpTo(id: scriptId): boolean {
    return this.dh.reproducedUpTo(id);
  }
  realSimulatedUpTo(id: scriptId): boolean {
    return this.rs.simulatedUpTo(id);
  }
  realReproducedUpTo(id: scriptId): boolean {
    return this.rs.reproducedUpTo(id);
  }
  wasUpTo(id: scriptId): boolean {
    return this.dh.wasUpTo(id);
  }
  simulateUpTo(id: scriptId): void {
    this.dh.simulateUpTo(id).subscribe((ok: boolean) => {
      this.logger.info('finish simulateUpTo()');
    });
  }
  reproduceUpTo(id: scriptId): void {
    this.dh.reproduceUpTo(id).subscribe((ok: boolean) => {
      this.logger.info('finish reproduceUpTo()');
    });
  }
  downTo(id: scriptId): void {
    this.dh.downTo(id).subscribe((ok: boolean) => {
      this.logger.info('down');
    });
  }
  isActive(id: scriptId): boolean {
    return this.rs.isActive(id);
  }
}
