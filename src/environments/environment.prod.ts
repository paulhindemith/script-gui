import { ModuleWithProviders, NgModule } from '@angular/core';

@NgModule({
  imports: []
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
  production: true,
};
