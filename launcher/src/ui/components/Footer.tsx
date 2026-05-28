// launcher/src/ui/components/Footer.tsx
import { Box, Text } from "ink";

interface FooterProps {
  instructions: string;
}

export function Footer({ instructions }: FooterProps) {
  return (
    <Box marginTop={1} flexDirection="column">
      <Text dimColor>{instructions}</Text>
    </Box>
  );
}