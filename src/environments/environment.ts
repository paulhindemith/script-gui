// import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';

import { MockWebApiService } from '../app/mock-web-api.service';

@NgModule({
  imports: [
    HttpClientInMemoryWebApiModule.forRoot(MockWebApiService, { delay: 500 })
  ]
})
export class EnvironmentModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: EnvironmentModule,
      providers: []
    };
  }
}

export const environment = {
  production: false,
};
