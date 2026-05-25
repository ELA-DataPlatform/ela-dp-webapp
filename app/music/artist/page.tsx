import { ArtistView } from "@/components/music/artist-view";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <ArtistView artistId={id} />;
}
