import React, { useState, useEffect } from 'react';
import { MessageCircle, FileText, ArrowLeft, Send, Plus, X, User } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { getCommunityPosts, createCommunityPost, getCommunityPostDetails, addCommunityReply } from '../utils/api';

const Community = ({ user }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [detailPost, setDetailPost] = useState(null);
    const [replies, setReplies] = useState([]);
    const [repliesLoading, setRepliesLoading] = useState(false);

    // New post state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // New reply state
    const [replyContent, setReplyContent] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data } = await getCommunityPosts();
            setPosts(data.posts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedPostId) {
            fetchPosts();
        } else {
            fetchPostDetails(selectedPostId);
        }
    }, [selectedPostId]);

    const fetchPostDetails = async (postId) => {
        setRepliesLoading(true);
        try {
            const { data } = await getCommunityPostDetails(postId);
            setDetailPost(data.post);
            setReplies(data.replies || []);
        } catch (err) {
            console.error(err);
            setSelectedPostId(null);
        } finally {
            setRepliesLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;
        setSubmitting(true);
        try {
            await createCommunityPost({
                title: newTitle.trim(),
                content: newContent.trim(),
                author_name: user?.name,
            });
            setNewTitle('');
            setNewContent('');
            setShowAddModal(false);
            fetchPosts();
        } catch {
            alert('Failed to publish discussion topic.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setReplySubmitting(true);
        try {
            await addCommunityReply(selectedPostId, {
                content: replyContent.trim(),
                author_name: user?.name,
            });
            setReplyContent('');
            fetchPostDetails(selectedPostId);
        } catch {
            alert('Failed to submit comment.');
        } finally {
            setReplySubmitting(false);
        }
    };

    if (selectedPostId && detailPost) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <button
                    onClick={() => {
                        setSelectedPostId(null);
                        setDetailPost(null);
                        setReplies([]);
                    }}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-eco-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Discussions
                </button>

                {/* The Original Thread Post */}
                <Card className="border border-gray-100 shadow-md">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900">{detailPost.author_name}</p>
                                <p className="text-[10px] text-gray-400">
                                    {new Date(detailPost.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-gray-900">{detailPost.title}</h1>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{detailPost.content}</p>
                    </div>
                </Card>

                {/* Comment Thread replies */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <MessageCircle className="h-4.5 w-4.5 text-gray-400" />
                        <span>Replies ({replies.length})</span>
                    </h3>

                    {repliesLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="loading-ring" />
                        </div>
                    ) : replies.length === 0 ? (
                        <div className="p-6 bg-white rounded-2xl border border-gray-100 text-center text-xs text-gray-400">
                            No replies yet. Be the first to start the conversation!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {replies.map((rep) => (
                                <div key={rep.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3 fade-in">
                                    <div className="h-7 w-7 bg-eco-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <User className="h-3.5 w-3.5 text-eco-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xs font-bold text-gray-900">{rep.author_name}</span>
                                            <span className="text-[9px] text-gray-400">
                                                {new Date(rep.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {rep.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reply Editor Form */}
                <Card className="border border-gray-100">
                    <form onSubmit={handleAddReply} className="space-y-3">
                        <label className="block text-xs font-bold text-gray-600">Post Reply</label>
                        <textarea
                            required
                            rows="3"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Provide help, crop rotation hints, or advice..."
                            className="form-input text-xs"
                        />
                        <div className="flex justify-end">
                            <Button type="submit" isLoading={replySubmitting} icon={Send} className="py-2 text-xs">
                                Submit reply
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Community Forums</h1>
                    <p className="text-gray-500 text-sm mt-1">Discuss weather updates, farming routines, or crop recommendations.</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} icon={Plus}>
                    Add Topic
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="loading-ring" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Discussion Topics</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Get started by adding a question or sharing your farm logs with the community.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => setSelectedPostId(post.id)}
                            className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-eco-200 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-start gap-4 fade-in"
                        >
                            <div className="p-3 rounded-xl bg-eco-50 text-eco-600 flex-shrink-0">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 group-hover:text-eco-600 truncate mb-1">
                                    {post.title}
                                </h3>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-4 text-[10px] text-gray-400">
                                    <span className="font-semibold text-gray-600">Author: {post.author_name}</span>
                                    <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold flex items-center gap-1">
                                        💬 {post.reply_count || 0} replies
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Topic Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-2xl relative fade-in" title="Start a Discussion" icon={MessageCircle}>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="form-label">Discussion Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="form-input"
                                    placeholder="e.g. Yield prediction help on Wheat"
                                />
                            </div>

                            <div>
                                <label className="form-label">Details / Question *</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    className="form-input"
                                    placeholder="Describe your soil conditions, climate forecasts, or farming concerns..."
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={submitting}>
                                    Publish Topic
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Community;
