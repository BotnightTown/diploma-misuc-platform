export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HateoasLink {
  href: string;
  method: HttpMethod;
  rel: string;
}

export interface HateoasResponse<T> {
  data: T;
  _links: HateoasLink[];
}

export interface HateoasResponseWithMeta<T, M> extends HateoasResponse<T> {
  meta: M;
}

export function createHateoasResponse<T>(data: T, links: HateoasLink[]): HateoasResponse<T>;
export function createHateoasResponse<T, M>(
  data: T,
  links: HateoasLink[],
  meta: M,
): HateoasResponseWithMeta<T, M>;
export function createHateoasResponse<T, M>(data: T, links: HateoasLink[], meta?: M) {
  if (meta === undefined) {
    return { data, _links: links };
  }
  return { data, _links: links, meta };
}

// --- User links ---

export function userProfileLinks(userId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/users/${userId}`, method: "GET" },
    { rel: "update-username", href: `/api/users/${userId}/username`, method: "PATCH" },
    { rel: "update-bio", href: `/api/users/${userId}/bio`, method: "PATCH" },
    { rel: "change-email", href: `/api/users/${userId}/email`, method: "PATCH" },
    { rel: "change-password", href: `/api/users/${userId}/password`, method: "PATCH" },
    { rel: "delete", href: `/api/users/${userId}`, method: "DELETE" },
    { rel: "playlists", href: `/api/users/${userId}/playlists`, method: "GET" },
  ];
}

export function userMutationLinks(userId: number): HateoasLink[] {
  return [
    { rel: "profile", href: `/api/users/${userId}`, method: "GET" },
    { rel: "self", href: `/api/users/${userId}`, method: "PATCH" },
  ];
}

export function followersLinks(userId: number, page: number, totalPages: number) {
  const links = [
    { rel: "self", href: `/api/users/${userId}/followers?page=${page}`, method: "GET" },
    { rel: "user", href: `/api/users/${userId}`, method: "GET" },
  ];

  if (page > 1) {
    links.push({
      rel: "prev",
      href: `/api/users/${userId}/followers?page=${page - 1}`,
      method: "GET",
    });
  }
  if (page < totalPages) {
    links.push({
      rel: "next",
      href: `/api/users/${userId}/followers?page=${page + 1}`,
      method: "GET",
    });
  }

  return links;
}

export function followingLinks(userId: number, page: number, totalPages: number) {
  const links = [
    { rel: "self", href: `/api/users/${userId}/following?page=${page}`, method: "GET" },
    { rel: "user", href: `/api/users/${userId}`, method: "GET" },
  ];

  if (page > 1) {
    links.push({
      rel: "prev",
      href: `/api/users/${userId}/following?page=${page - 1}`,
      method: "GET",
    });
  }
  if (page < totalPages) {
    links.push({
      rel: "next",
      href: `/api/users/${userId}/following?page=${page + 1}`,
      method: "GET",
    });
  }

  return links;
}

// --- Auth links ---

export function meLinks(): HateoasLink[] {
  return [
    { rel: "self", href: `/api/auth/me`, method: "GET" },
    { rel: "refresh", href: `/api/auth/refresh`, method: "POST" },
    { rel: "logout", href: `/api/auth/logout`, method: "POST" },
  ];
}

export function registerLinks(): HateoasLink[] {
  return [{ rel: "login", href: "/api/auth/login", method: "POST" }];
}

export function loginLinks(userId: number): HateoasLink[] {
  return [
    { rel: "profile", href: `/api/users/${userId}`, method: "GET" },
    { rel: "logout", href: "/api/auth/logout", method: "POST" },
    { rel: "refresh", href: "/api/auth/refresh", method: "POST" },
  ];
}

export function refreshLinks(): HateoasLink[] {
  return [{ rel: "logout", href: "/api/auth/logout", method: "POST" }];
}

// --- Artist links ---

export function artistListLinks(): HateoasLink[] {
  return [
    { rel: "self", href: "/api/artists", method: "GET" },
    { rel: "create", href: "/api/artists", method: "POST" },
  ];
}

export function artistLinks(artistId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/artists/${artistId}`, method: "GET" },
    { rel: "albums", href: `/api/artists/${artistId}/albums`, method: "GET" },
    { rel: "tracks", href: `/api/artists/${artistId}/tracks`, method: "GET" },
    { rel: "update", href: `/api/artists/${artistId}`, method: "PATCH" },
    { rel: "delete", href: `/api/artists/${artistId}`, method: "DELETE" },
  ];
}

export function artistMutationLinks(artistId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/artists/${artistId}`, method: "GET" },
    { rel: "list", href: "/api/artists", method: "GET" },
  ];
}

// --- Album links ---

export function albumListLinks(): HateoasLink[] {
  return [
    { rel: "self", href: "/api/albums", method: "GET" },
    { rel: "create", href: "/api/albums", method: "POST" },
  ];
}

export function albumLinks(albumId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/albums/${albumId}`, method: "GET" },
    { rel: "tracks", href: `/api/albums/${albumId}/tracks`, method: "GET" },
    { rel: "update", href: `/api/albums/${albumId}`, method: "PATCH" },
    { rel: "delete", href: `/api/albums/${albumId}`, method: "DELETE" },
  ];
}

