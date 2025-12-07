import { Entity, Property, Enum, ManyToOne, Ref } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Room } from './Room';
import { User } from './User';

export enum BookingStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    Cancelled = 'cancelled'
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
    bookedBy!: Ref<User>;

    @Property({ nullable: true })
    notes?: string;

    constructor(title: string, startTime: Date, endTime: Date, room: Room, bookedBy: User) {
        super();
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room as unknown as Ref<Room>;
        this.bookedBy = bookedBy as unknown as Ref<User>;
    }
}

