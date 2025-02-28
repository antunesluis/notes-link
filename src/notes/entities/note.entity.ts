import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  text: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  date: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  // Many notes can be sent by one user
  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  // The column that will be used to reference the id of the user that sent the note
  @JoinColumn({ name: 'from' })
  from: User;

  // Many notes can be sent to one user
  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  // The column that will be used to reference the id of the user that sent the note
  @JoinColumn({ name: 'to' })
  to: User;
}
