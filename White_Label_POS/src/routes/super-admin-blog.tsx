import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { DemoShell } from "@/components/demo/DemoShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    getBlogPostsFn,
    createBlogPostFn,
    updateBlogPostFn,
    deleteBlogPostFn,
    uploadBlogCoverFn,
} from "@/lib/super-admin-server";

export const Route = createFileRoute("/super-admin-blog")({
    beforeLoad: async () => {
        const res = await getSessionServerFn();
        if (!res.success || !res.session) throw redirect({ to: "/login" });
        const role = res.session.role as Role;
        if (role !== "Super Admin") throw redirect({ to: roleRoutes[role] });
    },
    component: SuperAdminBlogPage,
});

function SuperAdminBlogPage() {
    const [blogPostsList, setBlogPostsList] = useState<any[]>([]);
    const [isLoadingBlog, setIsLoadingBlog] = useState(false);
    const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
    const [isSavingBlogPost, setIsSavingBlogPost] = useState(false);
    const [selectedBlogPost, setSelectedBlogPost] = useState<any | null>(null);
    const [blogForm, setBlogForm] = useState({
        title: "",
        slug: "",
        coverImageUrl: "",
        shortDescription: "",
        content: "",
        status: "Draft",
        authorName: "Admin",
    });
    const [deleteBlogContext, setDeleteBlogContext] = useState<any>(null);
    const [deleteBlogDialogOpen, setDeleteBlogDialogOpen] = useState(false);
    const [isDeletingBlogPost, setIsDeletingBlogPost] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const fetchBlogPosts = () => {
        setIsLoadingBlog(true);
        getBlogPostsFn()
            .then((res: any) => {
                if (res.success) {
                    setBlogPostsList(res.posts || []);
                } else {
                    toast.error("Failed to load blog posts");
                }
            })
            .catch((err: any) => {
                toast.error(err.message || "Failed to load blog posts");
            })
            .finally(() => {
                setIsLoadingBlog(false);
            });
    };

    useEffect(() => {
        fetchBlogPosts();
    }, []);

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size exceeds 5MB limit");
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.");
            return;
        }

        setIsUploadingImage(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(",")[1];
                try {
                    const res = await uploadBlogCoverFn({
                        data: {
                            base64Data: base64,
                            fileName: file.name,
                            mimeType: file.type,
                        },
                    });
                    const imgUrl = (res as any).publicUrl || (res as any).url;
                    if (res.success && imgUrl) {
                        setBlogForm((prev) => ({ ...prev, coverImageUrl: imgUrl }));
                        toast.success("Image uploaded successfully");
                    } else {
                        toast.error("Upload failed");
                    }
                } catch (err: any) {
                    toast.error(err.message || "Upload failed");
                } finally {
                    setIsUploadingImage(false);
                }
            };
            reader.onerror = () => {
                toast.error("Failed to read file");
                setIsUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            toast.error(err.message || "Failed to process file");
            setIsUploadingImage(false);
        }
    };

    const handleSaveBlogPost = async () => {
        if (!blogForm.title || !blogForm.slug || !blogForm.shortDescription || !blogForm.content) {
            toast.error("Please fill in all required fields (Title, Slug, Short Description, and Content)");
            return;
        }

        setIsSavingBlogPost(true);
        try {
            if (selectedBlogPost) {
                // Edit mode
                const res = await updateBlogPostFn({
                    data: {
                        id: selectedBlogPost.id,
                        ...blogForm,
                    },
                });
                if (res.success) {
                    toast.success("Blog post updated successfully");
                    setIsBlogModalOpen(false);
                    fetchBlogPosts();
                }
            } else {
                // Create mode
                const res = await createBlogPostFn({
                    data: blogForm,
                });
                if (res.success) {
                    toast.success("Blog post created successfully");
                    setIsBlogModalOpen(false);
                    fetchBlogPosts();
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save blog post");
        } finally {
            setIsSavingBlogPost(false);
        }
    };

    const handleDeleteBlogPost = async () => {
        if (!deleteBlogContext) return;
        setIsDeletingBlogPost(true);
        try {
            const res = await deleteBlogPostFn({
                data: { id: deleteBlogContext.id },
            });
            if (res.success) {
                toast.success("Blog post deleted successfully");
                setDeleteBlogDialogOpen(false);
                setDeleteBlogContext(null);
                fetchBlogPosts();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to delete blog post");
        } finally {
            setIsDeletingBlogPost(false);
        }
    };

    return (
        <DemoShell
            title="Blog Management"
            subtitle="Create, edit, and publish platform blog posts for the marketing website."
            actions={
                <Button
                    className="rounded-xl font-semibold shadow-sm hover:-translate-y-0.5 transition-all"
                    onClick={() => {
                        setSelectedBlogPost(null);
                        setBlogForm({
                            title: "",
                            slug: "",
                            coverImageUrl: "",
                            shortDescription: "",
                            content: "",
                            status: "Draft",
                            authorName: "Admin",
                        });
                        setIsBlogModalOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" /> Create Blog Post
                </Button>
            }
        >
            <div className="panel p-6 space-y-4">
                {isLoadingBlog ? (
                    <div className="py-20 text-center text-muted-foreground">Loading blog posts...</div>
                ) : blogPostsList.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">No blog posts found. Click "Create Blog Post" to add one.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cover</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blogPostsList.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell>
                                            {post.coverImageUrl ? (
                                                <img
                                                    src={post.coverImageUrl}
                                                    alt={post.title}
                                                    className="h-10 w-16 object-cover rounded border border-border"
                                                />
                                            ) : (
                                                <div className="h-10 w-16 bg-surface-2 border border-border rounded flex items-center justify-center text-xs text-muted-foreground">
                                                    No Image
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-semibold text-ink max-w-xs truncate">
                                            {post.title}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {post.slug}
                                        </TableCell>
                                        <TableCell className="text-sm">{post.authorName}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={post.status === "Published" ? "default" : "outline"}
                                                className={post.status === "Published" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800"}
                                            >
                                                {post.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                 <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={() => {
                                                        setSelectedBlogPost(post);
                                                        setBlogForm({
                                                            title: post.title,
                                                            slug: post.slug,
                                                            coverImageUrl: post.coverImageUrl || "",
                                                            shortDescription: post.shortDescription,
                                                            content: post.content,
                                                            status: post.status,
                                                            authorName: post.authorName,
                                                        });
                                                        setIsBlogModalOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                    onClick={() => {
                                                        setDeleteBlogContext(post);
                                                        setDeleteBlogDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Create/Edit Blog Post Dialog */}
            <Dialog open={isBlogModalOpen} onOpenChange={setIsBlogModalOpen}>
                <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedBlogPost ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to save the blog post. Required fields are marked.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="e.g. 5 POS Features to Grow Sales"
                                    value={blogForm.title}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setBlogForm((prev) => ({
                                            ...prev,
                                            title: val,
                                            slug: selectedBlogPost
                                                ? prev.slug
                                                : val
                                                    .toLowerCase()
                                                    .replace(/[^a-z0-9]+/g, "-")
                                                    .replace(/(^-|-$)+/g, ""),
                                        }));
                                    }}
                                    className="rounded-xl border-border/50 bg-surface-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="e.g. 5-pos-features-to-grow-sales"
                                    value={blogForm.slug}
                                    onChange={(e) =>
                                        setBlogForm({
                                            ...blogForm,
                                            slug: e.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9-]+/g, ""),
                                        })
                                    }
                                    className="rounded-xl border-border/50 bg-surface-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Author Name</Label>
                                <Input
                                    placeholder="Admin"
                                    value={blogForm.authorName}
                                    onChange={(e) => setBlogForm({ ...blogForm, authorName: e.target.value })}
                                    className="rounded-xl border-border/50 bg-surface-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Publish Status</Label>
                                <Select
                                    value={blogForm.status}
                                    onValueChange={(val) => setBlogForm({ ...blogForm, status: val })}
                                >
                                    <SelectTrigger className="rounded-xl border-border/50 bg-surface-2">
                                        <SelectValue placeholder="Draft" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Cover Image URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://example.com/cover.jpg"
                                    value={blogForm.coverImageUrl}
                                    onChange={(e) => setBlogForm({ ...blogForm, coverImageUrl: e.target.value })}
                                    className="rounded-xl border-border/50 bg-surface-2 flex-1"
                                />
                                <div className="relative shrink-0">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handleUploadImage}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={isUploadingImage}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl pointer-events-none"
                                        disabled={isUploadingImage}
                                    >
                                        {isUploadingImage ? "Uploading..." : "Upload Image"}
                                    </Button>
                                </div>
                            </div>
                            {blogForm.coverImageUrl && (
                                <div className="mt-2 border border-border rounded-xl p-2 bg-surface-2 flex justify-center">
                                    <img
                                        src={blogForm.coverImageUrl}
                                        alt="Cover Preview"
                                        className="h-28 object-contain rounded"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Short Description <span className="text-destructive">*</span></Label>
                            <textarea
                                placeholder="A short teaser summary of the post..."
                                value={blogForm.shortDescription}
                                onChange={(e) => setBlogForm({ ...blogForm, shortDescription: e.target.value })}
                                className="w-full min-h-[60px] rounded-xl border border-border/50 bg-surface-2 p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Full Content (Markdown / HTML / Text) <span className="text-destructive">*</span></Label>
                            <textarea
                                placeholder="Write your main article content here..."
                                value={blogForm.content}
                                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                                className="w-full min-h-[180px] rounded-xl border border-border/50 bg-surface-2 p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setIsBlogModalOpen(false)}
                            disabled={isSavingBlogPost}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl"
                            onClick={handleSaveBlogPost}
                            disabled={isSavingBlogPost}
                        >
                            {isSavingBlogPost ? "Saving..." : "Save Post"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteBlogDialogOpen} onOpenChange={setDeleteBlogDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Blog Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this post?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                                setDeleteBlogDialogOpen(false);
                                setDeleteBlogContext(null);
                            }}
                            disabled={isDeletingBlogPost}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-xl"
                            onClick={handleDeleteBlogPost}
                            disabled={isDeletingBlogPost}
                        >
                            {isDeletingBlogPost ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DemoShell>
    );
}
