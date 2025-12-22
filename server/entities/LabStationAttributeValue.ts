import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { LabStation } from './LabStation';

@Entity()
export class LabStationAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => LabStation)
    labStation!: LabStation;

    constructor(labStation: LabStation) {
        super();
        this.labStation = labStation;
    }
}
