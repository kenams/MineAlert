declare module "react-simple-maps" {
  import type {
    ComponentType,
    ReactNode,
    SVGProps,
  } from "react";

  export const ComposableMap: ComponentType<
    SVGProps<SVGSVGElement> & {
      projectionConfig?: Record<string, unknown>;
      children?: ReactNode;
    }
  >;

  export const Geographies: ComponentType<{
    geography: string;
    children: (props: {
      geographies: Array<{ rsmKey: string } & Record<string, unknown>>;
    }) => ReactNode;
  }>;

  export const Geography: ComponentType<Record<string, unknown>>;

  export const Marker: ComponentType<{
    coordinates: [number, number];
    children?: ReactNode;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
  }>;
}
