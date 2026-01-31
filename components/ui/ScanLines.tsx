import { View } from 'react-native';
import { useMemo } from 'react';

interface ScanLinesProps {
  opacity?: number;
  spacing?: number;
}

export function ScanLines({ opacity = 0.03, spacing = 4 }: ScanLinesProps) {
  // Generate scan lines
  const lines = useMemo(() => {
    const count = Math.ceil(1000 / spacing); // Enough lines for any screen
    return Array.from({ length: count }, (_, i) => i);
  }, [spacing]);

  return (
    <View
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1000 }}
    >
      {lines.map((i) => (
        <View
          key={i}
          className="absolute left-0 right-0 h-px bg-white"
          style={{
            top: i * spacing,
            opacity,
          }}
        />
      ))}
    </View>
  );
}
