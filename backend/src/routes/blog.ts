import { Router } from "express";
import { db } from "../db/index.js";
import { blogPosts } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

export const publicRouter = Router();
export const adminRouter = Router();

// ==========================================
// PUBLIC ROUTES (/api/blog)
// ==========================================

// Get all published blog posts
publicRouter.get("/", async (req, res) => {
  try {
    const posts = await db.query.blogPosts.findMany({
      where: eq(blogPosts.status, "Published"),
      orderBy: desc(blogPosts.publishedAt),
    });
    res.json(posts);
  } catch (error) {
    console.error("Fetch public blogs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single published blog post by slug
publicRouter.get("/post/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
    });
    if (!post || post.status !== "Published") {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json(post);
  } catch (error) {
    console.error("Fetch blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// ADMIN ROUTES (/api/blog-admin)
// ==========================================

const requireHOAdmin = (req: any, res: any, next: any) => {
  const user = req.user;
  if (!user || user.role !== "head_office_admin") {
    return res.status(403).json({ error: "Forbidden: Only Head Office Admins can access blog management" });
  }
  next();
};

// Get all blog posts (Draft & Published)
adminRouter.get("/posts", requireAuth, requireHOAdmin, async (req, res) => {
  try {
    const posts = await db.query.blogPosts.findMany({
      orderBy: desc(blogPosts.createdAt),
    });
    res.json(posts);
  } catch (error) {
    console.error("Fetch admin posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new blog post
adminRouter.post("/posts", requireAuth, requireHOAdmin, async (req, res) => {
  const { title, slug, coverImageUrl, shortDescription, content, status, authorName } = req.body;
  if (!title || !slug || !shortDescription || !content) {
    return res.status(400).json({ error: "Title, slug, short description, and content are required" });
  }

  try {
    // Check if slug is unique
    const existing = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
    });
    if (existing) {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    const [newPost] = await db.insert(blogPosts).values({
      title,
      slug,
      coverImageUrl: coverImageUrl || null,
      shortDescription,
      content,
      status: status || "Draft",
      authorName: authorName || "Admin",
      publishedAt: status === "Published" ? new Date() : null,
    }).returning();

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Create blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update an existing blog post
adminRouter.patch("/posts/:id", requireAuth, requireHOAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, slug, coverImageUrl, shortDescription, content, status, authorName } = req.body;

  try {
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
    });
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    if (slug && slug !== post.slug) {
      const existing = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, slug),
      });
      if (existing) {
        return res.status(400).json({ error: "Slug must be unique" });
      }
    }

    const updates: any = {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl || null }),
      ...(shortDescription && { shortDescription }),
      ...(content && { content }),
      ...(status && { status }),
      ...(authorName && { authorName }),
      updatedAt: new Date(),
    };

    if (status === "Published" && post.status !== "Published") {
      updates.publishedAt = new Date();
    } else if (status === "Draft" && post.status === "Published") {
      updates.publishedAt = null;
    }

    const [updatedPost] = await db.update(blogPosts)
      .set(updates)
      .where(eq(blogPosts.id, id))
      .returning();

    res.json(updatedPost);
  } catch (error) {
    console.error("Update blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a blog post
adminRouter.delete("/posts/:id", requireAuth, requireHOAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db.delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Delete blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
