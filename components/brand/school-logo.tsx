import Image from "next/image";

const LOGO_SRC = "/brand/fpt-polytechnic-logo.png";

type SchoolLogoProps = {
  className?: string;
  priority?: boolean;
};

export function SchoolLogo({ className, priority = false }: SchoolLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="FPT Polytechnic"
      width={1260}
      height={428}
      priority={priority}
      className={className}
    />
  );
}
