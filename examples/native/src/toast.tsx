import type { ToastComponentProps } from "@lapp-studio/react-toast-engine";
import { Pressable, StyleSheet, Text, View } from "react-native";

const backgrounds = {
  success: "#15803d",
  error: "#b91c1c",
  info: "#1e40af",
};

export const Toast = ({ toast, actions }: ToastComponentProps) => (
  <View style={[styles.toast, { backgroundColor: backgrounds[toast.infoType] }]}>
    <View style={styles.content}>
      <Text style={styles.title}>{toast.title}</Text>
      {toast.description && <Text style={styles.text}>{toast.description}</Text>}
    </View>
    <Pressable accessibilityLabel="Close" hitSlop={8} onPress={actions.dismiss}>
      <Text style={styles.close}>×</Text>
    </Pressable>
  </View>
);

export const components = { success: Toast, error: Toast, info: Toast };

const styles = StyleSheet.create({
  toast: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  content: { flex: 1, gap: 4 },
  title: { color: "white", fontWeight: "600" },
  text: { color: "white", opacity: 0.9 },
  close: { color: "white", fontSize: 20, lineHeight: 20 },
});
