// @ts-ignore
import { Entity, Property, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Booking } from './Booking';

export enum RoomType {
    Classroom = 'classroom',
    Lab = 'lab',
    LectureHall = 'lecture_hall',
    ConferenceRoom = 'conference_room'
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

    @Property({ nullable: true })
    description?: string;

    @Property({ default: true })
    isAvailable: boolean = true;

    @Property({ type: 'json', nullable: true })
    amenities?: string[];

    @OneToMany(() => Booking, booking => booking.room)
    bookings = new Collection<Booking>(this);

    constructor(name: string, building: string, floor: number, capacity: number, type: RoomType) {
        super();
        this.name = name;
        this.building = building;
        this.floor = floor;
        this.capacity = capacity;
        this.type = type;
    }
}

