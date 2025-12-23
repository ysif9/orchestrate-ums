import { Entity, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Parent } from './Parent';
import { Student } from './Student';
import { Course } from './Course';
import { User } from './User';

/**
 * Status enum for parent inquiries using integers for performance
 * Open = 1: Active conversation
 * Resolved = 2: Issue resolved but visible
 * Archived = 3: Removed from active inbox
 */
export enum InquiryStatus {
    Open = 1,
    Resolved = 2,
    Archived = 3,
}

/**
 * ParentInquiry represents a conversation thread between a parent and professor
 * about a specific student in a specific course.
 * 
 * Follows database best practices:
 * - Integer-based enum for status
 * - No null values (all fields required or have defaults)
 * - Foreign key relationships (no string duplication)
 * - Normalized structure
 */
@Entity()
export class ParentInquiry extends BaseEntity {
    @ManyToOne(() => Parent, { nullable: false })
    parent!: Parent;

    @ManyToOne(() => Student, { nullable: false })
    student!: Student;

    @ManyToOne(() => Course, { nullable: false })
    course!: Course;

    @ManyToOne(() => User, { nullable: false })
    professor!: User; // The professor teaching the course

    @Property({ type: 'text', nullable: false })
    subject!: string;

    @Enum({ items: () => InquiryStatus, nullable: false })
    status: InquiryStatus = InquiryStatus.Open;

    @Property({ nullable: false })
    lastMessageAt: Date = new Date();

    @Property({ nullable: false })
    hasUnreadParentMessages: boolean = false; // Unread messages from parent (for professor)

    @Property({ nullable: false })
    hasUnreadProfessorMessages: boolean = false; // Unread messages from professor (for parent)

    @OneToMany(() => InquiryMessage, message => message.inquiry, { cascade: ['all' as any] })
    messages = new Collection<InquiryMessage>(this);

    constructor(parent: Parent, student: Student, course: Course, professor: User, subject: string) {
        super();
        this.parent = parent;
        this.student = student;
        this.course = course;
        this.professor = professor;
        this.subject = subject;
    }
}

/**
 * InquiryMessage represents individual messages within a ParentInquiry thread
 * 
 * Follows database best practices:
 * - No nulls (all fields required)
 * - Integer-based boolean for isFromParent (could be enum if more senders added)
 * - Foreign key to inquiry (normalized)
 */
@Entity()
export class InquiryMessage extends BaseEntity {
    @ManyToOne(() => ParentInquiry, { nullable: false })
    inquiry!: ParentInquiry;

    @ManyToOne(() => User, { nullable: false })
    sender!: User; // Either parent or professor

    @Property({ type: 'text', nullable: false })
    content!: string;

    @Property({ nullable: false })
    isFromParent: boolean = false; // true if sent by parent, false if sent by professor

    @Property({ nullable: false })
    isRead: boolean = false;

    constructor(inquiry: ParentInquiry, sender: User, content: string, isFromParent: boolean) {
        super();
        this.inquiry = inquiry;
        this.sender = sender;
        this.content = content;
        this.isFromParent = isFromParent;
    }
}
