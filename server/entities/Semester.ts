import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

export enum SemesterStatus {
    Active = "active",
    Inactive = "inactive",
    Finalized = "finalized"
}

@Entity()
export class Semester extends BaseEntity {
    @Property()
    @Unique()
    name!: string; // e.g., "Fall 2025"
    
    @Property()
    startDate!: Date;
    
    @Property()
    endDate!: Date;
    
    @Enum({ items: () => SemesterStatus })
    status: SemesterStatus = SemesterStatus.Inactive;

    constructor(name: string, startDate: Date, endDate: Date) {
        super();
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}

