import { Entity, Property } from '@mikro-orm/core';
import { User, UserRole } from './User';

@Entity({ discriminatorValue: 'teaching_assistant' })
export class TeachingAssistant extends User {
    @Property({ nullable: true })
    phone?: string;

    @Property({ nullable: true })
    officeLocation?: string;

    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.TeachingAssistant);
    }
}
