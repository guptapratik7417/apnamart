import Image from "next/image";

export default function BrandLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center shadow-sm">
        <Image
          src="/logo.svg"
          alt="ApnaMart"
          width={42}
          height={42}
          className="rounded-xl"
        />
      </div>

      <div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-zinc-900 leading-none">
          Apna<span className="text-pink-500">Mart</span>
        </h1>

        <p className="mt-2 text-lg md:text-xl text-zinc-500 tracking-wide">
          Kids <span className="text-pink-400">·</span> Ladies{' '}
          <span className="text-pink-400">·</span> Toys{' '}
          <span className="text-pink-400">·</span> Jewellery{' '}
          <span className="text-pink-400">·</span> Gifts
        </p>
      </div>
    </div>
  );
}
