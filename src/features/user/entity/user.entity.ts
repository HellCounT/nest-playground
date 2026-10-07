import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Session } from '../../session/entity/session.entity.js';
import { Avatar } from '../../avatar/entity/avatar.entity.js';

@Entity()
export class User {
  @PrimaryColumn('uuid', { unique: true })
  id: string;

  @Column('varchar', { unique: true })
  login: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('varchar')
  passwordHash: string;

  @Index()
  @Column('integer')
  age: number;

  @Column({ type: 'varchar', length: 1000 })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => Session, (s) => s.user)
  sessions: Relation<Session[]>;

  @OneToMany(() => Avatar, (a) => a.user)
  avatars: Relation<Avatar[]>;

  latestAvatar?: Relation<Avatar>;
}
