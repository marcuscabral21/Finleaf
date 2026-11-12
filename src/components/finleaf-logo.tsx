import Image from "next/image";

type FinleafLogoProps = {
  appearance: "light" | "dark";
  size?: "compact" | "large";
};

const logoAssets = {
  light: {
    plant: "/logos/BlackPlant.svg",
    wordmark: "/logos/BlackFinleaf.svg",
  },
  dark: {
    plant: "/logos/WhitePlant.svg",
    wordmark: "/logos/WhiteFinleaf.svg",
  },
};

export function FinleafLogo({
  appearance,
  size = "compact",
}: FinleafLogoProps) {
  const assets = logoAssets[appearance];

  return (
    <span className={`finleaf-logo finleaf-logo-${size}`}>
      <Image
        className="finleaf-logo-plant"
        src={assets.plant}
        alt=""
        aria-hidden="true"
        width={44}
        height={32}
        priority
      />
      <Image
        className="finleaf-logo-wordmark"
        src={assets.wordmark}
        alt="Finleaf"
        width={106}
        height={42}
        priority
      />
    </span>
  );
}
