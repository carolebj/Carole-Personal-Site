interface BookProps {
  title: string;
  coverUrl?: string;
  width?: number;
  color?: string;
  textColor?: string;
  variant?: "cover" | "simple" | "stripe";
  textured?: boolean;
}

export function Book({
  title,
  coverUrl,
  width = 180,
  color = "#f3d458",
  textColor = "#22201f",
  variant = coverUrl ? "cover" : "stripe",
  textured = true,
}: BookProps) {
  const height = Math.round(width * 1.24);
  const depth = Math.max(Math.round(width * 0.13), 18);
  const spineWidth = Math.max(Math.round(width * 0.085), 12);
  const isStripe = variant === "stripe";

  return (
    <div
      className="group/book inline-block w-fit py-3"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] [transform:rotateY(-5deg)_rotateX(1deg)] group-hover/book:[transform:rotateY(-14deg)_rotateX(2deg)_translateY(-3px)] group-hover/book-card:[transform:rotateY(-14deg)_rotateX(2deg)_translateY(-3px)]"
        style={{
          transformStyle: "preserve-3d",
          width,
          height,
          containerType: "inline-size",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute left-[9%] top-[10%] h-[82%] w-[82%] rounded-[10px] bg-black/10 blur-xl opacity-70 transition-opacity duration-500 group-hover/book:opacity-85 group-hover/book-card:opacity-85"
          style={{
            transform: `translateZ(-${depth + 8}px) translateY(14px)`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-y-[3px] right-0 overflow-hidden rounded-r-[7px] border border-[#d9d3ca]"
          style={{
            width: depth,
            background:
              "repeating-linear-gradient(90deg, #f7f1e8 0 2px, #e6ded2 2px 3px), linear-gradient(90deg, #fdfaf4, #d8d0c4)",
            transform: `translateX(${depth / 2}px) rotateY(90deg)`,
            transformOrigin: "left center",
            boxShadow: "inset -8px 0 18px rgba(50, 36, 24, 0.12)",
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-l-[6px] rounded-r-[8px] bg-[#d7cfc5]"
          style={{
            transform: `translateZ(-${depth}px)`,
            boxShadow: "0 12px 22px rgba(48, 38, 31, 0.1)",
          }}
        />

        <div
          className="relative flex h-full flex-col overflow-hidden rounded-l-[6px] rounded-r-[8px] border border-[#d9d3ca] bg-[#f9f8f5]"
          style={{
            width,
            transform: "translateZ(1px)",
            boxShadow:
              "inset 6px 0 12px rgba(65, 45, 30, 0.1), 0 1px 2px rgba(36, 28, 22, 0.06), 0 10px 20px rgba(40, 33, 27, 0.09)",
          }}
        >
          {coverUrl ? (
            <div className="relative h-full w-full bg-[#f9f8f5]">
              <img
                src={coverUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.52),rgba(255,255,255,0)_17%,rgba(0,0,0,0)_78%,rgba(0,0,0,.08))]" />
            </div>
          ) : (
            <>
              {isStripe && (
                <div
                  className="relative h-[46%] overflow-hidden"
                  style={{ background: color }}
                >
                  <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(90deg,transparent_0_24%,rgba(123,86,0,.35)_24%_25%,transparent_25%_49%,rgba(123,86,0,.35)_49%_50%,transparent_50%_74%,rgba(123,86,0,.35)_74%_75%,transparent_75%),linear-gradient(0deg,transparent_0_49%,rgba(123,86,0,.35)_49%_50%,transparent_50%)]" />
                  <div className="absolute left-[23%] top-[28%] h-16 w-16 rounded-full border-2 border-[#a97800]/35" />
                  <div className="absolute right-[-8%] top-[-12%] h-24 w-24 rounded-full border-2 border-[#a97800]/35" />
                </div>
              )}
              <div
                className={`relative flex flex-1 flex-col p-[11%] ${
                  isStripe ? "justify-between bg-[#fbfaf7]" : "justify-start"
                }`}
                style={{
                  background: isStripe ? undefined : color,
                }}
              >
                <span
                  className="max-w-[92%] text-balance text-[15cqw] font-bold leading-[1.12] tracking-[-0.02em]"
                  style={{ color: textColor }}
                >
                  {title}
                </span>
                {isStripe ? (
                  <svg
                    className="h-[14cqw] w-[14cqw]"
                    viewBox="0 0 24 24"
                    style={{ fill: textColor }}
                    aria-hidden="true"
                  >
                    <path d="M21 21H3L12 3Z" />
                  </svg>
                ) : (
                  <div
                    className="mt-[16%] h-[24cqw] w-[24cqw] rounded-full border-[1.3cqw]"
                    style={{ borderColor: textColor }}
                  />
                )}
              </div>
            </>
          )}

          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0"
            style={{
              width: spineWidth,
              background:
                "linear-gradient(90deg, rgba(0,0,0,.18), rgba(255,255,255,.18) 38%, rgba(0,0,0,.06) 74%, transparent)",
              boxShadow: "inset -1px 0 rgba(255,255,255,.32)",
            }}
          />

          {textured && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat opacity-[.16] mix-blend-multiply"
              style={{
                backgroundImage:
                  "url('https://assets.vercel.com/image/upload/v1720554484/front/design/book-texture.avif')",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
