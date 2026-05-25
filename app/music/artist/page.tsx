import { ArtistView } from "@/components/music/artist-view";

const DEFAULT_ARTIST = "radiohead";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <ArtistView artistId={id || DEFAULT_ARTIST} />;
}
