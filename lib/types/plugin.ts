import { Component } from "./component";
import { Recipe } from "./recipe";
import { RuleViolationItem } from "./validation";

export type CustomRuleFunction = (
  selectedIds: string[],
  components: Component[]
) => RuleViolationItem | RuleViolationItem[] | null | void;

export type CustomExporterFunction = (
  report: unknown
) => string | { content: string; mimeType: string };

export interface Plugin {
  name?: string;
  version?: string;
  components?: Component[];
  recipes?: Recipe[];
  rules?: CustomRuleFunction[];
  exporters?: Record<string, CustomExporterFunction>;
}
