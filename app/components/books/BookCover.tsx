import Image from "next/image";
import { getBookCover } from "@/lib/books/cover";
import { isOptimizableCoverSrc } from "@/lib/books/cover-hosts";
import type { PublicBook } from "@/lib/books/types";

type Props = {
  book: Pick<PublicBook, "title" | "cover_image_path" | "cover_width" | "cover_height">;
  sizes: string;
  priority?: boolean;
  className?: string;
};

const FRAME =
  "overflow-hidden rounded-[3px] bg-ink-elevated ring-1 ring-white/10 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.85)]";

/**
 * The book's actual uploaded cover at its original proportions, or nothing.
 * (No generated or placeholder cover — see getBookCover.)
 */
export default function BookCover({ book, sizes, priority = false, className = "" }: Props) {
  const cover = getBookCover(book);
  if (!cover) return null;
  const unoptimized = !isOptimizableCoverSrc(cover.src);

  if (cover.width && cover.height) {
    return (
      <div className={`${FRAME} ${className}`}>
        <Image
          src={cover.src}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className="block h-auto w-full"
        />
      </div>
    );
  }
  // Covers uploaded before dimensions were recorded: keep proportions via contain.
  return (
    <div className={`${FRAME} relative aspect-[2/3] ${className}`}>
      <Image
        src={cover.src}
        alt={cover.alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        className="object-contain"
      />
    </div>
  );
}
