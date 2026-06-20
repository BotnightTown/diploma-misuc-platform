-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "activity_feed_type" AS ENUM ('track_liked', 'review_posted', 'playlist_updated', 'user_followed', 'artist_followed');

-- CreateEnum
CREATE TYPE "album_type" AS ENUM ('album', 'single', 'ep');

-- CreateEnum
CREATE TYPE "room_participant_role" AS ENUM ('host', 'co_host', 'listener');

-- CreateEnum
CREATE TYPE "room_vote_type" AS ENUM ('skip', 'keep');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('listener', 'moderator', 'admin');

-- CreateTable
CREATE TABLE "activity_feed" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "type" "activity_feed_type" NOT NULL,
    "entity_type" VARCHAR(255) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_feed_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" SERIAL NOT NULL,
    "artist_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "cover_url" VARCHAR(255) NOT NULL DEFAULT 'default_cover.png',
    "release_year" INTEGER NOT NULL,
    "type" "album_type" NOT NULL DEFAULT 'single',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "albums_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "bio" TEXT,
    "avatar_url" VARCHAR(255) NOT NULL DEFAULT 'default_avatar.png',
    "country" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artists_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genres_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_follows" (
    "user_id" INTEGER NOT NULL,
    "playlist_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_follows_pk" PRIMARY KEY ("user_id","playlist_id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "playlist_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_tracks_pk" PRIMARY KEY ("playlist_id","track_id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "cover_url" VARCHAR(255) NOT NULL DEFAULT 'default_cover_url.png',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlists_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() + '7 days'::interval),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_likes" (
    "user_id" INTEGER NOT NULL,
    "review_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_likes_pk" PRIMARY KEY ("user_id","review_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_messages" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_messages_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_participants" (
    "room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "room_participant_role" NOT NULL DEFAULT 'listener',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "room_participants_pk" PRIMARY KEY ("room_id","user_id")
);

-- CreateTable
CREATE TABLE "room_queue" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "added_by" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "played_at" TIMESTAMPTZ(6),
    "skipped_at" TIMESTAMPTZ(6),

    CONSTRAINT "room_queue_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_votes" (
    "room_id" INTEGER NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vote" "room_vote_type" NOT NULL DEFAULT 'keep',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_votes_pk" PRIMARY KEY ("room_id","user_id","queue_id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "host_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_participants" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "rooms_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_likes" (
    "user_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_likes_pk" PRIMARY KEY ("user_id","track_id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" SERIAL NOT NULL,
    "album_id" INTEGER NOT NULL,
    "artist_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL DEFAULT 'unknown title',
    "duration_seconds" INTEGER NOT NULL,
    "genre" VARCHAR(255) NOT NULL,
    "bpm" INTEGER NOT NULL,
    "audio_url" VARCHAR(255) NOT NULL,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracks_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "follower_id" INTEGER NOT NULL,
    "following_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pk" PRIMARY KEY ("follower_id","following_id")
);

-- CreateTable
CREATE TABLE "user_follows_artists" (
    "user_id" INTEGER NOT NULL,
    "artist_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_artists_pk" PRIMARY KEY ("user_id","artist_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(255) NOT NULL DEFAULT 'default_avatar.png',
    "bio" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'listener',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pk_id" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_feed_actor_id_created_at_index" ON "activity_feed"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_feed_created_at_index" ON "activity_feed"("created_at" DESC);

-- CreateIndex
CREATE INDEX "albums_artist_id_release_year_index" ON "albums"("artist_id", "release_year" DESC);

-- CreateIndex
CREATE INDEX "artists_name_index" ON "artists"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_uk_name" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_uindex" ON "genres"("slug");

-- CreateIndex
CREATE INDEX "playlist_follows_playlist_id_index" ON "playlist_follows"("playlist_id");

-- CreateIndex
CREATE INDEX "playlist_tracks_playlist_id_position_index" ON "playlist_tracks"("playlist_id", "position");

-- CreateIndex
CREATE INDEX "playlists_user_id_index" ON "playlists"("user_id");

-- CreateIndex
CREATE INDEX "review_likes_review_id_index" ON "review_likes"("review_id");

-- CreateIndex
CREATE INDEX "reviews_track_id_created_at_index" ON "reviews"("track_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_uk" ON "reviews"("user_id", "track_id");

-- CreateIndex
CREATE INDEX "room_messages_room_id_created_at_index" ON "room_messages"("room_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "room_votes_queue_id_index" ON "room_votes"("queue_id");

-- CreateIndex
CREATE INDEX "rooms_created_at_index" ON "rooms"("created_at" DESC) WHERE (is_active = true);

-- CreateIndex
CREATE INDEX "track_likes_track_id_index" ON "track_likes"("track_id");

-- CreateIndex
CREATE INDEX "tracks_album_id_index" ON "tracks"("album_id");

-- CreateIndex
CREATE INDEX "tracks_title_index" ON "tracks"("title");

-- CreateIndex
CREATE INDEX "user_follows_artists_artist_id_index" ON "user_follows_artists"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_uk_username" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_uk_email" ON "users"("email");

-- AddForeignKey
ALTER TABLE "activity_feed" ADD CONSTRAINT "activity_feed_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playlist_follows" ADD CONSTRAINT "playlist_follows_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_follows" ADD CONSTRAINT "playlist_follows_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks___fk" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_queue" ADD CONSTRAINT "room_queue_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_queue" ADD CONSTRAINT "room_queue_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_queue" ADD CONSTRAINT "room_queue_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_votes" ADD CONSTRAINT "room_votes_room_queue_id_fk" FOREIGN KEY ("queue_id") REFERENCES "room_queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_votes" ADD CONSTRAINT "room_votes_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_votes" ADD CONSTRAINT "room_votes_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_likes" ADD CONSTRAINT "track_likes_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_likes" ADD CONSTRAINT "track_likes_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_users_id_fk_2" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows_artists" ADD CONSTRAINT "user_follows_artists_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
