import {
  Briefcase,
  Calendar,
  ClipboardCheck,
  FileQuestion,
  Gift,
  MapPin,
  MessageSquare,
  UserCheck,
  Users,
} from 'lucide-react'
import type { EntityConfig } from '../components/RecruitmentCrudIndexPage'
import { statusOptions, toOptions } from '../components/RecruitmentCrudIndexPage'

const yesNo = (t: (k: string) => string) => [
  { value: '1', label: t('Yes') },
  { value: '0', label: t('No') },
]

export const JOB_LOCATIONS_CONFIG: EntityConfig = {
  title: 'Job locations',
  listKey: 'job-locations',
  apiBase: '/recruitment/job-locations',
  labelKeys: ['name', 'city', 'id'],
  emptyIcon: MapPin,
  permissions: {
    create: 'create-job-locations',
    edit: 'edit-job-locations',
    delete: 'delete-job-locations',
  },
  buildFields: (_meta, t) => [
    { name: 'name', label: t('Name'), required: true },
    { name: 'remote_work', label: t('Remote work'), type: 'select', options: yesNo(t) },
    { name: 'address', label: t('Address'), type: 'textarea' },
    { name: 'city', label: t('City') },
    { name: 'state', label: t('State') },
    { name: 'country', label: t('Country') },
    { name: 'postal_code', label: t('Postal code') },
    { name: 'status', label: t('Active'), type: 'select', options: yesNo(t) },
  ],
}

export const CUSTOM_QUESTIONS_CONFIG: EntityConfig = {
  title: 'Custom questions',
  listKey: 'custom-questions',
  apiBase: '/recruitment/custom-questions',
  labelKeys: ['question', 'id'],
  emptyIcon: FileQuestion,
  permissions: {
    create: 'create-custom-questions',
    edit: 'edit-custom-questions',
    delete: 'delete-custom-questions',
  },
  buildFields: (_meta, t) => [
    { name: 'question', label: t('Question'), required: true },
    {
      name: 'type',
      label: t('Type'),
      type: 'select',
      required: true,
      options: [
        { value: 'text', label: t('Text') },
        { value: 'textarea', label: t('Textarea') },
        { value: 'select', label: t('Select') },
        { value: 'checkbox', label: t('Checkbox') },
        { value: 'radio', label: t('Radio') },
      ],
    },
    { name: 'options', label: t('Options'), type: 'textarea' },
    { name: 'sort_order', label: t('Sort order'), type: 'number' },
    { name: 'is_required', label: t('Required'), type: 'select', options: yesNo(t) },
    { name: 'is_active', label: t('Active'), type: 'select', options: yesNo(t) },
  ],
}

export const INTERVIEW_ROUNDS_CONFIG: EntityConfig = {
  title: 'Interview rounds',
  listKey: 'interview-rounds',
  apiBase: '/recruitment/interview-rounds',
  metaPath: '/recruitment/interview-rounds/index-meta',
  labelKeys: ['name', 'id'],
  emptyIcon: Briefcase,
  permissions: {
    create: 'create-interview-rounds',
    edit: 'edit-interview-rounds',
    delete: 'delete-interview-rounds',
  },
  buildFields: (meta, t) => [
    { name: 'name', label: t('Name'), required: true },
    {
      name: 'job_id',
      label: t('Job posting'),
      type: 'select',
      required: true,
      options: toOptions(meta.job_postings as never),
    },
    { name: 'sequence_number', label: t('Sequence'), type: 'number', required: true },
    { name: 'description', label: t('Description'), type: 'textarea' },
    {
      name: 'status',
      label: t('Status'),
      type: 'select',
      required: true,
      options: [
        { value: 'Active', label: t('Active') },
        { value: 'Inactive', label: t('Inactive') },
      ],
    },
  ],
}

