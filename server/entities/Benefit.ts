import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

@Entity()
export class Benefit extends BaseEntity {
    @ManyToOne(() => User)
    user!: User;

    @Property()
    name!: string;

    @Property({ nullable: true })
    category?: string;

    @Property({ type: 'text', nullable: true })
    description?: string;

    @Property({ nullable: true })
    value?: string;

    constructor(user: User, name: string, category?: string, description?: string, value?: string) {
        super();
        this.user = user;
        this.name = name;
        this.category = category;
        this.description = description;
        this.value = value;
    }
}
