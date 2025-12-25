// @ts-ignore
import { Entity, Property, Enum, ManyToOne, Ref, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { LabStation } from './LabStation';
import { User } from './User';
import { LabStationReservationAttributeValue } from './LabStationReservationAttributeValue';

//@Observation
// Reservation status can be replaced with int
//Purpose and notes can be combined into EAV for expandability


// @Solution
// Switch to EAV and INT

export enum ReservationStatus {
    Active = 1,
    Completed = 2,
    Cancelled = 3,
    Expired = 4
}

// Maximum reservation duration in hours
export const MAX_RESERVATION_DURATION_HOURS = 4;

@Entity()
export class LabStationReservation extends BaseEntity {
    @ManyToOne(() => LabStation, { ref: true })
    station!: Ref<LabStation>;

    @ManyToOne(() => User, { ref: true })
    student!: Ref<User>;

    @Property()
    startTime!: Date;

    @Property()
    endTime!: Date;

    @Enum({ items: () => ReservationStatus })
    status: ReservationStatus = ReservationStatus.Active;

    @Property({ nullable: true })
    expirationAlertSent?: boolean;

    @OneToMany(() => LabStationReservationAttributeValue, av => av.labStationReservation, { cascade: [Cascade.ALL] })
    attributes = new Collection<LabStationReservationAttributeValue>(this);

    constructor(station: LabStation, student: User, startTime: Date, endTime: Date) {
        super();
        this.station = station as unknown as Ref<LabStation>;
        this.student = student as unknown as Ref<User>;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

