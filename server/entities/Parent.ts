import { Entity, OneToMany, Collection, Property, Unique, BeforeCreate } from '@mikro-orm/core';
import { User, UserRole } from './User';
import { ParentStudentLink } from './ParentStudentLink';
import { randomBytes } from 'crypto';

@Entity({ discriminatorValue: 'parent' })
export class Parent extends User {
    @Property()
    @Unique()
    linkingCode!: string;

    @OneToMany(() => ParentStudentLink, link => link.parent)
    studentLinks = new Collection<ParentStudentLink>(this);

    @BeforeCreate()
    generateLinkingCode() {
        if (!this.linkingCode) {
            // Generate a unique 8-character alphanumeric code for parent authentication
            this.linkingCode = randomBytes(4).toString('hex').toUpperCase();
        }
    }

    constructor(name: string, email: string, password: string) {
        super(name, email, password, UserRole.Parent);
    }

    /**
     * Static factory method to create a parent with linking code only
     * Used for code-based authentication without traditional email/password
     */
    static createWithLinkingCode(name: string): Parent {
        // Generate a temporary email and password for database constraints
        const tempEmail = `parent_${randomBytes(8).toString('hex')}@temp.local`;
        const tempPassword = randomBytes(16).toString('hex');
        return new Parent(name, tempEmail, tempPassword);
    }
}

