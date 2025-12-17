import { Entity, ManyToOne, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

export enum PDActivityType {
    Workshop = 'Workshop',
    Conference = 'Conference',
    Certification = 'Certification',
    Other = 'Other',
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

    @Property()
    provider!: string;

    @Property({ nullable: true })
    notes?: string;

    constructor(
        professor: User,
        title: string,
        activityType: PDActivityType,
        date: Date,
        hours: number,
        provider: string,
        notes?: string
    ) {
        super();
        this.professor = professor;
        this.title = title;
        this.activityType = activityType;
        this.date = date;
        this.hours = hours;
        this.provider = provider;
        this.notes = notes;
    }
}
