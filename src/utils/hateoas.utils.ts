// src/utils/hateoas.utils.ts

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
    { rel: "self", href: `/api/user/${userId}`, method: "GET" },
    { rel: "update-username", href: `/api/user/${userId}/username`, method: "PATCH" },
    { rel: "update-bio", href: `/api/user/${userId}/bio`, method: "PATCH" },
    { rel: "change-email", href: `/api/user/${userId}/email`, method: "PATCH" },
    { rel: "change-password", href: `/api/user/${userId}/password`, method: "PATCH" },
    { rel: "delete", href: `/api/user/${userId}`, method: "DELETE" },
  ];
}

export function userMutationLinks(userId: number): HateoasLink[] {
  return [
    { rel: "profile", href: `/api/user/${userId}`, method: "GET" },
    { rel: "self", href: `/api/user/${userId}`, method: "PATCH" },
  ];
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
    { rel: "profile", href: `/api/user/${userId}`, method: "GET" },
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
