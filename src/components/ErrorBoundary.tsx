import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * ErrorBoundary global — capture toute exception dans l'arbre React
 * et affiche un fallback discret au lieu de laisser disparaître la
 * carte ou la sidebar.
 *
 * Sans ce garde-fou, une erreur dans Sidebar (ex. selectedVillage avec
 * un champ inattendu) pouvait dérouler tout React et laisser un fond
 * uniforme à l'écran (l'effet 'écran bleu' rapporté par l'utilisateur).
 */
interface Props {
  children: ReactNode
}
interface State {
  err: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null }

  static getDerivedStateFromError(err: Error): State {
    return { err }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('ErrorBoundary :', err, info.componentStack)
  }

  reset = () => this.setState({ err: null })

  render() {
    if (this.state.err) {
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6">
          <div className="max-w-md w-full bg-slate-800 border border-white/10 rounded-2xl p-6 text-white shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Une erreur s'est produite</h2>
            <p className="text-sm text-white/70 mb-4">
              MINAI a rencontré un problème technique.
              Recharge la page ou clique sur Réessayer.
            </p>
            <pre className="text-[10px] bg-black/30 p-2 rounded overflow-auto max-h-32 mb-4 text-red-300">
              {String(this.state.err.message || this.state.err)}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={this.reset}
                className="flex-1 px-3 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-sm font-medium transition"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-medium transition"
              >
                Recharger
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
