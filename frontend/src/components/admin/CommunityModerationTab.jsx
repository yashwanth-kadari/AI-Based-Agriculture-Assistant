import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Search, Trash2, X, ChevronDown, ChevronUp, User, CornerDownRight } from 'lucide-react';
import { getAdminCommunityPosts, deleteAdminCommunityPost, deleteAdminCommunityComment } from '../../utils/api';
import Pagination from '../Pagination';

const CommunityModerationTab = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAdminCommunityPosts();
            setPosts(data.posts || []);
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to load community posts.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleRemovePost = async (postId, title) => {
        if (!window.confirm(`Delete post "${title}" and all its comments?`)) return;
        try {
            await deleteAdminCommunityPost(postId);
            setFeedback({ type: 'success', message: 'Post removed successfully.' });
            fetchPosts();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to remove post.' });
        }
    };

    const handleRemoveComment = async (commentId) => {
        if (!window.confirm('Delete this comment from post?')) return;
        try {
            await deleteAdminCommunityComment(commentId);
            setFeedback({ type: 'success', message: 'Comment removed successfully.' });
            fetchPosts();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to remove comment.' });
        }
    };

    const filteredPosts = posts.filter(p => {
        const q = search.toLowerCase();
        return (p.title || '').toLowerCase().includes(q) ||
            (p.content || '').toLowerCase().includes(q) ||
            (p.author_name || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Community & Forum Moderation</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Moderate farmer forum questions, discussion threads, and comments to ensure platform safety.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback.message && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    <span>{feedback.message}</span>
                    <button onClick={() => setFeedback({ type: '', message: '' })} className="cursor-pointer">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <div className="relative w-full sm:w-96">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search posts by topic, content, or author..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Posts Cards List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-14 bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6">
                        <MessageSquare className="h-10 w-10 text-indigo-300 mx-auto mb-2" />
                        <p className="text-gray-700 font-bold text-sm">No community posts found.</p>
                        <p className="text-gray-400 text-xs mt-1">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <>
                        {filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((post) => {
                            const isExpanded = expandedPostId === post.id;
                            const replies = post.replies || [];

                            return (
                                <div key={post.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    {post.category || 'General Discussion'}
                                                </span>
                                                <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                                                    <User className="h-3 w-3" /> {post.author_name || 'Farmer'} ({post.author_role || 'farmer'})
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900">{post.title}</h3>
                                            <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">{post.content}</p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Replies ({replies.length})</span>
                                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => handleRemovePost(post.id, post.title)}
                                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>Delete Post</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Comments Section */}
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 pl-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Comments & Answers ({replies.length})
                                            </h4>
                                            {replies.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No comments on this post yet.</p>
                                            ) : (
                                                replies.map((reply) => (
                                                    <div key={reply.id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-2">
                                                            <CornerDownRight className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-bold text-xs text-gray-900">{reply.author_name || reply.user_name || 'User'}</span>
                                                                    <span className="text-[10px] text-gray-400">{reply.created_at ? reply.created_at.split('T')[0] : ''}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-700">{reply.content || reply.reply}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveComment(reply.id)}
                                                            className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg transition-all cursor-pointer flex-shrink-0"
                                                            title="Delete Comment"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredPosts.length / itemsPerPage)}
                                totalItems={filteredPosts.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CommunityModerationTab;
