import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { Calendar, User, ArrowLeft, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Server function to fetch a single blog post by slug
export const getSinglePublishedPostFn = createServerFn()
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    try {
      const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, data.slug),
      });
      if (!post || post.status !== "Published") {
        throw new Error("Post not found");
      }
      return { success: true, post };
    } catch (e: any) {
      console.error(`Failed to fetch public blog post slug=${data.slug}:`, e);
      return { success: false, error: e.message, post: null };
    }
  });

export const Route = createFileRoute("/blog/$slug")({
  head: ({ loaderData }: any) => ({
    meta: [
      { title: loaderData?.post ? `${loaderData.post.title} — cloudynationpos` : "Article — cloudynationpos" },
      {
        name: "description",
        content: loaderData?.post?.shortDescription || "POS Insight article.",
      },
    ],
  }),
  loader: async ({ params }) => {
    const res = await getSinglePublishedPostFn({ slug: params.slug });
    if (!res.success || !res.post) {
      throw new Error("Blog post not found");
    }
    return { post: res.post };
  },
  component: BlogReaderPage,
});

function BlogReaderPage() {
  const { post } = Route.useLoaderData();

  // Estimate read time based on 200 words per minute
  const readTime = Math.max(1, Math.ceil((post.content || "").split(/\s+/).length / 200));

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Navbar />
        <main className="py-12 lg:py-16">
          <div className="mx-auto max-w-3xl px-5 lg:px-8">
            {/* Back Button */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary mb-8 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Back to Blog insights
            </Link>

            <Reveal>
              <article>
                {/* Header */}
                <header className="mb-8">
                  <h1 className="text-3xl font-extrabold text-ink sm:text-4xl md:text-5xl leading-tight">
                    {post.title}
                  </h1>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-muted-foreground border-b border-border/40 pb-6">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {post.authorName}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {readTime} min read
                    </span>
                  </div>
                </header>

                {/* Banner Image */}
                {post.coverImageUrl && (
                  <div className="aspect-[21/9] w-full overflow-hidden bg-surface-2 rounded-2xl border border-border/50 mb-10 shadow-sm">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div
                  className="prose prose-slate max-w-none text-ink leading-relaxed space-y-6 text-base"
                  style={{ whiteSpace: "pre-line" }}
                  dangerouslySetInnerHTML={{
                    __html: post.content
                  }}
                />
              </article>
            </Reveal>

            {/* Platform Call to Action */}
            <Reveal delay={120}>
              <div className="panel mt-16 p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-mesh border-primary/20">
                <div className="max-w-md">
                  <h3 className="text-xl font-extrabold text-ink">
                    Scale your supermarket network with cloudynationpos
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Automate UAE VAT compliance, manage central catalogs, schedule vendor purchases, and sync delivery platforms automatically.
                  </p>
                </div>
                <div className="shrink-0 flex gap-3">
                  <Button asChild className="rounded-xl font-semibold">
                    <a href="/#contact">Book a demo</a>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl font-semibold">
                    <Link to="/pricing">Pricing plans</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
