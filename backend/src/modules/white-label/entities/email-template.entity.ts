import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { EmailTemplateType } from '../white-label.service';

@Entity('email_templates')
@Index(['tenantId', 'templateType'], { unique: true })
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: EmailTemplateType,
  })
  templateType: EmailTemplateType;

  @Column({ type: 'varchar', length: 500 })
  subject: string;

  @Column({ type: 'text' })
  htmlContent: string;

  @Column({ type: 'text' })
  textContent: string;

  @Column({ type: 'jsonb', nullable: true })
  variables: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
