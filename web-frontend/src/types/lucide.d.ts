declare module "lucide-react/dist/esm/icons/*" {
  import type { ForwardRefExoticComponent, RefAttributes } from "react";
  import type { LucideProps } from "lucide-react";

  const IconComponent: ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;
  export default IconComponent;
}
