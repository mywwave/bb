import { useLocation, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { Button } from "@bb/shared-ui/button";
import { PluginIcon } from "@/components/plugin/PluginIcon";
import { PROJECT_LIST_ACTION_BUTTON_CLASS } from "@/components/sidebar/ProjectList";
import { TopLevelSidebarSection } from "@/components/sidebar/TopLevelSidebarSection";
import { pluginNavSidebarCollapsedAtom } from "@/components/sidebar/sidebarCollapsedAtoms";
import { getPluginPanelRoutePath } from "@/lib/route-paths";
import { usePluginSlots } from "@/lib/plugin-slots";
import { cn } from "@bb/shared-ui/lib/utils";
import type { PluginNavPanelSlot } from "@/lib/plugin-slots";
import { usePaneContentSplitDrag } from "@/components/sidebar/usePaneContentSplitDrag";
import { usePaneContentSplitIndicator } from "@/components/sidebar/paneContentSplitIndicator";
import { SplitPaneMiniMap } from "@/components/sidebar/SplitPaneMiniMap";

/**
 * A collapsible Plugins section for plugin `navPanel` slots (plugin design
 * §5.2). It shares the sidebar's main scroll region with threads, so an
 * arbitrary number of contributed pages never creates a second scroll area or
 * pushes the thread tree out of a fixed chrome region.
 */
export function PluginNavSidebarSection(props: {
  onNavigate?: () => void;
  splitEnabled?: boolean;
}) {
  const { navPanels } = usePluginSlots();
  const [isCollapsed, setIsCollapsed] = useAtom(pluginNavSidebarCollapsedAtom);
  if (navPanels.length === 0) return null;
  return (
    <div
      className="px-2 pt-1 group-data-[collapsible=icon]:hidden"
      data-testid="plugin-nav-sidebar-section"
    >
      <TopLevelSidebarSection
        label="Plugins"
        collapseControl={{
          isCollapsed,
          onToggleCollapsed: () => setIsCollapsed((current) => !current),
        }}
      >
        <PluginNavSidebarItemList {...props} navPanels={navPanels} />
      </TopLevelSidebarSection>
    </div>
  );
}

function PluginNavSidebarItemList({
  onNavigate,
  navPanels,
  splitEnabled = false,
}: {
  onNavigate?: () => void;
  navPanels: ReturnType<typeof usePluginSlots>["navPanels"];
  splitEnabled?: boolean;
}) {
  const location = useLocation();
  return (
    <div className="space-y-0.5" data-testid="plugin-nav-sidebar-items">
      {navPanels.map((panel) => {
        return (
          <PluginNavSidebarItem
            key={`${panel.pluginId}/${panel.id}`}
            panel={panel}
            pathname={location.pathname}
            onNavigate={onNavigate}
            splitEnabled={splitEnabled}
          />
        );
      })}
    </div>
  );
}

function PluginNavSidebarItem({
  panel,
  pathname,
  onNavigate,
  splitEnabled,
}: {
  panel: PluginNavPanelSlot;
  pathname: string;
  onNavigate?: () => void;
  splitEnabled: boolean;
}) {
  const navigate = useNavigate();
  const path = getPluginPanelRoutePath({
    pluginId: panel.pluginId,
    path: panel.path,
  });
  const isActive = pathname === path || pathname.startsWith(`${path}/`);
  const content = {
    kind: "plugin-panel",
    pluginId: panel.pluginId,
    panelPath: panel.path,
    subPath: "",
  } as const;
  const { onPointerDown, openInSplit } = usePaneContentSplitDrag({
    content,
    enabled: splitEnabled,
    label: panel.title,
  });
  const splitIndicator = usePaneContentSplitIndicator(content, splitEnabled);
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={cn(
        PROJECT_LIST_ACTION_BUTTON_CLASS,
        "w-full",
        isActive && "bg-sidebar-accent text-sidebar-foreground",
      )}
      aria-current={isActive ? "page" : undefined}
      onPointerDown={onPointerDown}
      onClick={(event) => {
        onNavigate?.();
        if (event.metaKey || event.ctrlKey) {
          openInSplit();
          return;
        }
        void navigate(path);
      }}
    >
      <PluginIcon pluginId={panel.pluginId} icon={panel.icon} />
      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
        <span className="min-w-0 truncate">{panel.title}</span>
        {splitIndicator.miniMap ? (
          <SplitPaneMiniMap
            slots={splitIndicator.miniMap}
            label={`${panel.title} — open in split`}
          />
        ) : null}
      </span>
    </Button>
  );
}
