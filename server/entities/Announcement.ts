import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { Staff } from './Staff';

// Integer enum for announcement status (following DB best practices)
export enum AnnouncementStatus {
    Draft = 0,
    Published = 1,
    Scheduled = 2,
    Archived = 3
}

// Integer enum for announcement priority
export enum AnnouncementPriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Urgent = 3
}

// Integer enum for target audience
export enum AnnouncementAudience {
    All = 0,
    Students = 1,
    Staff = 2,
    Professors = 3,
    Parents = 4
}

@Entity()
export class Announcement extends BaseEntity {
    @Property({ type: 'text' })
    title!: string;

    @Property({ type: 'text' })
    content!: string;

    @ManyToOne(() => Staff)
    author!: Staff;

    @Enum({ items: () => AnnouncementStatus, default: AnnouncementStatus.Draft })
    status: AnnouncementStatus = AnnouncementStatus.Draft;

    @Enum({ items: () => AnnouncementPriority, default: AnnouncementPriority.Normal })
    priority: AnnouncementPriority = AnnouncementPriority.Normal;

    @Enum({ items: () => AnnouncementAudience, default: AnnouncementAudience.All })
    audience: AnnouncementAudience = AnnouncementAudience.All;

    @Property({ nullable: true })
    scheduledAt?: Date;

    @Property({ nullable: true })
    publishedAt?: Date;

    @Property({ nullable: true })
    expiresAt?: Date;

    constructor(
        title: string,
        content: string,
        author: Staff,
        status: AnnouncementStatus = AnnouncementStatus.Draft,
        priority: AnnouncementPriority = AnnouncementPriority.Normal,
        audience: AnnouncementAudience = AnnouncementAudience.All
    ) {
        super();
        this.title = title;
        this.content = content;
        this.author = author;
        this.status = status;
        this.priority = priority;
        this.audience = audience;
    }
}
