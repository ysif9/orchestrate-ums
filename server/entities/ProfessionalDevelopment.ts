import { Entity, ManyToOne, Property, Enum, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { ProfessionalDevelopmentAttributeValue } from './ProfessionalDevelopmentAttributeValue';

export enum PDActivityType {
    Workshop = 1,
    Conference = 2,
    Certification = 3,
    Other = 4,
}

@Entity()
export class ProfessionalDevelopment extends BaseEntity {
    @ManyToOne(() => User)
    professor!: User;

    @Property()
    title!: string;

    @Enum(() => PDActivityType)
    activityType!: PDActivityType;

    @Property()
    date!: Date;

    @Property()
    hours!: number;

    @OneToMany(() => ProfessionalDevelopmentAttributeValue, av => av.professionalDevelopment, { cascade: [Cascade.ALL] })
    attributes = new Collection<ProfessionalDevelopmentAttributeValue>(this);

    constructor(
        professor: User,
        title: string,
        activityType: PDActivityType,
        date: Date,
        hours: number
    ) {
        super();
        this.professor = professor;
        this.title = title;
        this.activityType = activityType;
        this.date = date;
        this.hours = hours;
    }
}
