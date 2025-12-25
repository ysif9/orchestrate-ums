import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Staff } from './Staff';

// Integer enum for event status (following DB best practices)
export enum EventStatus {
    Draft = 0,
    Published = 1,
    Ongoing = 2,
    Completed = 3,
    Cancelled = 4
}

// Integer enum for event priority
export enum EventPriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Featured = 3
}



@Entity()
export class Event extends BaseEntity {
    @Property({ type: 'text' })
    title!: string;

    @Property({ type: 'text' })
    description!: string;

    @ManyToOne(() => Staff)
    organizer!: Staff;

    @Enum({ items: () => EventStatus, default: EventStatus.Draft })
    status: EventStatus = EventStatus.Draft;

    @Enum({ items: () => EventPriority, default: EventPriority.Normal })
    priority: EventPriority = EventPriority.Normal;



    // Required: Event start date/time
    @Property()
    startDate!: Date;

    // Required: Event end date/time
    @Property()
    endDate!: Date;

    @Property({ nullable: true, type: 'text' })
    location?: string;

    @Property({ nullable: true })
    publishedAt?: Date;

    constructor(
        title: string,
        description: string,
        organizer: Staff,
        startDate: Date,
        endDate: Date,
        status: EventStatus = EventStatus.Draft,
        priority: EventPriority = EventPriority.Normal
    ) {
        super();
        this.title = title;
        this.description = description;
        this.organizer = organizer;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.priority = priority;

    }
}
