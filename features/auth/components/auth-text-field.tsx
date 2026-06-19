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

import { BrandColors } from "@/constants/theme";

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
          placeholderTextColor={BrandColors.gray400}
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
              color={BrandColors.gray500}
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
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.gray700,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BrandColors.stroke2,
    borderRadius: 12,
    backgroundColor: BrandColors.placeHolder,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.gray900,
  },
  eyeButton: { paddingHorizontal: 12 },
  inputError: { borderColor: BrandColors.primaryPink },
  error: { fontSize: 13, color: BrandColors.primaryPink },
});
