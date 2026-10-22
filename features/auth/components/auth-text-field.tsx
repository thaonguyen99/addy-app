import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
} from "@/constants/theme";

type AuthTextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthTextField({
  label,
  error,
  style,
  secureTextEntry,
  ...props
}: AuthTextFieldProps) {
  const [hidden, setHidden] = useState(true);
  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          placeholderTextColor={AddyColors.inkMuted}
          style={[styles.input, style]}
          autoCapitalize="none"
          secureTextEntry={isPassword ? hidden : false}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden((prev) => !prev)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={AddyColors.inkMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 14,
    color: AddyColors.inkMuted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    borderRadius: AddyRadius.input,
    backgroundColor: AddyColors.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: AddyFonts.body,
    fontSize: 15,
    color: AddyColors.ink,
  },
  eyeButton: { paddingHorizontal: 12, minHeight: 44, justifyContent: "center" },
  inputError: { borderColor: AddyColors.danger },
  error: { fontFamily: AddyFonts.body, fontSize: 13, color: AddyColors.danger },
});
