import { redirect } from "next/navigation";

/** Legacy `/assistant` URLs (e.g. floating widget “open in new tab”) redirect into the dashboard inline assistant. */
export default async function AssistantRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ handoff?: string; standalone?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.handoff === "1") q.set("handoff", "1");
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/dashboard/dala-ai-assistant${suffix}`);
}
