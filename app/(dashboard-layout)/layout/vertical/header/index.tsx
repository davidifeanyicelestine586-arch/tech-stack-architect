import { ProductShellHeader } from "@/components/navigation/product-shell-header";
import { WorkspaceHeaderControls } from "./workspace-header-controls";

const Header = () => (
  <ProductShellHeader workspaceControls={<WorkspaceHeaderControls />} />
);

export default Header;
