import { TranslateIcon } from "@sanity/icons";
import { Box, Card, Flex, Stack, Text } from "@sanity/ui";
import type { ObjectInputProps } from "sanity";

export function LocalizedBlockInput(props: ObjectInputProps) {
  return (
    <Stack space={4}>
      <Card border padding={4} radius={3} tone="primary">
        <Flex align="flex-start" gap={3}>
          <Box paddingTop={1}>
            <TranslateIcon />
          </Box>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Contenu riche bilingue
            </Text>
            <Text muted size={1}>
              Construisez l'article complet en français, puis reprenez la même structure en anglais. Pour les textes courts et descriptions,
              utilisez le bouton Traduire des champs bilingues.
            </Text>
          </Stack>
        </Flex>
      </Card>

      {props.renderDefault(props)}
    </Stack>
  );
}
