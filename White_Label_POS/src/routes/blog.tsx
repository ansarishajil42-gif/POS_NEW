import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { BookOpen, Calendar, ArrowRight, User } from "lucide-react";

// Server function to fetch published blog posts
export const getPublishedPostsFn = createServerFn()
  .handler(async () => {
    try {
      const posts = await db.query.blogPosts.findMany({
        where: eq(blogPosts.status, "Published"),
        orderBy: desc(blogPosts.publishedAt),
      });
      return { success: true, posts };
    } catch (e: any) {
      console.error("Failed to fetch public blog posts:", e);
      return { success: false, error: e.message, posts: [] };
    }
  });

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "POS Blog — cloudynationpos insights" },
      {
        name: "description",
        content: "Learn tips and strategies on grocery store operations, retail inventory management, FTA compliance, and POS tech.",
      },
    ],
  }),
  loader: async () => {
    const res = await getPublishedPostsFn();
    return { posts: res.posts || [] };
  },
  component: BlogListPage,
});

function BlogListPage() {
  const { posts } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Navbar />
        <main>
          {/* Hero Section */}
          <section className="bg-mesh py-16 lg:py-20 border-b border-border/40">
            <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
              <Reveal>
                <p className="text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase">Knowledge Base</p>
                <h1 className="mt-3 text-4xl font-extrabold text-ink sm:text-5xl">
                  Retail POS Insights & Strategies
                </h1>
                <p className="mt-5 text-lg text-muted-foreground">
                  Expert advice on multi-branch management, VAT compliance, supermarket optimization, and grocery delivery operations.
                </p>
              </Reveal>
            </div>
          </section>

          {/* Posts Grid Section */}
          <section className="py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
              {posts.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-3xl border border-border/50 max-w-md mx-auto">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-bold text-ink">No articles published yet</h3>
                  <p className="text-sm text-muted-foreground mt-2 px-6">
                    Our editors are preparing insights for grocery store owners. Stay tuned!
                  </p>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post: any, idx: number) => (
                    <Reveal key={post.id} delay={idx * 60}>
                      <article className="panel flex h-full flex-col overflow-hidden hover:shadow-[var(--shadow-lift)] transition-all duration-300 group border-border/50 hover:border-primary/20">
                        {/* Cover Image */}
                        <div className="aspect-[16/9] w-full overflow-hidden bg-surface-2 relative border-b border-border/50">
                          {post.coverImageUrl ? (
                            <img
                              src={post.coverImageUrl}
                              alt={post.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/60 bg-surface-2">
                              <BookOpen className="h-12 w-12 stroke-[1.5]" />
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="flex flex-1 flex-col p-6">
                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {post.authorName}
                            </span>
                          </div>

                          {/* Title */}
                          <h2 className="text-xl font-extrabold text-ink leading-snug group-hover:text-primary transition-colors duration-200">
                            <Link to="/blog/$slug" params={{ slug: post.slug }}>
                              {post.title}
                            </Link>
                          </h2>

                          {/* Teaser text */}
                          <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
                            {post.shortDescription}
                          </p>

                          {/* Action */}
                          <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-sm font-semibold text-primary">
                            <span>Read article</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}
