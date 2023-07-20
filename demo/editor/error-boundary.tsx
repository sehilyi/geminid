import * as React from 'react';

interface State {
    hasError: boolean;
}

interface Props {}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<Props>, State> {
    state: State = { hasError: false };

    componentDidCatch() {
        // Display fallback UI
        this.setState({ hasError: true });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ margin: '10px 40px' }}>
                    <h3>Something Went Wrong...</h3>
                    <h4>• Refresh the webpage to restart the editor.</h4>
                    <h4>
                        • Please help us fix this issue by submitting a{' '}
                        <a
                            href="https://github.com/gosling-lang/gosling.js/issues/new"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub issue
                        </a>{' '}
                        with the spec on the left side.
                    </h4>
                </div>
            );
        }
        return <>{this.props.children}</>;
    }
}
