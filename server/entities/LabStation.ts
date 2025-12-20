import { Entity, Property, Enum, ManyToOne, OneToMany, Collection, Ref, Cascade } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Room } from './Room';
import { LabStationReservation } from './LabStationReservation';
import { LabStationAttributeValue } from './LabStationAttributeValue';

export enum LabStationStatus {
    Available = 1,
    Reserved = 2,
    Occupied = 3,
    OutOfService = 4
}

@Entity()
export class LabStation extends BaseEntity {
    @Property()
    stationNumber!: number;

    @Property({ default: '' })
    description: string = '';

    @ManyToOne(() => Room, { ref: true })
    lab!: Ref<Room>;

    @Enum({ items: () => LabStationStatus })
    status: LabStationStatus = LabStationStatus.Available;

    @Property({ default: true })
    isActive: boolean = true;

    @OneToMany(() => LabStationReservation, reservation => reservation.station)
    reservations = new Collection<LabStationReservation>(this);

    @OneToMany(() => LabStationAttributeValue, av => av.labStation, { cascade: [Cascade.ALL] })
    attributes = new Collection<LabStationAttributeValue>(this);

    constructor(stationNumber: number, lab: Room) {
        super();
        this.stationNumber = stationNumber;
        this.lab = lab as unknown as Ref<Room>;
    }
}

