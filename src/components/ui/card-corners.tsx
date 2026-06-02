import { CrossMarker } from "./cross-marker";

/**
 * Drops a `+` glyph at each corner of the parent box. Parent must be
 * `relative`. Use to decorate cards / form panels with the project's
 * grid-frame language.
 */
export function CardCorners({
  className,
}: {
  className?: string;
}): React.ReactElement {
  return (
    <>
      <CrossMarker className={`-left-[7px] -top-[7px] ${className ?? ""}`} />
      <CrossMarker className={`-right-[7px] -top-[7px] ${className ?? ""}`} />
      <CrossMarker className={`-bottom-[7px] -left-[7px] ${className ?? ""}`} />
      <CrossMarker className={`-bottom-[7px] -right-[7px] ${className ?? ""}`} />
    </>
  );
}
