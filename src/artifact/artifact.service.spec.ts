/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ArtifactService } from './artifact.service';

describe('Service: Artifact', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArtifactService]
    });
  });

  it('should ...', inject([ArtifactService], (service: ArtifactService) => {
    expect(service).toBeTruthy();
  }));
});
