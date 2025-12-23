import { Entity, Property } from '@mikro-orm/core';
import { User, UserRole } from './User';

@Entity({ discriminatorValue: 'teaching_assistant' })
export class TeachingAssistant extends User {
    @Property({ nullable: false })
    phone = "01000000000";

    @Property({ nullable: false })
    officeLocation = "Office 1";

    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.TeachingAssistant);
    }
}
