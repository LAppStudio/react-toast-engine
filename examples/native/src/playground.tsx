import type {
  createToastsClient,
  DefaultToastType,
  ToastsPool,
} from "@lapp-studio/react-toast-engine";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

type Client = ReturnType<typeof createToastsClient<DefaultToastType>>;

export type Scenario = {
  id: string;
  label: string;
  client: Client;
  Inspector?: ComponentType;
};

type ButtonProps = { label: string; selected?: boolean; onPress: () => void };

export const Button = ({ label, selected, onPress }: ButtonProps) => {
  const dark = useColorScheme() === "dark";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        dark && styles.buttonDark,
        selected && styles.buttonSelected,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, dark && styles.textDark]}>{label}</Text>
    </Pressable>
  );
};

export const Playground = ({ utilities }: { utilities: Client["utilities"] }) => {
  const { stack, update, pop, clear } = utilities.helpers;

  const upload = () => {
    const id = stack({ infoType: "info", title: "Uploading…", durationInMs: Infinity });
    setTimeout(() => {
      update(id, {
        infoType: "success",
        title: "Uploaded",
        description: "report.pdf is ready.",
        durationInMs: 3000,
      });
    }, 2000);
  };

  return (
    <View style={styles.playground}>
      <Button
        label="Success"
        onPress={() =>
          stack({ infoType: "success", title: "Saved!", description: "Profile updated." })
        }
      />
      <Button
        label="Error"
        onPress={() =>
          stack({
            infoType: "error",
            title: "Connection error",
            description: "Check your network and try again.",
          })
        }
      />
      <Button
        label="Info (pressable)"
        onPress={() =>
          stack({
            infoType: "info",
            title: "New message",
            actions: { onPress: () => stack({ infoType: "info", title: "Opening inbox…" }) },
          })
        }
      />
      <Button
        label="Persistent"
        onPress={() =>
          stack({ infoType: "info", title: "Stays until dismissed", durationInMs: Infinity })
        }
      />
      <Button label="Loading → done" onPress={upload} />
      <Button label="Close oldest" onPress={pop} />
      <Button label="Clear all" onPress={clear} />
    </View>
  );
};

export const PoolInspector = ({ label, pool }: { label: string; pool: ToastsPool }) => {
  const dark = useColorScheme() === "dark";
  return (
    <View style={[styles.inspector, dark && styles.buttonDark]}>
      <Text style={[styles.inspectorLabel, dark && styles.textDark]}>{label}</Text>
      {pool.length === 0 ? (
        <Text style={[styles.muted, dark && styles.textDark]}>Empty.</Text>
      ) : (
        pool.map((toast) => (
          <Text key={toast.id} style={dark && styles.textDark}>
            {toast.infoType} · {toast.title} ({toast.status})
          </Text>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  playground: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  buttonDark: { borderColor: "#334155", backgroundColor: "#111827" },
  buttonSelected: { borderColor: "#2563eb", borderWidth: 1 },
  buttonPressed: { opacity: 0.6 },
  buttonText: { color: "#0f172a" },
  textDark: { color: "#e2e8f0" },
  inspector: {
    marginTop: 24,
    padding: 16,
    gap: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  inspectorLabel: { fontFamily: "Menlo", fontSize: 12, marginBottom: 4 },
  muted: { color: "#475569" },
});
