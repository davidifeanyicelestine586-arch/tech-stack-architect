import { Button } from "@/components/ui/button";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const LightDark = () => {
  const { theme: activeMode, setTheme: setActiveMode } = useTheme();
  const isMounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const toggleTheme = async () => {
    const toggleMode = () => {
      setActiveMode(activeMode === "light" ? "dark" : "light");
    };

    if (!(document as any).startViewTransition) {
      toggleMode();
      return;
    }

    const transition = (document as any).startViewTransition(() => {
      toggleMode();
    });

    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: ["inset(0 0 100% 0)", "inset(0)"],
      },
      {
        duration: 800,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      {activeMode === "light" ? (
        <Button
          variant="ghost"
          className="h-11 w-11 rounded-full cursor-pointer hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={toggleTheme}
          aria-label="Switch to dark theme"
          title="Switch to dark theme"
        >
          <Moon className="size-5" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="h-11 w-11 rounded-full cursor-pointer hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={toggleTheme}
          aria-label="Switch to light theme"
          title="Switch to light theme"
        >
          <Sun className="size-5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};

export default LightDark;
