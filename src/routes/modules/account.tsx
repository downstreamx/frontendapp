import { Route, Navigate } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { accountEntities } from '@/lib/entity-registry'
import { EntityCrudIndexPage } from '@/features/shared/pages/EntityCrudIndexPage'
import { ModuleIndexPage } from '@/features/shared/pages/ModuleIndexPage'
import { CreditNotesIndexPage } from '@/features/account/pages/CreditNotesIndexPage'
import { CreditNoteViewPage } from '@/features/account/pages/CreditNoteViewPage'
import { DebitNotesIndexPage } from '@/features/account/pages/DebitNotesIndexPage'
import { DebitNoteViewPage } from '@/features/account/pages/DebitNoteViewPage'
import { CustomerPaymentsIndexPage } from '@/features/account/pages/CustomerPaymentsIndexPage'
import { CustomerPaymentCreatePage } from '@/features/account/pages/CustomerPaymentCreatePage'
import { CustomerPaymentViewPage } from '@/features/account/pages/CustomerPaymentViewPage'
import { SupplierPaymentsIndexPage } from '@/features/account/pages/SupplierPaymentsIndexPage'
import { SupplierPaymentViewPage } from '@/features/account/pages/SupplierPaymentViewPage'
import { ChartOfAccountsIndexPage } from '@/features/account/pages/ChartOfAccountsIndexPage'
import { BankAccountsIndexPage } from '@/features/account/pages/BankAccountsIndexPage'
import { RevenuesIndexPage } from '@/features/account/pages/RevenuesIndexPage'
import { ExpensesIndexPage } from '@/features/account/pages/ExpensesIndexPage'
import { JournalEntriesIndexPage } from '@/features/account/pages/JournalEntriesIndexPage'
import { JournalEntryFormPage } from '@/features/account/pages/JournalEntryFormPage'
import { JournalEntryShowPage } from '@/features/account/pages/JournalEntryShowPage'
import { AccountReportsPage } from '@/features/account/pages/AccountReportsPage'
import { BankTransactionsIndexPage } from '@/features/account/pages/BankTransactionsIndexPage'
import { BankTransfersIndexPage } from '@/features/account/pages/BankTransfersIndexPage'
import { SystemSetupLayout } from '@/features/shared/components/SystemSetupLayout'
import { AccountTypesIndexPage } from '@/features/account/pages/AccountTypesIndexPage'
import { RevenueCategoriesIndexPage } from '@/features/account/pages/RevenueCategoriesIndexPage'
import { ExpenseCategoriesIndexPage } from '@/features/account/pages/ExpenseCategoriesIndexPage'
import { AccountDashboardPage } from '@/features/dashboard/pages/AccountDashboardPage'
import { CustomersIndexPage } from '@/features/account/pages/CustomersIndexPage'
import { CustomerEditPage } from '@/features/account/pages/CustomerEditPage'
import { CustomerViewPage } from '@/features/account/pages/CustomerViewPage'
import { CustomerCreditBalancePage } from '@/features/account/pages/CustomerCreditBalancePage'
import { CustomerCreditBalancePrintPage } from '@/features/account/pages/CustomerCreditBalancePrintPage'
import { AccountReportPage } from '@/features/account/pages/AccountReportPage'
import { AccountReportPrintPage } from '@/features/account/pages/AccountReportPrintPage'
import { SuppliersIndexPage } from '@/features/account/pages/SuppliersIndexPage'
import { SupplierEditPage } from '@/features/account/pages/SupplierEditPage'
import { SupplierViewPage } from '@/features/account/pages/SupplierViewPage'
import { CustomerLimitsBalancesPage } from '@/features/account/pages/CustomerLimitsBalancesPage'
import { SupplierLimitsBalancesPage } from '@/features/account/pages/SupplierLimitsBalancesPage'

