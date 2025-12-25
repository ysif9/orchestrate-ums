import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';


//@Observation
// Semester status can be replaced with int
// Doesn't require EAV but name can be replaced with INT but unnecessary


// @Solution
// Switch to INT

export enum SemesterStatus {
    Active = 1,
    Inactive = 2,
    Finalized = 3
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

    @Property({ nullable: true })
    dropDate?: Date; // Last date students can drop courses for this semester

    @Enum({ items: () => SemesterStatus })
    status: SemesterStatus;

    constructor(name: string, startDate: Date, endDate: Date, dropDate?: Date) {
        super();
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.dropDate = dropDate;
        this.status = SemesterStatus.Inactive;
    }
}

