export type FormPresentation = 'page' | 'dialog'

export type FormDialogCallbacks = {
  presentation?: FormPresentation
  onSuccess?: (saved: { id: number }) => void
  onCancel?: () => void
}

export type EntityViewCallbacks = {
  presentation?: FormPresentation
  entityId?: string
  onClose?: () => void
}