export const accountRoutes = (
  <>
    <Route path="/account" element={<AccountDashboardPage />} />
    <Route path={paths.account.customers} element={<CustomersIndexPage />} />
    <Route path={paths.account.customerCreate} element={<Navigate to={paths.account.customers} replace />} />
    <Route path="/account/customers/:id/edit" element={<CustomerEditPage />} />
    <Route path="/account/customers/:id" element={<CustomerViewPage />} />
    <Route path={paths.account.creditBalancePrint} element={<CustomerCreditBalancePrintPage />} />
    <Route path={paths.account.creditBalance} element={<CustomerCreditBalancePage />} />
    <Route path={paths.account.customerLimitsBalances} element={<CustomerLimitsBalancesPage />} />
    <Route path="/account/reports/:reportKey/print" element={<AccountReportPrintPage />} />
    <Route path="/account/reports/:reportKey" element={<AccountReportPage />} />
    <Route path={paths.account.suppliers} element={<SuppliersIndexPage />} />
    <Route path={paths.account.supplierLimitsBalances} element={<SupplierLimitsBalancesPage />} />
    <Route path={paths.account.supplierCreate} element={<Navigate to={paths.account.suppliers} replace />} />
    <Route path="/account/suppliers/:id/edit" element={<SupplierEditPage />} />
    <Route path="/account/suppliers/:id" element={<SupplierViewPage />} />
    <Route
      path="/account/account-types"
      element={
        <SystemSetupLayout moduleKey="accounting">
          <AccountTypesIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/account/revenue-categories"
      element={
        <SystemSetupLayout moduleKey="accounting">
          <RevenueCategoriesIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/account/expense-categories"
      element={
        <SystemSetupLayout moduleKey="accounting">
          <ExpenseCategoriesIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route path={paths.account.customerPayments.index} element={<CustomerPaymentsIndexPage />} />
    <Route path={paths.account.customerPayments.create} element={<CustomerPaymentCreatePage />} />
    <Route path="/account/customer-payments/:id" element={<CustomerPaymentViewPage />} />
    <Route path={paths.account.supplierPayments.index} element={<SupplierPaymentsIndexPage />} />
    <Route
      path={paths.account.supplierPayments.create}
      element={<Navigate to={`${paths.account.supplierPayments.index}?create=1`} replace />}
    />
    <Route path="/account/supplier-payments/:id" element={<SupplierPaymentViewPage />} />
    <Route path={paths.account.creditNotes.index} element={<CreditNotesIndexPage />} />
    <Route path="/account/credit-notes/:id" element={<CreditNoteViewPage />} />
    <Route path={paths.account.debitNotes.index} element={<DebitNotesIndexPage />} />
    <Route path="/account/debit-notes/:id" element={<DebitNoteViewPage />} />
    <Route path="/account/chart-of-accounts" element={<ChartOfAccountsIndexPage />} />
    <Route path="/account/bank-accounts" element={<BankAccountsIndexPage />} />
    <Route path="/account/revenues" element={<RevenuesIndexPage />} />
    <Route path="/account/expenses" element={<ExpensesIndexPage />} />
    <Route path={paths.account.journalEntries} element={<JournalEntriesIndexPage />} />
    <Route path={paths.account.journalEntryCreate} element={<JournalEntryFormPage />} />
    <Route path="/account/journal-entries/:id" element={<JournalEntryShowPage />} />
    <Route path="/account/bank-transactions" element={<BankTransactionsIndexPage />} />
    <Route path="/account/bank-transfers" element={<BankTransfersIndexPage />} />
    {accountEntities
      .filter((e) =>
        ![
          'credit-notes',
          'debit-notes',
          'chart-of-accounts',
          'bank-accounts',
          'bank-transactions',
          'bank-transfers',
          'revenues',
          'expenses',
          'journal-entries',
          'account-types',
          'customers',
          'suppliers',
        ].includes(e.slug),
      )
      .map((entity) => (
      <Route
        key={entity.listPath}
        path={entity.listPath}
        element={<EntityCrudIndexPage {...entity} />}
      />
    ))}
    <Route path={paths.account.reports} element={<AccountReportsPage />} />
    <Route path="/account/*" element={<ModuleIndexPage />} />
  </>
)
