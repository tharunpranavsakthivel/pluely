import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AppIconToggleProps {
  className?: string;
}

export const AppIconToggle = ({ className }: AppIconToggleProps) => {
  const { customizable, toggleAppIconVisibility } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    // When switch is ON (checked=true), we want to HIDE the icon (isVisible=false)
    await toggleAppIconVisibility(!checked);
  };

  return (
    <div id="app-icon" className={`space-y-2 ${className}`}>
      <Header
        title="App Icon Stealth Mode"
        description="Control dock/taskbar icon visibility when window is hidden for maximum discretion"
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              Hide Icon from Dock/Taskbar
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              When enabled, app icon will be hidden from dock/taskbar
            </p>
          </div>
        </div>
        <Switch
          checked={!customizable.appIcon.isVisible}
          onCheckedChange={handleSwitchChange}
          aria-label="Toggle app icon visibility"
        />
      </div>
    </div>
  );
};
