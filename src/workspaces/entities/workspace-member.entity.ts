import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Workspace } from './workspace.entity.js';
import type { Relation } from 'typeorm';

@Entity('workspace-members')
export class WorkspaceMembers {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.workspaceMembers)
  workspace!: Relation<Workspace>;
}
