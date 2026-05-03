import { ArtistView } from "@/components/music/artist-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArtistView artistId={id} />;
}
