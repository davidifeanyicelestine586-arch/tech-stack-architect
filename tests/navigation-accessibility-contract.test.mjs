import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const sidebar = read("app/(dashboard-layout)/layout/vertical/sidebar/app-sidebar.tsx");
const navCollapse = read("app/(dashboard-layout)/layout/vertical/sidebar/nav-collapse/index.tsx");
const header = read("app/(dashboard-layout)/layout/vertical/header/index.tsx");
const workspaceHeaderControls = read("app/(dashboard-layout)/layout/vertical/header/workspace-header-controls.tsx");
const dashboardClientShell = read("app/(dashboard-layout)/dashboard-client-shell.tsx");
const sidebarUi = read("components/ui/sidebar.tsx");
const workflow = read("lib/navigation/workflow.ts");
const workflowProgress = read("components/architect/workflow-progress.tsx");
const workspace = read("app/(dashboard-layout)/app/workspace-client.tsx");
const rootLayout = read("app/layout.tsx");
const projectDefinition = read("components/architect/project-definition-form.tsx");

 test("responsive navigation uses one NavCollapse tree", () => {
  assert.equal((sidebar.match(/<NavCollapse\b/g) ?? []).length, 1);
  assert.match(navCollapse, /!item\.mobilePrimary && "max-lg:hidden"/);
});

test("header controls are not exposed as a navigation landmark", () => {
  assert.doesNotMatch(header, /<nav\b/);
});

test("mobile navigation trigger exposes disclosure state and target", () => {
  assert.match(workspaceHeaderControls, /aria-expanded=\{isMobile \? openMobile : open\}/);
  assert.match(workspaceHeaderControls, /aria-controls="workspace-navigation"/);
  assert.match(sidebarUi, /id="workspace-navigation"/);
});

test("application shell provides a skip link and main content target", () => {
  assert.match(dashboardClientShell, /href="#main-content"/);
  assert.match(dashboardClientShell, /id="main-content"/);
});

test("workspace header controls are rendered inside the sidebar provider shell", () => {
  const providerStart = dashboardClientShell.indexOf("<SidebarProvider");
  const providerEnd = dashboardClientShell.indexOf("</SidebarProvider>");
  const headerSlot = dashboardClientShell.indexOf("{header}");
  assert.ok(providerStart >= 0 && providerStart < headerSlot && headerSlot < providerEnd);
  assert.match(header, /<WorkspaceHeaderControls\s*\/>/);
});

test("workflow stages have one canonical definition", () => {
  assert.match(workflow, /export const WORKFLOW_STEPS = \[/);
  assert.equal((workflow.match(/id: "/g) ?? []).length, 6);
  assert.match(workflowProgress, /WORKFLOW_STEPS\.map/);
  assert.doesNotMatch(workspace, /Step 4 · Build/);
  assert.doesNotMatch(workspace, />Step 4<\/Badge>/);
});

test("metadata uses one product identity and aligned social metadata", () => {
  assert.match(rootLayout, /SITE_NAME/);
  assert.match(rootLayout, /twitter:/);
  assert.match(rootLayout, /SITE_DESCRIPTION/);
  assert.doesNotMatch(rootLayout, /Ediccrew \| Tech Stack Architect/);
});

test("workflow step labels are derived in workflow-aware components", () => {
  assert.match(projectDefinition, /workflowStepNumber\("define"\)/);
  assert.match(read("components/architect/validation-panel.tsx"), /workflowStepLabel\("validate"\)/);
  assert.match(read("components/architect/blueprint-panel.tsx"), /workflowStepLabel\("blueprint"\)/);
});
