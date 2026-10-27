import {
  Check,
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
import { MoneyTransfer } from '../../money-transfer/entity/money-transfer.entity.js';

@Entity()
@Check('CHK_user_balance_is_positive_or_zero', '"balance" >= 0')
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

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  balance: string;

  @OneToMany(() => Session, (s) => s.user)
  sessions: Relation<Session[]>;

  @OneToMany(() => Avatar, (a) => a.user)
  avatars: Relation<Avatar[]>;

  latestAvatar?: Relation<Avatar>;

  @OneToMany(() => MoneyTransfer, (t) => t.sender)
  sentTransfers: Relation<MoneyTransfer[]>;

  @OneToMany(() => MoneyTransfer, (t) => t.recipient)
  receivedTransfers: Relation<MoneyTransfer[]>;
}
