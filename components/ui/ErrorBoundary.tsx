import React, { Component, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#0A0A0A',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              fontFamily: 'SpaceMono_700Bold',
              color: '#E5E5E5',
              fontSize: 18,
              letterSpacing: 2,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {this.props.fallbackTitle || 'QUALCOSA È ANDATO STORTO'}
          </Text>

          <Text
            style={{
              fontFamily: 'SpaceMono_400Regular',
              color: '#666',
              fontSize: 12,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {this.props.fallbackMessage ||
              "Si è verificato un errore imprevisto. Prova a riprovare."}
          </Text>

          {__DEV__ && this.state.error && (
            <View
              style={{
                borderWidth: 1,
                borderColor: '#2A2A2A',
                padding: 12,
                marginBottom: 24,
                width: '100%',
              }}
            >
              <Text
                style={{
                  fontFamily: 'SpaceMono_400Regular',
                  color: '#666',
                  fontSize: 10,
                }}
              >
                {this.state.error.message}
              </Text>
            </View>
          )}

          <Pressable
            onPress={this.handleReset}
            style={{
              borderWidth: 1,
              borderColor: '#4ADE80',
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontFamily: 'SpaceMono_700Bold',
                color: '#4ADE80',
                fontSize: 14,
                letterSpacing: 2,
              }}
            >
              RIPROVA
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
