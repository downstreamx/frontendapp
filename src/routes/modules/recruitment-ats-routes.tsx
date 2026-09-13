import { Route } from 'react-router-dom'
import {
  CandidateAssessmentsIndexPage,
  CandidateOnboardingsIndexPage,
  ChecklistItemsIndexPage,
  CustomQuestionsIndexPage,
  InterviewFeedbacksIndexPage,
  InterviewRoundsIndexPage,
  JobLocationsIndexPage,
} from '@/features/recruitment/pages/recruitment-ats-pages'
import { InterviewsIndexPage } from '@/features/recruitment/pages/InterviewsIndexPage'
import { InterviewFormPage } from '@/features/recruitment/pages/InterviewFormPage'
import { InterviewShowPage } from '@/features/recruitment/pages/InterviewShowPage'
import { OffersIndexPage } from '@/features/recruitment/pages/OffersIndexPage'
import { OfferFormPage } from '@/features/recruitment/pages/OfferFormPage'
import { OfferShowPage } from '@/features/recruitment/pages/OfferShowPage'

export const recruitmentAtsRoutes = (
  <>
    <Route path="/recruitment/job-locations" element={<JobLocationsIndexPage />} />
    <Route path="/recruitment/custom-questions" element={<CustomQuestionsIndexPage />} />
    <Route path="/recruitment/interview-rounds" element={<InterviewRoundsIndexPage />} />
    <Route path="/recruitment/interviews" element={<InterviewsIndexPage />} />
    <Route path="/recruitment/interviews/create" element={<InterviewFormPage />} />
    <Route path="/recruitment/interviews/:id/edit" element={<InterviewFormPage />} />
    <Route path="/recruitment/interviews/:id" element={<InterviewShowPage />} />
    <Route path="/recruitment/interview-feedbacks" element={<InterviewFeedbacksIndexPage />} />
    <Route path="/recruitment/candidate-assessments" element={<CandidateAssessmentsIndexPage />} />
    <Route path="/recruitment/offers" element={<OffersIndexPage />} />
    <Route path="/recruitment/offers/create" element={<OfferFormPage />} />
    <Route path="/recruitment/offers/:id/edit" element={<OfferFormPage />} />
    <Route path="/recruitment/offers/:id" element={<OfferShowPage />} />
    <Route path="/recruitment/checklist-items" element={<ChecklistItemsIndexPage />} />
    <Route path="/recruitment/candidate-onboardings" element={<CandidateOnboardingsIndexPage />} />
  </>
)
