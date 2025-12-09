// @ts-ignore
import { Entity, Property, Enum, ManyToOne, Ref } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { LabStation } from './LabStation';
import { User } from './User';

export enum ReservationStatus {
    Active = 'active',
    Completed = 'completed',
    Cancelled = 'cancelled',
    Expired = 'expired'
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
    purpose?: string;

    @Property({ nullable: true })
    notes?: string;

    @Property({ nullable: true })
    expirationAlertSent?: boolean;

    constructor(station: LabStation, student: User, startTime: Date, endTime: Date) {
        super();
        this.station = station as unknown as Ref<LabStation>;
        this.student = student as unknown as Ref<User>;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

