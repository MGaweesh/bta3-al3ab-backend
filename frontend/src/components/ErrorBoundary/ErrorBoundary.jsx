import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          padding: '20px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: '#2a2a2a',
            padding: '30px',
            borderRadius: '10px',
            border: '1px solid #444'
          }}>
            <h1 style={{ color: '#ff4444', marginBottom: '20px' }}>
              ⚠️ خطأ في التطبيق
            </h1>
            <p style={{ marginBottom: '15px' }}>
              حدث خطأ أثناء تحميل التطبيق. يرجى فتح Console (F12) لرؤية التفاصيل.
            </p>
            {this.state.error && (
              <details style={{ marginTop: '20px' }}>
                <summary style={{ cursor: 'pointer', color: '#888', marginBottom: '10px' }}>
                  تفاصيل الخطأ
                </summary>
                <pre style={{
                  backgroundColor: '#1a1a1a',
                  padding: '15px',
                  borderRadius: '5px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#ff6666'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

