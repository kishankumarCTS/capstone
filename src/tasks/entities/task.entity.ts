import { User } from 'src/users/entities/user.entities.js';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from './comment.entity.js';
import { Project } from 'src/projects/entities/project.entity.js';
import type { Relation } from 'typeorm';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.LOW,
  })
  priority!: TaskPriority;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  updatedAt!: Date;

  @CreateDateColumn()
  dueDate!: Date;

  @ManyToOne(() => User, (user) => user.task)
  assignee?: Relation<User>;

  @OneToMany(() => Comment, (comment) => comment.task)
  comment?: Relation<Comment[]>;

  @ManyToOne(() => Project, (project) => project.tasks)
  project?: Relation<Project>;
}
