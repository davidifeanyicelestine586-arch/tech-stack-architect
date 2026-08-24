import type { PinInventory, PinValue } from "@/lib/types/component";

export interface PinGroup {
  label: string;
  values: PinValue[];
}

export function getPinGroups(
  pins?: PinValue[] | PinInventory
): PinGroup[] {
  if (!pins) return [];

  if (Array.isArray(pins)) {
    return pins.length > 0 ? [{ label: "Pins", values: pins }] : [];
  }

  return Object.entries(pins)
    .filter(([, values]) => Array.isArray(values) && values.length > 0)
    .map(([label, values]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      values: values as PinValue[],
    }));
}

export function formatPinGroups(pins?: PinValue[] | PinInventory): string {
  return getPinGroups(pins)
    .map(({ label, values }) => `${label}: ${values.join(", ")}`)
    .join(" · ");
}