export const INTERVIEWS_CONFIG: EntityConfig = {
  title: 'Interviews',
  listKey: 'interviews',
  apiBase: '/recruitment/interviews',
  metaPath: '/recruitment/interviews/index-meta',
  labelKeys: ['scheduled_date', 'status', 'id'],
  emptyIcon: Calendar,
  permissions: {
    create: 'create-interviews',
    edit: 'edit-interviews',
    delete: 'delete-interviews',
  },
  buildFields: (meta, t) => [
    {
      name: 'candidate_id',
      label: t('Candidate'),
      type: 'select',
      required: true,
      options: toOptions(meta.candidates as never),
    },
    {
      name: 'round_id',
      label: t('Interview round'),
      type: 'select',
      required: true,
      options: toOptions(meta.interview_rounds as never),
    },
    {
      name: 'interview_type_id',
      label: t('Interview type'),
      type: 'select',
      required: true,
      options: toOptions(meta.interview_types as never),
    },
    { name: 'scheduled_date', label: t('Date'), type: 'date', required: true },
    { name: 'scheduled_time', label: t('Time'), type: 'time', required: true },
    { name: 'duration', label: t('Duration (min)'), type: 'number', required: true },
    { name: 'location', label: t('Location') },
    { name: 'meeting_link', label: t('Meeting link') },
    {
      name: 'status',
      label: t('Status'),
      type: 'select',
      required: true,
      options: statusOptions(meta.statuses as never),
    },
  ],
}

export const INTERVIEW_FEEDBACKS_CONFIG: EntityConfig = {
  title: 'Interview feedback',
  listKey: 'interview-feedbacks',
  apiBase: '/recruitment/interview-feedbacks',
  metaPath: '/recruitment/interview-feedbacks/index-meta',
  labelKeys: ['recommendation', 'overall_rating', 'id'],
  emptyIcon: MessageSquare,
  permissions: {
    create: 'create-interview-feedbacks',
    edit: 'edit-interview-feedbacks',
    delete: 'delete-interview-feedbacks',
  },
  buildFields: (meta, t) => [
    {
      name: 'interview_id',
      label: t('Interview'),
      type: 'select',
      required: true,
      options: toOptions(
        (meta.interviews as Array<{ id: number; scheduled_date?: string }> | undefined)?.map((i) => ({
          id: i.id,
          name: `#${i.id} ${i.scheduled_date ?? ''}`,
        })),
      ),
    },
    { name: 'overall_rating', label: t('Overall rating'), type: 'number' },
    { name: 'technical_rating', label: t('Technical rating'), type: 'number' },
    { name: 'communication_rating', label: t('Communication rating'), type: 'number' },
    { name: 'cultural_fit_rating', label: t('Cultural fit rating'), type: 'number' },
    { name: 'strengths', label: t('Strengths'), type: 'textarea' },
    { name: 'weaknesses', label: t('Weaknesses'), type: 'textarea' },
    { name: 'comments', label: t('Comments'), type: 'textarea' },
    {
      name: 'recommendation',
      label: t('Recommendation'),
      type: 'select',
      options: statusOptions(meta.recommendations as never),
    },
  ],
}

export const CANDIDATE_ASSESSMENTS_CONFIG: EntityConfig = {
  title: 'Candidate assessments',
  listKey: 'candidate-assessments',
  apiBase: '/recruitment/candidate-assessments',
  metaPath: '/recruitment/candidate-assessments/index-meta',
  labelKeys: ['assessment_name', 'id'],
  emptyIcon: ClipboardCheck,
  permissions: {
    create: 'create-candidate-assessments',
    edit: 'edit-candidate-assessments',
    delete: 'delete-candidate-assessments',
  },
  buildFields: (meta, t) => [
    {
      name: 'candidate_id',
      label: t('Candidate'),
      type: 'select',
      required: true,
      options: toOptions(meta.candidates as never),
    },
    { name: 'assessment_name', label: t('Assessment name'), required: true },
    { name: 'score', label: t('Score'), type: 'number' },
    { name: 'max_score', label: t('Max score'), type: 'number' },
    {
      name: 'pass_fail_status',
      label: t('Result'),
      type: 'select',
      options: statusOptions(meta.pass_fail_statuses as never),
    },
    { name: 'assessment_date', label: t('Date'), type: 'date' },
    { name: 'comments', label: t('Comments'), type: 'textarea' },
  ],
}

