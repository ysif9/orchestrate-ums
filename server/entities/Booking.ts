import { Entity, Property, Enum, ManyToOne, Ref, Collection, OneToMany } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Room } from './Room';
import { User } from './User';
import { BookingAttributeValue } from './BookingAttributeValue';



/**
 * Booking status enum representing the lifecycle of a room booking.
 * Using integers for better database performance.
 */
export enum BookingStatus {
    Pending = 1,
    Confirmed = 2,
    Cancelled = 3
}

@Entity()
export class Booking extends BaseEntity {
    @Property()
    title!: string;

    @Property({ nullable: true })
    description?: string;

    @Property()
    startTime!: Date;

    @Property()
    endTime!: Date;

    @Enum({ items: () => BookingStatus })
    status: BookingStatus = BookingStatus.Confirmed;

    @ManyToOne(() => Room, { ref: true })
    room!: Ref<Room>;

    @ManyToOne(() => User, { ref: true })
    createdBy!: Ref<User>;

    @Property({ nullable: true })
    notes?: string;

    @OneToMany(() => BookingAttributeValue, (eav) => eav.booking, { cascade: ["all" as any] })
    attributes = new Collection<BookingAttributeValue>(this);

    constructor(title: string, startTime: Date, endTime: Date, room: Room, createdBy: User) {
        super();
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room as any;
        this.createdBy = createdBy as any;
    }
}