export function albumMutationLinks(albumId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/albums/${albumId}`, method: "GET" },
    { rel: "list", href: "/api/albums", method: "GET" },
  ];
}

// --- Track links ---

export function trackListLinks(): HateoasLink[] {
  return [
    { rel: "self", href: "/api/tracks", method: "GET" },
    { rel: "create", href: "/api/tracks", method: "POST" },
  ];
}

export function trackLinks(trackId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/tracks/${trackId}`, method: "GET" },
    { rel: "play", href: `/api/tracks/${trackId}/play`, method: "POST" },
    { rel: "update", href: `/api/tracks/${trackId}`, method: "PATCH" },
    { rel: "delete", href: `/api/tracks/${trackId}`, method: "DELETE" },
  ];
}

export function trackMutationLinks(trackId: number, albumId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/tracks/${trackId}`, method: "GET" },
    { rel: "album", href: `/api/albums/${albumId}/tracks`, method: "GET" },
  ];
}

// --- Review links ---

export function reviewLinks(trackId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/tracks/${trackId}/reviews`, method: "GET" },
    { rel: "create", href: `/api/tracks/${trackId}/reviews`, method: "POST" },
    { rel: "update", href: `/api/tracks/${trackId}/reviews`, method: "PATCH" },
    { rel: "delete", href: `/api/tracks/${trackId}/reviews`, method: "DELETE" },
  ];
}

export function reviewMutationLinks(trackId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/tracks/${trackId}/reviews`, method: "GET" },
    { rel: "track", href: `/api/tracks/${trackId}`, method: "GET" },
  ];
}

// --- Playlist links ---

export function playlistListLinks(): HateoasLink[] {
  return [
    { rel: "self", href: "/api/playlists", method: "GET" },
    { rel: "create", href: "/api/playlists", method: "POST" },
  ];
}

export function playlistLinks(playlistId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/playlists/${playlistId}`, method: "GET" },
    { rel: "tracks", href: `/api/playlists/${playlistId}/tracks`, method: "GET" },
    { rel: "addTrack", href: `/api/playlists/${playlistId}/tracks`, method: "POST" },
    { rel: "reorderTracks", href: `/api/playlists/${playlistId}/tracks/reorder`, method: "PATCH" },
    { rel: "update", href: `/api/playlists/${playlistId}`, method: "PATCH" },
    { rel: "delete", href: `/api/playlists/${playlistId}`, method: "DELETE" },
    { rel: "follow", href: `/api/playlists/${playlistId}/follow`, method: "POST" },
    { rel: "unfollow", href: `/api/playlists/${playlistId}/follow`, method: "DELETE" },
  ];
}

export function playlistMutationLinks(playlistId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/playlists/${playlistId}`, method: "GET" },
    { rel: "list", href: "/api/playlists", method: "GET" },
  ];
}

export function playlistTrackLinks(playlistId: number, trackId: number): HateoasLink[] {
  return [
    { rel: "playlist", href: `/api/playlists/${playlistId}`, method: "GET" },
    { rel: "remove", href: `/api/playlists/${playlistId}/tracks/${trackId}`, method: "DELETE" },
  ];
}

export function userPlaylistsLinks(userId: number): HateoasLink[] {
  return [
    { rel: "self", href: `/api/users/${userId}/playlists`, method: "GET" },
    { rel: "user", href: `/api/users/${userId}`, method: "GET" },
  ];
}

// --- Room links ---

export function roomLinks(roomId: number, hostId: number, currentUserId?: number): HateoasLink[] {
  const links: HateoasLink[] = [
    { rel: "self", href: `/api/rooms/${roomId}`, method: "GET" },
    { rel: "messages", href: `/api/rooms/${roomId}/messages`, method: "POST" },
    { rel: "queue", href: `/api/rooms/${roomId}/queue`, method: "POST" },
    { rel: "ws", href: `/api/rooms/${roomId}/ws`, method: "GET" },
  ];

  if (currentUserId === hostId) {
    links.push(
      { rel: "update", href: `/api/rooms/${roomId}`, method: "PATCH" },
      { rel: "close", href: `/api/rooms/${roomId}`, method: "DELETE" },
    );
  } else {
    links.push({ rel: "join", href: `/api/rooms/${roomId}/participants`, method: "POST" });
  }

  return links;
}

export function roomMutationLinks(roomId: number): HateoasLink[] {
  return [{ rel: "room", href: `/api/rooms/${roomId}`, method: "GET" }];
}

export function roomListLinks(): HateoasLink[] {
  return [{ rel: "self", href: `/api/rooms`, method: "GET" }];
}

export function roomParticipantLinks(roomId: number): HateoasLink[] {
  return [
    { rel: "room", href: `/api/rooms/${roomId}`, method: "GET" },
    { rel: "leave", href: `/api/rooms/${roomId}/participants`, method: "DELETE" },
  ];
}
