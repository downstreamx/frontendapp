import { RecruitmentCrudIndexPage } from '../components/RecruitmentCrudIndexPage'
import {
  CANDIDATE_ASSESSMENTS_CONFIG,
  CANDIDATE_ONBOARDINGS_CONFIG,
  CHECKLIST_ITEMS_CONFIG,
  CUSTOM_QUESTIONS_CONFIG,
  INTERVIEW_FEEDBACKS_CONFIG,
  INTERVIEW_ROUNDS_CONFIG,
  JOB_LOCATIONS_CONFIG,
} from '../config/recruitment-entity-configs'

export function JobLocationsIndexPage() {
  return <RecruitmentCrudIndexPage config={JOB_LOCATIONS_CONFIG} />
}

export function CustomQuestionsIndexPage() {
  return <RecruitmentCrudIndexPage config={CUSTOM_QUESTIONS_CONFIG} />
}

export function InterviewRoundsIndexPage() {
  return <RecruitmentCrudIndexPage config={INTERVIEW_ROUNDS_CONFIG} />
}

export function InterviewFeedbacksIndexPage() {
  return <RecruitmentCrudIndexPage config={INTERVIEW_FEEDBACKS_CONFIG} />
}

export function CandidateAssessmentsIndexPage() {
  return <RecruitmentCrudIndexPage config={CANDIDATE_ASSESSMENTS_CONFIG} />
}

export function ChecklistItemsIndexPage() {
  return <RecruitmentCrudIndexPage config={CHECKLIST_ITEMS_CONFIG} />
}

export function CandidateOnboardingsIndexPage() {
  return <RecruitmentCrudIndexPage config={CANDIDATE_ONBOARDINGS_CONFIG} />
}
