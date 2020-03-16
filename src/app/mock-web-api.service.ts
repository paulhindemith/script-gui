import { Injectable } from '@angular/core';

import { InMemoryDbService } from 'angular-in-memory-web-api';

@Injectable()
export class MockWebApiService implements InMemoryDbService {
  private api: any = {
    scripts: [
      '0',
      'logger/unit-test',
      'k8sclient/unit-test',
      'cluster/unit-test',
      'knative/unit-test',
      'istio/unit-test',
    ],
    simulate: [
      {
        id: 0,
        name: '0',
      },
      {
        id: 1,
        name: 'logger/unit-test',
      },
      {
        id: 2,
        name: 'k8sclient/unit-test',
      },
      {
        id: 3,
        name: 'cluster/unit-test',
      },
      {
        id: 4,
        name: 'knative/unit-test',
      },
      {
        id: 5,
        name: 'istio/unit-test',
      },
    ],
    reproduce: [
      {
        id: 1,
        name: 'logger/unit-test',
      },
      {
        id: 2,
        name: 'k8sclient/unit-test',
      },
      {
        id: 3,
        name: 'cluster/unit-test',
      },
      {
        id: 4,
        name: 'knative/unit-test',
      },
      {
        id: 5,
        name: 'istio/unit-test',
      },

    ],
  };

  public createDb(): any {
    return this.api;
  }
}
