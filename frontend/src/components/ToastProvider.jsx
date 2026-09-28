import { createContext, useCallback, useContext, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider.')
    return context
}

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const dismiss = useCallback((id) => setToasts((items) => items.filter((toast) => toast.id !== id)), [])
    const notify = useCallback((message, type = 'success') => {
        const id = `${Date.now()}-${Math.random()}`
        setToasts((items) => [...items, { id, message, type }])
        window.setTimeout(() => dismiss(id), 4200)
    }, [dismiss])

    return (
        <ToastContext.Provider value={notify}>
            {children}
            <div className="toast-stack" aria-live="polite" aria-relevant="additions removals">
                {toasts.map(({ id, message, type }) => {
                    const Icon = ICONS[type] || ICONS.info
                    return <div className={`toast toast--${type}`} key={id} role={type === 'error' ? 'alert' : 'status'}>
                        <Icon size={17} aria-hidden="true" /><span>{message}</span>
                        <button className="icon-button" type="button" onClick={() => dismiss(id)} aria-label="Dismiss notification"><X size={15} /></button>
                    </div>
                })}
            </div>
        </ToastContext.Provider>
    )
}