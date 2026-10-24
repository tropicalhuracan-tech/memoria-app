import { PublicSafeViewer } from "@/components/PublicSafeViewer";

export const instant = false;

export default async function VerCompartidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicSafeViewer shareId={id} />;
}
