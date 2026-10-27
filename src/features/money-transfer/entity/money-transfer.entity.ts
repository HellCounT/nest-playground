import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';
import { User } from '../../user/entity/user.entity.js';

@Entity()
@Unique(['senderId', 'idempotencyKey'])
export class MoneyTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.sentTransfers, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'senderId' })
  sender: Relation<User>;

  @Column('uuid')
  senderId: string;

  @ManyToOne(() => User, (u) => u.receivedTransfers, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'recipientId' })
  recipient: Relation<User>;

  @Column('uuid')
  recipientId: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: string;

  @Column('uuid')
  idempotencyKey: string;

  // @Column({ type: 'varchar' })
  // status: string;

  @CreateDateColumn()
  createdAt: Date;
}
