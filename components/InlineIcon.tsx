export type InlineIconName =
  | "apple"
  | "arrowRight"
  | "bell"
  | "boxOpen"
  | "check"
  | "comments"
  | "envelope"
  | "facebook"
  | "gift"
  | "googlePlay"
  | "headset"
  | "instagram"
  | "location"
  | "package"
  | "phone"
  | "plus"
  | "truck"
  | "x"
  | "youtube";

const paths: Record<InlineIconName, React.ReactNode> = {
  apple: (
    <>
      <path d="M15.5 3.5c-.9.5-1.7 1.5-1.8 2.5 1.1.1 2.1-.6 2.7-1.3.5-.7.9-1.6.8-2.5-.6 0-1.2.2-1.7.5Z" />
      <path d="M18.7 17.2c-.6 1.4-.9 2-1.7 3.2-1.1 1.6-2.6 1.6-3.3.9-.8-.6-1.6-.6-2.4 0-.8.7-2.2.6-3.3-.9-2.2-3.2-3.9-9.1-.8-11.5 1.5-1.2 2.9-.7 3.8-.2.9.5 1.4.5 2.3 0 1-.6 2.6-1 4.1.3-3.6 2-3 6.8 1.3 8.2Z" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  boxOpen: (
    <>
      <path d="m3 9 9 5 9-5" />
      <path d="m3 9 9-5 9 5v6l-9 5-9-5Z" />
      <path d="M12 14v6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  comments: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </>
  ),
  envelope: (
    <>
      <path d="M4 6h16v12H4Z" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  facebook: <path d="M14 8h2V4h-3a5 5 0 0 0-5 5v3H5v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1Z" />,
  googlePlay: (
    <>
      <path d="M5 3v18l15-9Z" />
      <path d="m5 3 9 9-9 9" />
      <path d="m14 12 3.5-3.5" />
      <path d="m14 12 3.5 3.5" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13v4a2 2 0 0 0 2 2h2v-8H6a2 2 0 0 0-2 2Z" />
      <path d="M20 13v4a2 2 0 0 1-2 2h-2v-8h2a2 2 0 0 1 2 2Z" />
      <path d="M16 19c0 1.1-.9 2-2 2h-2" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  gift: (
    <>
      <path d="M20 12v8H4v-8" />
      <path d="M2 7h20v5H2Z" />
      <path d="M12 22V7" />
      <path d="M12 7H8.5a2.5 2.5 0 1 1 2.3-3.5L12 7Z" />
      <path d="M12 7h3.5a2.5 2.5 0 1 0-2.3-3.5L12 7Z" />
    </>
  ),
  location: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  package: (
    <>
      <path d="m21 8-9-5-9 5 9 5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  truck: (
    <>
      <path d="M10 17H6a3 3 0 1 1 0-6h10v6h-2" />
      <path d="M16 11h3l3 3v3h-2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="18" cy="17" r="2" />
      <path d="M3 7h10" />
    </>
  ),
  x: (
    <>
      <path d="m4 4 16 16" />
      <path d="M20 4 4 20" />
    </>
  ),
  youtube: (
    <>
      <path d="M22 12s0-4-1-5c-.6-.7-1.3-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.7.1-1.4.2-2 .9-1 1-1 5-1 5s0 4 1 5c.6.7 1.3.8 2 .9 2.2.1 7 .1 7 .1s4.8 0 7-.1c.7-.1 1.4-.2 2-.9 1-1 1-5 1-5Z" />
      <path d="m10 9 5 3-5 3Z" />
    </>
  ),
};

export default function InlineIcon({
  name,
  className = "h-5 w-5",
}: {
  name: InlineIconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
