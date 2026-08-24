export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";
export type PinValue = number | string;

export interface PinInventory {
  digital?: PinValue[];
  analog?: PinValue[];
  [group: string]: PinValue[] | undefined;
}

export interface ComponentConflict {
  component: string;
  reason?: string;
}

export interface Component {
  id: string;
  name: string;
  domain: string;
  category: string;
  description: string;
  requires?: string[];
  optional?: string[];
  conflicts?: (string | ComponentConflict)[];
  warnings?: string[];
  difficulty?: DifficultyLevel;
  complexity?: number; // 1 to 5 scale
  estimatedLearningHours?: number;
  supports?: string[];
  outputs?: string[];
  tags?: string[];

  // Hardware/Mechatronics specific fields
  pins?: PinValue[] | PinInventory;
  pinsProvided?: PinValue[];
  pinsRequired?: PinValue[];
  recommendedPins?: Record<string, number | string>;
}
