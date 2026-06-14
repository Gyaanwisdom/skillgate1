export const formatNaira = (n: number) =>
  "₦" + new Intl.NumberFormat("en-NG").format(n);

export const CATEGORY_ICONS: Record<string, string> = {
  electrician: "bolt",
  plumber: "plumbing",
  carpenter: "handyman",
  tailor: "content_cut",
  mechanic: "build",
  cleaner: "cleaning_services",
  painter: "format_paint",
  hairstylist: "cut",
};