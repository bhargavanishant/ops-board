import type { ReactElement, SVGProps } from "react";

export type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const OverviewIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </svg>
);

export const IncidentsIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3.5 21 20H3z" />
    <path d="M12 9.5v4.5" />
    <path d="M12 17.2h.01" />
  </svg>
);

export const ServicesIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <path d="m12 3 8 4.5-8 4.5-8-4.5Z" />
    <path d="m4 12 8 4.5 8-4.5" />
    <path d="m4 16.5 8 4.5 8-4.5" />
  </svg>
);

export const SettingsIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.8v2.2M12 18v2.2M20.2 12H18M6 12H3.8M17.4 6.6l-1.55 1.55M8.15 15.85 6.6 17.4M17.4 17.4l-1.55-1.55M8.15 8.15 6.6 6.6" />
  </svg>
);

export const CollapseIcon: IconComponent = (props) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M9.5 4.5v15" />
    <path d="m13.5 10-2 2 2 2" />
  </svg>
);
