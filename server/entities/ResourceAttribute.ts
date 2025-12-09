// entities/ResourceAttribute.ts
import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

export enum AttributeDataType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Boolean = 'boolean',
}

@Entity()
export class ResourceAttribute extends BaseEntity {
  @Property({ unique: true })
  key!: string;

  @Property()
  label!: string;

  @Enum({ items: () => AttributeDataType })
  dataType!: AttributeDataType;

  constructor(key?: string, label?: string, dataType?: AttributeDataType) {
    super();
    if (key) this.key = key;
    if (label) this.label = label;
    if (dataType) this.dataType = dataType;
  }
}
