import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Professor } from './Professor';

@Entity()
export class Publication extends BaseEntity {
    @Property()
    title!: string;

    @Property({ type: 'text', nullable: true })
    authors?: string;

    @Property({ nullable: true })
    journalConference?: string;

    @Property({ nullable: true })
    year?: number;

    @Property({ nullable: true })
    url?: string;

    @ManyToOne(() => Professor)
    professor!: Professor;

    constructor(title: string, professor: Professor) {
        super();
        this.title = title;
        this.professor = professor;
    }
}
