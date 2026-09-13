import { Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { SystemSetupLayout } from '@/features/shared/components/SystemSetupLayout'
import { SystemSetupEntityPage } from '@/features/shared/pages/SystemSetupEntityPage'
import { IndicatorsIndexPage } from '@/features/performance/pages/IndicatorsIndexPage'
import { ReviewCyclesIndexPage } from '@/features/performance/pages/ReviewCyclesIndexPage'
import { EmployeeGoalsIndexPage } from '@/features/performance/pages/EmployeeGoalsIndexPage'
import { EmployeeReviewsIndexPage } from '@/features/performance/pages/EmployeeReviewsIndexPage'
import { IndicatorFormPage } from '@/features/performance/pages/IndicatorFormPage'
import { IndicatorShowPage } from '@/features/performance/pages/IndicatorShowPage'
import { ReviewCycleFormPage } from '@/features/performance/pages/ReviewCycleFormPage'
import { ReviewCycleShowPage } from '@/features/performance/pages/ReviewCycleShowPage'
import { EmployeeGoalFormPage } from '@/features/performance/pages/EmployeeGoalFormPage'
import { EmployeeGoalShowPage } from '@/features/performance/pages/EmployeeGoalShowPage'
import { EmployeeReviewFormPage } from '@/features/performance/pages/EmployeeReviewFormPage'
import { EmployeeReviewShowPage } from '@/features/performance/pages/EmployeeReviewShowPage'
import { EmployeeReviewConductPage } from '@/features/performance/pages/EmployeeReviewConductPage'

export const performanceRoutes = (
  <>
    <Route path={paths.performance.indicators} element={<IndicatorsIndexPage />} />
    <Route path={paths.performance.indicatorCreate} element={<IndicatorFormPage />} />
    <Route path="/performance/indicators/:id/edit" element={<IndicatorFormPage />} />
    <Route path="/performance/indicators/:id" element={<IndicatorShowPage />} />
    <Route path={paths.performance.employeeGoals} element={<EmployeeGoalsIndexPage />} />
    <Route path={paths.performance.employeeGoalCreate} element={<EmployeeGoalFormPage />} />
    <Route path="/performance/employee-goals/:id/edit" element={<EmployeeGoalFormPage />} />
    <Route path="/performance/employee-goals/:id" element={<EmployeeGoalShowPage />} />
    <Route path={paths.performance.reviewCycles} element={<ReviewCyclesIndexPage />} />
    <Route path={paths.performance.reviewCycleCreate} element={<ReviewCycleFormPage />} />
    <Route path="/performance/review-cycles/:id/edit" element={<ReviewCycleFormPage />} />
    <Route path="/performance/review-cycles/:id" element={<ReviewCycleShowPage />} />
    <Route path={paths.performance.employeeReviews} element={<EmployeeReviewsIndexPage />} />
    <Route path={paths.performance.employeeReviewCreate} element={<EmployeeReviewFormPage />} />
    <Route path="/performance/employee-reviews/:id/edit" element={<EmployeeReviewFormPage />} />
    <Route path="/performance/employee-reviews/:id/conduct" element={<EmployeeReviewConductPage />} />
    <Route path="/performance/employee-reviews/:id" element={<EmployeeReviewShowPage />} />
    <Route
      path={paths.performance.systemSetup}
      element={
        <SystemSetupLayout moduleKey="performance">
          <SystemSetupEntityPage moduleKey="performance" itemKey="indicator-categories" />
        </SystemSetupLayout>
      }
    />
  </>
)
