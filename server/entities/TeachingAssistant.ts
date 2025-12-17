import { Entity } from '@mikro-orm/core';
import { User, UserRole } from './User';

@Entity({ discriminatorValue: 'teaching_assistant' })
export class TeachingAssistant extends User {
    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.TeachingAssistant);
    }
}
