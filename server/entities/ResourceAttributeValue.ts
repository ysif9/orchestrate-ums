import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Resource } from './Resource';

@Entity()
export class ResourceAttributeValue extends BaseAttributeValue {
  @ManyToOne(() => Resource)
  resource!: Resource;

  constructor(resource: Resource) {
    super();
    this.resource = resource;
  }
}
