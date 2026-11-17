import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Playground } from "./playground";
import { animated } from "./scenarios/animated";
import { reanimated } from "./scenarios/reanimated";
import { zustand } from "./scenarios/zustand";

const scenarios = [animated, reanimated, zustand];

const Screen = () => {
  const dark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const [currentId, setCurrentId] = useState(scenarios[0].id);
  const current = scenarios.find((scenario) => scenario.id === currentId) ?? scenarios[0];
  const { renderer, utilities } = current.client;

  return (
    <renderer.Provider key={current.id}>
      <ScrollView
        style={[styles.screen, dark && styles.screenDark]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 },
        ]}
      >
        <Text style={[styles.title, dark && styles.titleDark]}>React Toast Engine</Text>
        <View style={styles.tabs}>
          {scenarios.map((scenario) => (
            <Button
              key={scenario.id}
              label={scenario.label}
              selected={scenario === current}
              onPress={() => setCurrentId(scenario.id)}
            />
          ))}
        </View>
        <Playground utilities={utilities} />
        {current.Inspector && <current.Inspector />}
      </ScrollView>
    </renderer.Provider>
  );
};

export const App = () => (
  <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Screen />
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  screenDark: { backgroundColor: "#0b1120" },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: "#0f172a" },
  titleDark: { color: "#e2e8f0" },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#cbd5e1",
  },
});
