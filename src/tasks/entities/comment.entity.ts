import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.entity.js';
import { User } from 'src/users/entities/user.entities.js';
import type { Relation } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  body!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Task, (task) => task)
  task!: Relation<Task>;

  @ManyToOne(() => User, (user) => user)
  author!: Relation<User>;
}
