import logoUrl from "../assets/cookify-logo.svg";

type CookifyLogoProps = {
  size?: number;
};

export function CookifyLogo({ size = 72 }: CookifyLogoProps) {
  return <img src={logoUrl} width={size} height={size} alt="" aria-hidden="true" />;
}
