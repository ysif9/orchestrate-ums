// @ts-ignore
import { Entity, Property, Enum, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Booking } from './Booking';

//@Observation
// Room type can be replaced with int
// Amenities and description can be combined into EAV for expandability

// @Solution
// Switch to EAV and INT
import { RoomAttributeValue } from './RoomAttributeValue';

export enum RoomType {
    Classroom = 1,
    Lab = 2,
    LectureHall = 3,
    ConferenceRoom = 4
}

@Entity()
export class Room extends BaseEntity {
    @Property()
    name!: string;

    @Property()
    building!: string;

    @Property()
    floor!: number;

    @Property()
    capacity!: number;

    @Enum({ items: () => RoomType })
    type!: RoomType;

    @Property({ default: true })
    isAvailable: boolean = true;

    @OneToMany(() => Booking, booking => booking.room)
    bookings = new Collection<Booking>(this);

    @OneToMany(() => RoomAttributeValue, av => av.room, { cascade: [Cascade.ALL] })
    attributes = new Collection<RoomAttributeValue>(this);

    constructor(name: string, building: string, floor: number, capacity: number, type: RoomType) {
        super();
        this.name = name;
        this.building = building;
        this.floor = floor;
        this.capacity = capacity;
        this.type = type;
    }
}