export const OFFERS_CONFIG: EntityConfig = {
  title: 'Offers',
  listKey: 'offers',
  apiBase: '/recruitment/offers',
  metaPath: '/recruitment/offers/index-meta',
  labelKeys: ['position', 'status', 'id'],
  emptyIcon: Gift,
  permissions: {
    create: 'create-offers',
    edit: 'edit-offers',
    delete: 'delete-offers',
  },
  buildFields: (meta, t) => [
    {
      name: 'candidate_id',
      label: t('Candidate'),
      type: 'select',
      required: true,
      options: toOptions(meta.candidates as never),
    },
    {
      name: 'job_id',
      label: t('Job posting'),
      type: 'select',
      options: toOptions(meta.job_postings as never),
    },
    { name: 'offer_date', label: t('Offer date'), type: 'date', required: true },
    { name: 'position', label: t('Position'), required: true },
    {
      name: 'department_id',
      label: t('Department'),
      type: 'select',
      options: toOptions(
        (meta.departments as Array<{ id: number; department_name: string }> | undefined)?.map((d) => ({
          id: d.id,
          name: d.department_name,
        })),
      ),
    },
    { name: 'salary', label: t('Salary'), type: 'number', required: true },
    { name: 'start_date', label: t('Start date'), type: 'date', required: true },
    { name: 'expiration_date', label: t('Expiration date'), type: 'date', required: true },
    {
      name: 'status',
      label: t('Status'),
      type: 'select',
      required: true,
      options: statusOptions(meta.statuses as never),
    },
  ],
}

export const CHECKLIST_ITEMS_CONFIG: EntityConfig = {
  title: 'Checklist items',
  listKey: 'checklist-items',
  apiBase: '/recruitment/checklist-items',
  metaPath: '/recruitment/checklist-items/index-meta',
  labelKeys: ['task_name', 'id'],
  emptyIcon: ClipboardCheck,
  permissions: {
    create: 'create-checklist-items',
    edit: 'edit-checklist-items',
    delete: 'delete-checklist-items',
  },
  buildFields: (meta, t) => [
    {
      name: 'checklist_id',
      label: t('Checklist'),
      type: 'select',
      required: true,
      options: toOptions(meta.checklists as never),
    },
    { name: 'task_name', label: t('Task name'), required: true },
    { name: 'description', label: t('Description'), type: 'textarea' },
    {
      name: 'category',
      label: t('Category'),
      type: 'select',
      required: true,
      options: statusOptions(meta.categories as never),
    },
    { name: 'due_day', label: t('Due day'), type: 'number', required: true },
    { name: 'assigned_to_role', label: t('Assigned role') },
    { name: 'is_required', label: t('Required'), type: 'select', options: yesNo(t) },
  ],
}

export const CANDIDATE_ONBOARDINGS_CONFIG: EntityConfig = {
  title: 'Candidate onboarding',
  listKey: 'candidate-onboardings',
  apiBase: '/recruitment/candidate-onboardings',
  metaPath: '/recruitment/candidate-onboardings/index-meta',
  labelKeys: ['status', 'id'],
  emptyIcon: UserCheck,
  permissions: {
    create: 'create-candidate-onboardings',
    edit: 'edit-candidate-onboardings',
    delete: 'delete-candidate-onboardings',
  },
  buildFields: (meta, t) => [
    {
      name: 'candidate_id',
      label: t('Candidate'),
      type: 'select',
      required: true,
      options: toOptions(meta.candidates as never),
    },
    {
      name: 'checklist_id',
      label: t('Checklist'),
      type: 'select',
      required: true,
      options: toOptions(meta.checklists as never),
    },
    { name: 'start_date', label: t('Start date'), type: 'date', required: true },
    {
      name: 'status',
      label: t('Status'),
      type: 'select',
      options: statusOptions(meta.statuses as never),
    },
  ],
}
