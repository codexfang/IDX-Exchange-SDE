import React from "react";

/**
 * Catches render errors below it and shows a recovery panel instead of a blank
 * page. React only supports this with a class component: getDerivedStateFromError
 * swaps in the fallback UI and componentDidCatch reports the error.
 *
 * The recovery links are plain anchors rather than react-router <Link>s on
 * purpose: this boundary also sits above the router, where router context does
 * not exist and a <Link> would throw again.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the stack visible in the console for debugging while the UI stays calm.
    console.error("[ErrorBoundary]", error, info && info.componentStack);

    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  handleReset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <main className="page">
        <div className="status status--error error-boundary" role="alert">
          <h1 className="error-title">Something went wrong</h1>
          <p className="status-message">
            This page hit an unexpected error, so it stopped rendering instead of
            showing a blank screen. Your saved favorites are still in this
            browser.
          </p>

          <div className="error-actions">
            <button type="button" className="error-retry" onClick={this.handleReset}>
              Try again
            </button>
            <a className="error-home" href="/">
              Back to listings
            </a>
          </div>

          {process.env.NODE_ENV === "development" && (
            <pre className="error-detail">
              {error && (error.stack || error.message || String(error))}
            </pre>
          )}
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
