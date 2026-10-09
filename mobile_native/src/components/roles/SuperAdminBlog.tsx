import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toast, ToastType } from '../ui/Toast';
import { useAuth } from '../../lib/auth';
import * as ImagePicker from 'expo-image-picker';
import {
  useSuperAdmin,
  BlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from '../../lib/SuperAdminContext';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  RefreshCw,
  Calendar,
  User,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react-native';

// Helper to format dates cleanly
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

// Generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function SuperAdminBlog({ onBack }: { onBack?: () => void } = {}) {
  const { branch } = useAuth();
  const {
    getBlogPosts,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    uploadBlogCover,
  } = useSuperAdmin();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Published' | 'Draft'>('all');

  // Create / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCoverImageUrl, setFormCoverImageUrl] = useState('');
  const [formShortDescription, setFormShortDescription] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<'Draft' | 'Published'>('Draft');
  const [formAuthorName, setFormAuthorName] = useState('Admin');

  // Delete Confirmation Modal State
  const [deleteTargetPost, setDeleteTargetPost] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await getBlogPosts();
      if (res.success && res.posts) {
        setPosts(res.posts);
      } else {
        showToast(res.error || 'Failed to fetch blog posts', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading blog posts', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.status === 'Published').length;
    const drafts = posts.filter((p) => p.status === 'Draft').length;
    return { total, published, drafts };
  }, [posts]);

  // Filtered post list
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesStatus =
        statusFilter === 'all' || post.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        (post.authorName && post.authorName.toLowerCase().includes(q)) ||
        (post.shortDescription && post.shortDescription.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [posts, statusFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormTitle('');
    setFormSlug('');
    setFormCoverImageUrl('');
    setFormShortDescription('');
    setFormContent('');
    setFormStatus('Draft');
    setFormAuthorName('Admin');
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormTitle(post.title || '');
    setFormSlug(post.slug || '');
    setFormCoverImageUrl(post.coverImageUrl || '');
    setFormShortDescription(post.shortDescription || '');
    setFormContent(post.content || '');
    setFormStatus((post.status as 'Draft' | 'Published') || 'Draft');
    setFormAuthorName(post.authorName || 'Admin');
    setModalVisible(true);
  };

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingPost) {
      setFormSlug(generateSlug(val));
    }
  };

  // Handle Cover Image Upload
  const handlePickCoverImage = async () => {
    if (Platform.OS === 'web') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/gif';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (file.size > 5 * 1024 * 1024) {
            showToast('File size exceeds 5MB limit', 'error');
            return;
          }

          setUploadingImage(true);
          try {
            const res = await uploadBlogCover(file, file.name, file.type);
            if (res.success && res.url) {
              setFormCoverImageUrl(res.url);
              showToast('Cover image uploaded successfully', 'success');
            } else {
              showToast(res.error || 'Failed to upload cover image', 'error');
            }
          } catch (err: any) {
            showToast(err.message || 'Image upload failed', 'error');
          } finally {
            setUploadingImage(false);
          }
        };
        input.click();
      } catch (err: any) {
        showToast(err.message || 'File picker error', 'error');
      }
      return;
    }

    // Native mobile (Android & iOS) with expo-image-picker
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Media library permission is required to upload images', 'warn');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingImage(true);
        const fileName = asset.fileName || `cover-${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';
        const res = await uploadBlogCover(asset.uri, fileName, mimeType);
        if (res.success && res.url) {
          setFormCoverImageUrl(res.url);
          showToast('Cover image uploaded successfully', 'success');
        } else {
          showToast(res.error || 'Failed to upload cover image', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to pick image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Create or Edit Form
  const handleSavePost = async () => {
    if (!formTitle.trim() || !formSlug.trim() || !formShortDescription.trim() || !formContent.trim()) {
      showToast('Title, Slug, Short Description, and Content are required', 'warn');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPost) {
        const updateInput: UpdateBlogPostInput = {
          title: formTitle.trim(),
          slug: formSlug.trim(),
          coverImageUrl: formCoverImageUrl.trim() || undefined,
          shortDescription: formShortDescription.trim(),
          content: formContent.trim(),
          status: formStatus,
          authorName: formAuthorName.trim() || 'Admin',
        };
        const res = await updateBlogPost(editingPost.id, updateInput);
        if (res.success) {
          showToast('Blog post updated successfully!', 'success');
          setModalVisible(false);
          loadPosts();
        } else {
          showToast(res.error || 'Failed to update blog post', 'error');
        }
      } else {
        const createInput: CreateBlogPostInput = {
          title: formTitle.trim(),
          slug: formSlug.trim(),
          coverImageUrl: formCoverImageUrl.trim() || undefined,
          shortDescription: formShortDescription.trim(),
          content: formContent.trim(),
          status: formStatus,
          authorName: formAuthorName.trim() || 'Admin',
        };
        const res = await createBlogPost(createInput);
        if (res.success) {
          showToast('Blog post created successfully!', 'success');
          setModalVisible(false);
          loadPosts();
        } else {
          showToast(res.error || 'Failed to create blog post', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save blog post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTargetPost) return;
    setDeleting(true);
    try {
      const res = await deleteBlogPost(deleteTargetPost.id);
      if (res.success) {
        showToast('Blog post deleted successfully', 'success');
        setDeleteTargetPost(null);
        loadPosts();
      } else {
        showToast(res.error || 'Failed to delete blog post', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting blog post', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader roleLabel="SA" branch={branch} />
      {onBack ? (
        <ScreenHeader
          title="Blog Management"
          subtitle="Create, edit, and publish platform articles"
          onBack={onBack}
          right={
            <TouchableOpacity
              style={styles.headerRefreshBtn}
              onPress={loadPosts}
              disabled={loading}
            >
              <RefreshCw size={18} color="#475569" />
            </TouchableOpacity>
          }
        />
      ) : null}

      <ScreenBody
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#39ff14" />}
      >
        {/* KPI Stat Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCol}>
              <StatCard
                label="Total Posts"
                value={String(stats.total)}
                accent="brand"
                icon={<BookOpen size={16} color="#39ff14" />}
              />
            </View>
            <View style={styles.statCol}>
              <StatCard
                label="Published"
                value={String(stats.published)}
                accent="sky"
                icon={<CheckCircle2 size={16} color="#0284c7" />}
              />
            </View>
            <View style={styles.statCol}>
              <StatCard
                label="Drafts"
                value={String(stats.drafts)}
                accent="amber"
                icon={<FileText size={16} color="#d97706" />}
              />
            </View>
          </View>

          {/* Action Header: Search & Create Post Button */}
          <View style={styles.actionBar}>
            <View style={styles.searchBox}>
              <Search size={16} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search articles..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleOpenCreate}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#0f172a" />
              <Text style={styles.createBtnText}>Create Post</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Status Chips */}
          <View style={styles.filterChipsRow}>
            {(['all', 'Published', 'Draft'] as const).map((st) => {
              const active = statusFilter === st;
              const label = st === 'all' ? 'All' : st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setStatusFilter(st)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Post Cards List */}
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#39ff14" />
              <Text style={styles.loadingText}>Loading blog posts...</Text>
            </View>
          ) : filteredPosts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <BookOpen size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No blog posts found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try adjusting your search query or filters.'
                  : 'Click "Create Post" to publish your first platform article.'}
              </Text>
            </Card>
          ) : (
            filteredPosts.map((post) => {
              const isPublished = post.status === 'Published';
              return (
                <Card key={post.id} style={styles.postCard}>
                  {/* Card Header: Cover Image + Details */}
                  <View style={styles.postCardRow}>
                    {post.coverImageUrl ? (
                      <Image
                        source={{ uri: post.coverImageUrl }}
                        style={styles.postCoverImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.postCoverPlaceholder}>
                        <ImageIcon size={24} color="#94a3b8" />
                      </View>
                    )}

                    <View style={styles.postMeta}>
                      <View style={styles.postStatusRow}>
                        <Badge variant={isPublished ? 'success' : 'neutral'}>
                          {post.status}
                        </Badge>
                        <Text style={styles.postDate}>
                          <Calendar size={11} color="#94a3b8" /> {formatDate(post.createdAt)}
                        </Text>
                      </View>

                      <Text style={styles.postTitle} numberOfLines={2}>
                        {post.title}
                      </Text>

                      <Text style={styles.postSlug} numberOfLines={1}>
                        /{post.slug}
                      </Text>
                    </View>
                  </View>

                  {/* Short Description */}
                  {post.shortDescription ? (
                    <Text style={styles.postExcerpt} numberOfLines={2}>
                      {post.shortDescription}
                    </Text>
                  ) : null}

                  {/* Footer: Author & Action Buttons */}
                  <View style={styles.postCardFooter}>
                    <View style={styles.postAuthorBox}>
                      <User size={13} color="#64748b" />
                      <Text style={styles.postAuthorText}>
                        {post.authorName || 'Admin'}
                      </Text>
                    </View>

                    <View style={styles.postActionsRow}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleOpenEdit(post)}
                        activeOpacity={0.7}
                      >
                        <Pencil size={15} color="#475569" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionIconBtn, styles.actionDeleteBtn]}
                        onPress={() => setDeleteTargetPost(post)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={15} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScreenBody>

      {/* Create / Edit Blog Post Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onDismiss={() => setToast(null)}
            />
          )}
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingPost ? 'Edit Blog Post' : 'Create Blog Post'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Fill in the article details for the platform website
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Modal Form Scrollable Body */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Title Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Title <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 5 POS Features to Grow Retail Sales"
                  placeholderTextColor="#94a3b8"
                  value={formTitle}
                  onChangeText={handleTitleChange}
                />
              </View>

              {/* Slug Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Slug <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 5-pos-features-to-grow-retail-sales"
                  placeholderTextColor="#94a3b8"
                  value={formSlug}
                  onChangeText={setFormSlug}
                  autoCapitalize="none"
                />
              </View>

              {/* Cover Image Picker & URL */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cover Image</Text>
                <View style={styles.imagePickerRow}>
                  <TouchableOpacity
                    style={styles.imageUploadBtn}
                    onPress={handlePickCoverImage}
                    disabled={uploadingImage}
                    activeOpacity={0.8}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#0f172a" />
                    ) : (
                      <>
                        <Upload size={14} color="#0f172a" />
                        <Text style={styles.imageUploadBtnText}>Upload Cover</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.formInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="Or enter Image URL"
                    placeholderTextColor="#94a3b8"
                    value={formCoverImageUrl}
                    onChangeText={setFormCoverImageUrl}
                    autoCapitalize="none"
                  />
                </View>

                {formCoverImageUrl ? (
                  <View style={styles.imagePreviewWrap}>
                    <Image
                      source={{ uri: formCoverImageUrl }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.clearImageBtn}
                      onPress={() => setFormCoverImageUrl('')}
                    >
                      <X size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Author Name & Status Row */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Author Name</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Admin"
                    placeholderTextColor="#94a3b8"
                    value={formAuthorName}
                    onChangeText={setFormAuthorName}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Status</Text>
                  <View style={styles.statusToggleWrap}>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleOption,
                        formStatus === 'Draft' && styles.statusToggleActive,
                      ]}
                      onPress={() => setFormStatus('Draft')}
                    >
                      <Text
                        style={[
                          styles.statusToggleText,
                          formStatus === 'Draft' && styles.statusToggleTextActive,
                        ]}
                      >
                        Draft
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleOption,
                        formStatus === 'Published' && styles.statusToggleActive,
                      ]}
                      onPress={() => setFormStatus('Published')}
                    >
                      <Text
                        style={[
                          styles.statusToggleText,
                          formStatus === 'Published' && styles.statusToggleTextActive,
                        ]}
                      >
                        Published
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Short Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Short Description <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { height: 72 }]}
                  placeholder="A concise summary of the article..."
                  placeholderTextColor="#94a3b8"
                  value={formShortDescription}
                  onChangeText={setFormShortDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Full Content */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Content (Plain Text) <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { height: 160 }]}
                  placeholder="Write full article content here..."
                  placeholderTextColor="#94a3b8"
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                  numberOfLines={8}
                />
              </View>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSavePost}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingPost ? 'Save Changes' : 'Create Article'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteTargetPost}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTargetPost(null)}
      >
        <View style={styles.deleteModalOverlay}>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onDismiss={() => setToast(null)}
            />
          )}
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteIconWrap}>
              <Trash2 size={24} color="#dc2626" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Blog Post</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{deleteTargetPost?.title}"? This action cannot be
              undone.
            </Text>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeleteTargetPost(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Feedback for Screen */}
      {!modalVisible && !deleteTargetPost && toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerRefreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },

  // KPI Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39ff14',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    gap: 6,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Status Filter Chips
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Loading & Empty
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },

  // Post Card
  postCard: {
    marginBottom: 12,
    padding: 14,
  },
  postCardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  postCoverImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  postCoverPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  postStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
    marginBottom: 4,
  },
  postSlug: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  postExcerpt: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  postCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  postAuthorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postAuthorText: {
    fontSize: 12,
    color: '#64748b',
  },
  postActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDeleteBtn: {
    backgroundColor: '#fef2f2',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 0,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 24,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  reqStar: {
    color: '#dc2626',
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  formTextArea: {
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  imageUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39ff14',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  imageUploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  imagePreviewWrap: {
    position: 'relative',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
    height: 120,
    backgroundColor: '#f1f5f9',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  clearImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  statusToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    height: 42,
    alignItems: 'center',
  },
  statusToggleOption: {
    flex: 1,
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToggleActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusToggleText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusToggleTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'android' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#39ff14',
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Delete Modal
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  deleteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  deleteModalText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
