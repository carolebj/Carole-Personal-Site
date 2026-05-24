import { CopyIcon, TranslateIcon } from "@sanity/icons";
import { Badge, Box, Button, Card, Flex, Grid, Label, Stack, Text, TextArea, TextInput } from "@sanity/ui";
import { PatchEvent, set, unset, type ObjectInputProps } from "sanity";
import { useMemo, useState } from "react";

type LocalizedValue = {
  fr?: string;
  en?: string;
};

type LocalizedInputProps = ObjectInputProps<LocalizedValue> & {
  variant: "string" | "text";
};

const translateEndpoint = () => {
  if (typeof window !== "undefined" && window.location.port === "3333") {
    return "http://127.0.0.1:5173/api/translate";
  }

  return "/api/translate";
};

const patchLanguage = (props: LocalizedInputProps, language: "fr" | "en", nextValue: string) => {
  props.onChange(PatchEvent.from(nextValue ? set(nextValue, [language]) : unset([language])));
};

const fieldTitles = {
  fr: "Français",
  en: "English",
};

export function LocalizedFieldInput(props: LocalizedInputProps) {
  const { value, variant } = props;
  const [isTranslating, setIsTranslating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const frValue = value?.fr ?? "";
  const enValue = value?.en ?? "";
  const canAssist = frValue.trim().length > 0;

  const wordCount = useMemo(() => {
    const count = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

    return {
      fr: count(frValue),
      en: count(enValue),
    };
  }, [enValue, frValue]);

  const Input = variant === "text" ? TextArea : TextInput;

  const copyFrench = () => {
    patchLanguage(props, "en", frValue);
    setMessage("Le texte français a été copié dans le champ anglais.");
  };

  const translateFrench = async () => {
    if (!canAssist) return;

    setIsTranslating(true);
    setMessage(null);

    try {
      const response = await fetch(translateEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: frValue,
          format: variant === "string" ? "short" : "plainText",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "La traduction automatique n'est pas disponible.");
      }

      patchLanguage(props, "en", payload.translation ?? "");
      setMessage("Traduction anglaise générée. Relisez-la avant publication.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La traduction automatique n'est pas disponible.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Card border radius={3} padding={4} tone="transparent">
      <Stack space={4}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Stack space={2}>
            <Text size={1} weight="semibold">
              {props.schemaType.title ?? "Contenu bilingue"}
            </Text>
            <Text muted size={1}>
              Rédigez en français, puis complétez ou générez la version anglaise avant publication.
            </Text>
          </Stack>

          <Flex gap={2} wrap="wrap">
            <Button
              disabled={!canAssist}
              fontSize={1}
              icon={CopyIcon}
              mode="ghost"
              onClick={copyFrench}
              text="Copier FR"
              tone="default"
            />
            <Button
              disabled={!canAssist || isTranslating}
              fontSize={1}
              icon={TranslateIcon}
              mode="default"
              onClick={translateFrench}
              text={isTranslating ? "Traduction..." : "Traduire"}
              tone="primary"
            />
          </Flex>
        </Flex>

        {message ? (
          <Card padding={3} radius={2} tone={message.includes("générée") || message.includes("copié") ? "positive" : "caution"}>
            <Text size={1}>{message}</Text>
          </Card>
        ) : null}

        <Grid columns={[1, 1, 2]} gap={4}>
          {(["fr", "en"] as const).map((language) => (
            <Card border padding={3} radius={2} tone={language === "fr" ? "primary" : "default"} key={language}>
              <Stack space={3}>
                <Flex align="center" justify="space-between">
                  <Label size={1}>{fieldTitles[language]}</Label>
                  <Badge mode="outline" tone={language === "fr" ? "primary" : "default"}>
                    {wordCount[language]} mots
                  </Badge>
                </Flex>

                <Box>
                  <Input
                    onChange={(event) => patchLanguage(props, language, event.currentTarget.value)}
                    placeholder={language === "fr" ? "Texte source" : "Version anglaise"}
                    rows={variant === "text" ? 5 : undefined}
                    value={language === "fr" ? frValue : enValue}
                  />
                </Box>
              </Stack>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Card>
  );
}

export function LocalizedStringInput(props: ObjectInputProps<LocalizedValue>) {
  return <LocalizedFieldInput {...props} variant="string" />;
}

export function LocalizedTextInput(props: ObjectInputProps<LocalizedValue>) {
  return <LocalizedFieldInput {...props} variant="text" />;
}
