import { Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { SystemSetupLayout } from '@/features/shared/components/SystemSetupLayout'
import { TrainingsIndexPage } from '@/features/training/pages/TrainingsIndexPage'
import { TrainingFormPage } from '@/features/training/pages/TrainingFormPage'
import { TrainingShowPage } from '@/features/training/pages/TrainingShowPage'
import { TrainingTypesIndexPage } from '@/features/training/pages/TrainingTypesIndexPage'
import { TrainersIndexPage } from '@/features/training/pages/TrainersIndexPage'
import { TrainerFormPage } from '@/features/training/pages/TrainerFormPage'
import { TrainerShowPage } from '@/features/training/pages/TrainerShowPage'
import { SystemSetupEntityPage } from '@/features/shared/pages/SystemSetupEntityPage'

export const trainingRoutes = (
  <>
    <Route path={paths.training.index} element={<TrainingsIndexPage />} />
    <Route path={paths.training.create} element={<TrainingFormPage />} />
    <Route path="/training/trainings/:id/edit" element={<TrainingFormPage />} />
    <Route path="/training/trainings/:id" element={<TrainingShowPage />} />
    <Route path={paths.training.trainers} element={<TrainersIndexPage />} />
    <Route path={paths.training.trainerCreate} element={<TrainerFormPage />} />
    <Route path="/training/trainers/:id/edit" element={<TrainerFormPage />} />
    <Route path="/training/trainers/:id" element={<TrainerShowPage />} />
    <Route
      path={paths.training.trainingTypes}
      element={
        <SystemSetupLayout moduleKey="training">
          <TrainingTypesIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path={paths.training.systemSetup}
      element={
        <SystemSetupLayout moduleKey="training">
          <SystemSetupEntityPage moduleKey="training" itemKey="training-types" />
        </SystemSetupLayout>
      }
    />
  </>
)
