import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-05-24" });

async function migrate() {
  const posts = await client.fetch(`*[_type == "blogPost" && defined(category) && !(_id in path("drafts.*"))]{
    _id,
    category
  }`);

  console.log(`Found ${posts.length} published blog posts`);

  const unique = new Map();

  for (const post of posts) {
    if (post.category && typeof post.category === "object" && !post.category._ref) {
      const key = JSON.stringify(post.category);
      if (!unique.has(key)) {
        unique.set(key, post.category);
      }
    }
  }

  console.log(`Found ${unique.size} unique categories to create`);

  const slugMap = new Map();

  for (const [key, value] of unique) {
    const fr = value.fr || "";
    const slug = fr
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0]._id`,
      { slug }
    );

    let categoryId;

    if (existing) {
      categoryId = existing;
      console.log(`  ↳ Category "${fr}" already exists (${categoryId})`);
    } else {
      const doc = {
        _type: "category",
        title: { fr, en: value.en || "" },
        slug: { _type: "slug", current: slug },
      };

      const created = await client.create(doc);
      categoryId = created._id;
      console.log(`  ✓ Created category "${fr}" → ${categoryId}`);
    }

    slugMap.set(key, { _ref: categoryId, _type: "reference" });
  }

  console.log("\nUpdating blog posts...");

  for (const post of posts) {
    if (post.category && typeof post.category === "object" && !post.category._ref) {
      const key = JSON.stringify(post.category);
      const ref = slugMap.get(key);

      if (ref) {
        await client.patch(post._id).set({ category: ref }).commit();
        console.log(`  ✓ Updated post ${post._id}`);
      }
    }
  }

  console.log("\n✅ Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
