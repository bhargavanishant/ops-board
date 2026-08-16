import {
  IncidentsIcon,
  OverviewIcon,
  ServicesIcon,
  SettingsIcon,
  type IconComponent,
} from "./icons";

export interface NavItem {
  label: string;
  to: string;
  icon: IconComponent;
}

export const navItems: NavItem[] = [
  { label: "Overview", to: "/overview", icon: OverviewIcon },
  { label: "Incidents", to: "/incidents", icon: IncidentsIcon },
  { label: "Services", to: "/services", icon: ServicesIcon },
  { label: "Settings", to: "/settings", icon: SettingsIcon },
];
