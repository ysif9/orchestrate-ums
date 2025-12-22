import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { ProfessionalDevelopment } from './ProfessionalDevelopment';

@Entity()
export class ProfessionalDevelopmentAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => ProfessionalDevelopment)
    professionalDevelopment!: ProfessionalDevelopment;

    constructor(professionalDevelopment: ProfessionalDevelopment) {
        super();
        this.professionalDevelopment = professionalDevelopment;
    }
}
