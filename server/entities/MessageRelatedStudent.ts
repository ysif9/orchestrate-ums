
import { Entity, OneToOne, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Message } from './Message';
import { Student } from './Student';

@Entity()
export class MessageRelatedStudent extends BaseEntity {
    @OneToOne(() => Message, { owner: true })
    @Unique()
    message!: Message;

    @ManyToOne(() => Student)
    student!: Student;

    constructor(message: Message, student: Student) {
        super();
        this.message = message;
        this.student = student;
    }
}
