import { Route } from 'react-router-dom'
import { budgetPlannerEntities } from '@/lib/entity-registry'
import { EntityCrudIndexPage } from '@/features/shared/pages/EntityCrudIndexPage'
import { BudgetPeriodsIndexPage } from '@/features/budget-planner/pages/BudgetPeriodsIndexPage'
import { BudgetPeriodFormPage } from '@/features/budget-planner/pages/BudgetPeriodFormPage'
import { BudgetsIndexPage } from '@/features/budget-planner/pages/BudgetsIndexPage'
import { BudgetFormPage } from '@/features/budget-planner/pages/BudgetFormPage'
import { BudgetShowPage } from '@/features/budget-planner/pages/BudgetShowPage'
import { ModuleIndexPage } from '@/features/shared/pages/ModuleIndexPage'
import { paths } from '@/lib/paths'
import { DoubleEntryReportsPage } from '@/features/double-entry/pages/DoubleEntryReportsPage'
import { ReportsAnalyticsLandingPage } from '@/features/reports/pages/ReportsAnalyticsLandingPage'
import { LedgerSummaryReportPage } from '@/features/double-entry/pages/LedgerSummaryReportPage'
import { LedgerSummaryPrintPage } from '@/features/double-entry/pages/LedgerSummaryPrintPage'
import { TrialBalanceReportPage } from '@/features/double-entry/pages/TrialBalanceReportPage'
import { TrialBalancePrintPage } from '@/features/double-entry/pages/TrialBalancePrintPage'
import { ProfitLossReportPage } from '@/features/double-entry/pages/ProfitLossReportPage'
import { ProfitLossPrintPage } from '@/features/double-entry/pages/ProfitLossPrintPage'
import { BalanceSheetsIndexPage } from '@/features/double-entry/pages/BalanceSheetsIndexPage'
import { BalanceSheetShowPage } from '@/features/double-entry/pages/BalanceSheetShowPage'
import { BalanceSheetPrintPage } from '@/features/double-entry/pages/BalanceSheetPrintPage'
import { BalanceSheetComparisonsPage } from '@/features/double-entry/pages/BalanceSheetComparisonsPage'
import { BalanceSheetComparisonShowPage } from '@/features/double-entry/pages/BalanceSheetComparisonShowPage'
import { BalanceSheetComparisonPrintPage } from '@/features/double-entry/pages/BalanceSheetComparisonPrintPage'
import { OtherReportPage } from '@/features/double-entry/pages/OtherReportPage'
import { OtherReportPrintPage } from '@/features/double-entry/pages/OtherReportPrintPage'
import { OperationalReportPage } from '@/features/reports/pages/OperationalReportPage'

export const reportsRoutes = (
  <>
    <Route path={paths.reports.analytics} element={<ReportsAnalyticsLandingPage />} />
    <Route path="/reports/operational/:reportKey" element={<OperationalReportPage />} />
    <Route path={paths.doubleEntry.reports} element={<DoubleEntryReportsPage />} />
    <Route path="/double-entry/reports/:reportKey/print" element={<OtherReportPrintPage />} />
    <Route path="/double-entry/reports/:reportKey" element={<OtherReportPage />} />
    <Route path={paths.doubleEntry.ledgerSummary} element={<LedgerSummaryReportPage />} />
    <Route path={paths.doubleEntry.ledgerSummaryPrint} element={<LedgerSummaryPrintPage />} />
    <Route path={paths.doubleEntry.trialBalance} element={<TrialBalanceReportPage />} />
    <Route path={paths.doubleEntry.trialBalancePrint} element={<TrialBalancePrintPage />} />
    <Route path={paths.doubleEntry.profitLoss} element={<ProfitLossReportPage />} />
    <Route path={paths.doubleEntry.profitLossPrint} element={<ProfitLossPrintPage />} />
    <Route path={paths.doubleEntry.balanceSheetComparisons} element={<BalanceSheetComparisonsPage />} />
    <Route
      path="/double-entry/balance-sheets/comparisons/:id/print"
      element={<BalanceSheetComparisonPrintPage />}
    />
    <Route
      path="/double-entry/balance-sheets/comparisons/:id"
      element={<BalanceSheetComparisonShowPage />}
    />
    <Route path="/double-entry/balance-sheets/:id/print" element={<BalanceSheetPrintPage />} />
    <Route path="/double-entry/balance-sheets/:id" element={<BalanceSheetShowPage />} />
    <Route path={paths.doubleEntry.balanceSheets} element={<BalanceSheetsIndexPage />} />
    <Route path="/double-entry/*" element={<ModuleIndexPage />} />
    <Route path={paths.budgetPlanner.periods} element={<BudgetPeriodsIndexPage />} />
    <Route path={paths.budgetPlanner.periodCreate} element={<BudgetPeriodFormPage />} />
    <Route path="/budget-planner/budget-periods/:id/edit" element={<BudgetPeriodFormPage />} />
    <Route path={paths.budgetPlanner.budgets} element={<BudgetsIndexPage />} />
    <Route path={paths.budgetPlanner.budgetCreate} element={<BudgetFormPage />} />
    <Route path="/budget-planner/budgets/:id/edit" element={<BudgetFormPage />} />
    <Route path="/budget-planner/budgets/:id" element={<BudgetShowPage />} />
    {budgetPlannerEntities.map((entity) => (
      <Route
        key={entity.listPath}
        path={entity.listPath}
        element={<EntityCrudIndexPage {...entity} />}
      />
    ))}
    <Route path="/budget-planner/*" element={<ModuleIndexPage />} />
  </>
)
