-- Merge tags that differ only by case (e.g. "Cinema" / "cinema") into a single
-- canonical row per (userId, lower(name)) — the oldest tag wins — then enforce
-- case-insensitive uniqueness going forward. Prisma's DSL cannot express a
-- functional index on lower(name), so this index is hand-written and not
-- represented in schema.prisma (same pattern as the searchVector GIN index).

CREATE TEMP TABLE "_tag_canonical" AS
SELECT
  id,
  FIRST_VALUE(id) OVER (
    PARTITION BY "userId", lower(name)
    ORDER BY "createdAt" ASC, id ASC
  ) AS canonical_id
FROM "Tag";

-- Repoint SavedLinkTag rows from duplicate tags to the canonical tag, skipping
-- any that would collide with a row the canonical tag already has.
INSERT INTO "SavedLinkTag" ("savedLinkId", "tagId")
SELECT slt."savedLinkId", c.canonical_id
FROM "SavedLinkTag" slt
JOIN "_tag_canonical" c ON slt."tagId" = c.id
WHERE c.id <> c.canonical_id
ON CONFLICT ("savedLinkId", "tagId") DO NOTHING;

DELETE FROM "SavedLinkTag" slt
USING "_tag_canonical" c
WHERE slt."tagId" = c.id AND c.id <> c.canonical_id;

-- Same repoint for FeedItemTag rows.
INSERT INTO "FeedItemTag" ("feedItemId", "tagId")
SELECT fit."feedItemId", c.canonical_id
FROM "FeedItemTag" fit
JOIN "_tag_canonical" c ON fit."tagId" = c.id
WHERE c.id <> c.canonical_id
ON CONFLICT ("feedItemId", "tagId") DO NOTHING;

DELETE FROM "FeedItemTag" fit
USING "_tag_canonical" c
WHERE fit."tagId" = c.id AND c.id <> c.canonical_id;

-- Drop the now-unreferenced duplicate tags.
DELETE FROM "Tag" t
USING "_tag_canonical" c
WHERE t.id = c.id AND c.id <> c.canonical_id;

DROP TABLE "_tag_canonical";

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_lower_name_key" ON "Tag" ("userId", lower(name));
