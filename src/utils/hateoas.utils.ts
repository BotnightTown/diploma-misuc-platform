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

export function createHateoasResponse<T>(data: T, links: HateoasLink[]): HateoasResponse<T> {
  return { data, _links: links };
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
