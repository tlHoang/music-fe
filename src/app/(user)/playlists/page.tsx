import { redirect } from 'next/navigation';

export default function PlaylistsPage() {
  // Redirect to the default playlists page (e.g., followed playlists)
  redirect('/playlists/followed');
}
