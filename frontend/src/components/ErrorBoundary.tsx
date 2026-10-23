import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Si cambia, el error almacenado se limpia y el contenido se vuelve a renderizar. */
  resetKey?: string | number
}

interface ErrorBoundaryState {
  hasError: boolean
  prevResetKey?: string | number
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, prevResetKey: props.resetKey }
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey !== state.prevResetKey) {
      return { hasError: false, prevResetKey: props.resetKey }
    }
    return null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Error en panel:', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h2 className="error-boundary-title">Algo salió mal en este panel</h2>
          <p className="error-boundary-text">
            Ocurrió un error al mostrar esta sección. Puedes reintentar o cambiar de pestaña.
          </p>
          <button type="button" className="error-boundary-btn" onClick={this.handleReset}>
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
