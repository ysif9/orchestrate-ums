import { Entity, Property, Enum, ManyToOne, OneToMany, Collection, Ref } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Room } from './Room';
import { LabStationReservation } from './LabStationReservation';

export enum LabStationStatus {
    Available = 'available',
    Reserved = 'reserved',
    Occupied = 'occupied',
    OutOfService = 'out_of_service'
}

@Entity()
export class LabStation extends BaseEntity {
    @Property()
    stationNumber!: string;

    @Property({ nullable: true })
    description?: string;

    @ManyToOne(() => Room, { ref: true })
    lab!: Ref<Room>;

    @Enum({ items: () => LabStationStatus })
    status: LabStationStatus = LabStationStatus.Available;

    @Property({ type: 'json', nullable: true })
    equipment?: string[];

    @Property({ default: true })
    isActive: boolean = true;

    @OneToMany(() => LabStationReservation, reservation => reservation.station)
    reservations = new Collection<LabStationReservation>(this);

    constructor(stationNumber: string, lab: Room) {
        super();
        this.stationNumber = stationNumber;
        this.lab = lab as unknown as Ref<Room>;
    }
}

