/**
 * Optional context wrapper for Create Pin navigation.
 * API calls happen later on CreatePinScreen via useCreatePinSubmit (upload + POST /memories).
 */
import React, { createContext, useCallback, useContext } from "react";

import { continueToCreatePinFlow } from "@/features/create-pin/continue-to-create-pin";
import type { AddyMemoryImage } from "@/types/addy-memory";
import type { PlaceSuggestion } from "@/types/api";

/** Immutable handoff from place selection into the Create Pin review screen. */
export type CreatePinPayload = Readonly<{
  images: readonly AddyMemoryImage[];
  selectedPlace: PlaceSuggestion;
  moodScore?: number;
  feeling?: string;
}>;

export type ContinueToCreatePin = (payload: CreatePinPayload) => void;

const CreatePinBridgeContext =
  createContext<ContinueToCreatePin>(continueToCreatePinFlow);

type CreatePinBridgeProviderProps = Readonly<{
  children: React.ReactNode;
  onContinueToCreatePin?: ContinueToCreatePin;
}>;

export function CreatePinBridgeProvider({
  children,
  onContinueToCreatePin,
}: CreatePinBridgeProviderProps) {
  const value = useCallback(
    (payload: CreatePinPayload) => {
      (onContinueToCreatePin ?? continueToCreatePinFlow)(payload);
    },
    [onContinueToCreatePin]
  );

  return (
    <CreatePinBridgeContext.Provider value={value}>
      {children}
    </CreatePinBridgeContext.Provider>
  );
}

export function useContinueToCreatePin(): ContinueToCreatePin {
  return useContext(CreatePinBridgeContext);
}
