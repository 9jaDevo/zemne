import Image from "next/image";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Image
      src={`/brand/zemne-logo-${light ? "light" : "dark"}.svg`}
      alt="ZEMNE"
      width={156}
      height={36}
      priority
    />
  );
}
