import { Entity, OneToMany, Collection } from '@mikro-orm/core';
import { User, UserRole } from './User';

@Entity({ discriminatorValue: 'professor' })
export class Professor extends User {
  @OneToMany('Publication', 'professor')
  publications = new Collection<any>(this);

  constructor(name: string, email: string, password: string) {
    super(name, email, password, UserRole.Professor);
  }
}
