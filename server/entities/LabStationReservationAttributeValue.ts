import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { LabStationReservation } from './LabStationReservation';

@Entity()
export class LabStationReservationAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => LabStationReservation)
    labStationReservation!: LabStationReservation;

    constructor(labStationReservation: LabStationReservation) {
        super();
        this.labStationReservation = labStationReservation;
    }
}
