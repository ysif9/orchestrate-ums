import { Entity, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Course } from './Course';

@Entity()
export class Message extends BaseEntity {
    @ManyToOne(() => User)
    sender!: User;

    @ManyToOne(() => User)
    receiver!: User;

    @Property({ type: 'text' })
    content!: string;

    @ManyToOne(() => Course, { nullable: true })
    course?: Course;

    @Property()
    isRead: boolean = false;

    @ManyToOne(() => Message, { nullable: true })
    parent?: Message;

    @OneToMany(() => Message, message => message.parent)
    replies = new Collection<Message>(this);

    constructor(sender: User, receiver: User, content: string, course?: Course, parent?: Message) {
        super();
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
        if (course) {
            this.course = course;
        }
        if (parent) {
            this.parent = parent;
        }
    }
}
