"use client";

import React from "react";
import { useAnonymousUploadTransition } from "./useAnonymousUploadTransition";

/**
 * Provider component to handle anonymous upload transitions
 * This is used at the app level to make the transfer modal accessible throughout the app
 */
export const AnonymousUploadTransitionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Get the transfer modal from the hook
  const { transferModal } = useAnonymousUploadTransition();

  return (
    <>
      {transferModal}
      {children}
    </>
  );
};
