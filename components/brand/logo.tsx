/**
 * Composant <Logo /> — point d'entrée unique pour la marque Stratly.
 *
 * Variantes :
 *   - "mark"     → symbole isométrique seul (compact, sidebars / favicon)
 *   - "full"     → symbole + wordmark "Stratly" (footers, pages marketing)
 *   - "wordmark" → texte "Stratly" seul (mobile menu, contextes contraints)
 *
 * Le mark est rendu en image (PNG haute résolution dans public/brand/).
 * Le wordmark est rendu en texte (DM Sans) pour rester net à toute taille
 * et hériter de la couleur ambiante (clair/sombre).
 */

import Image from "next/image";
import Link from "next/link";

type LogoVariant = "mark" | "full" | "wordmark";

interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  href?: string | null;
  className?: string;
  ariaLabel?: string;
  priority?: boolean;
}

const MARK_SRC = "/brand/stratly-mark.png";

export function Logo({
  variant = "mark",
  size = 28,
  href = null,
  className,
  ariaLabel = "Stratly",
  priority = false,
}: LogoProps) {
  const content =
    variant === "wordmark" ? (
      <span className="logo-wordmark" style={{ fontSize: Math.round(size * 0.6) }}>
        Stratly
      </span>
    ) : variant === "full" ? (
      <>
        <Image
          src={MARK_SRC}
          alt=""
          width={size}
          height={size}
          priority={priority}
          className="logo-mark"
          aria-hidden="true"
        />
        <span className="logo-wordmark" style={{ fontSize: Math.round(size * 0.62) }}>
          Stratly
        </span>
      </>
    ) : (
      <Image
        src={MARK_SRC}
        alt={ariaLabel}
        width={size}
        height={size}
        priority={priority}
        className="logo-mark"
      />
    );

  const wrapperClass = ["logo-root", `logo-${variant}`, className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <span className={wrapperClass} aria-label={variant === "mark" ? ariaLabel : undefined}>
      {content}
    </span>
  );
}
