import { Route } from 'react-router-dom'
import { SystemSetupLayout } from '@/features/shared/components/SystemSetupLayout'
import { RecruitmentCmsSettingsPage } from '@/features/recruitment/pages/RecruitmentCmsSettingsPage'
import { RecruitmentOfferLetterPage } from '@/features/recruitment/pages/RecruitmentOfferLetterPage'
import { RECRUITMENT_CMS_SECTIONS } from '@/features/recruitment/config/recruitment-cms-sections'

export const recruitmentCmsRoutes = (
  <>
    {RECRUITMENT_CMS_SECTIONS.map((section) => (
      <Route
        key={section.path}
        path={section.path}
        element={
          <SystemSetupLayout moduleKey="recruitment">
            <RecruitmentCmsSettingsPage section={section} />
          </SystemSetupLayout>
        }
      />
    ))}
    <Route
      path="/recruitment/offer-letter-template"
      element={
        <SystemSetupLayout moduleKey="recruitment">
          <RecruitmentOfferLetterPage />
        </SystemSetupLayout>
      }
    />
  </>
)
