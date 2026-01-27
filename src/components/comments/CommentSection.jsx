import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CornerDownRight, Send, X, Trash2, Pencil, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DeckService } from '../../services/api';
import '../../styles/Comments.css';

const CommentItem = ({ comment, depth = 0, onReply, onDelete, onUpdate, currentUser, replies }) => {
    const { t } = useLanguage();
    const dateStr = new Date(comment.created_at).toLocaleDateString();

    // Check ownership properly
    const isOwner = currentUser && currentUser.id === comment.user_id;

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    const handleSaveEdit = () => {
        if (editContent.trim() !== comment.content) {
            onUpdate(comment.id, editContent);
        }
        setIsEditing(false);
    };

    return (
        <div className="comment-item" style={{ marginLeft: depth > 0 ? '2rem' : '0' }}>
            <div className="comment-header">
                <span className="comment-author">{comment.username}</span>
                <span className="comment-date">{dateStr}</span>
                {isOwner && !isEditing && (
                    <div className="comment-owner-actions">
                        <button
                            className="comment-action-btn edit-btn"
                            onClick={() => setIsEditing(true)}
                            title={t('comments.edit') || "Edit"}
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            className="comment-action-btn delete-btn"
                            onClick={() => onDelete(comment.id)}
                            title={t('comments.delete') || "Delete"}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            <div className="comment-content">
                {isEditing ? (
                    <div className="comment-edit-form">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="comment-edit-input"
                            rows={2}
                        />
                        <div className="comment-edit-actions">
                            <button onClick={handleSaveEdit} className="comment-save-btn">
                                <Check size={14} /> Save
                            </button>
                            <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className="comment-cancel-btn">
                                <X size={14} /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    comment.content
                )}
            </div>

            <div className="comment-actions">
                <button className="comment-reply-btn" onClick={() => onReply(comment)}>
                    <CornerDownRight size={14} />
                    {t('comments.reply')}
                </button>
            </div>

            {replies && replies.length > 0 && (
                <div className="comment-replies">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            onReply={onReply}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            currentUser={currentUser}
                            replies={reply.replies}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentSection = ({ deckId }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        try {
            const data = await DeckService.getDeckComments(deckId);
            setComments(data);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (deckId) {
            fetchComments();
        }
    }, [deckId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await DeckService.postDeckComment(deckId, {
                content: newComment,
                parentId: replyTo ? replyTo.id : null
            });
            setNewComment('');
            setReplyTo(null);
            fetchComments();
        } catch (err) {
            console.error("Failed to post comment", err);
            alert("Failed to post comment: " + err.message);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await DeckService.deleteDeckComment(commentId);
            fetchComments();
        } catch (err) {
            console.error("Failed to delete comment", err);
            alert("Failed to delete comment");
        }
    };

    const handleUpdateComment = async (commentId, content) => {
        try {
            await DeckService.updateDeckComment(commentId, content);
            fetchComments();
        } catch (err) {
            console.error("Failed to update comment", err);
            alert("Failed to update comment");
        }
    };

    const buildCommentTree = (flatComments) => {
        if (!flatComments) return [];
        const commentMap = {};
        const roots = [];

        flatComments.forEach(c => {
            commentMap[c.id] = { ...c, replies: [] };
        });

        flatComments.forEach(c => {
            if (c.parent_id) {
                if (commentMap[c.parent_id]) {
                    commentMap[c.parent_id].replies.push(commentMap[c.id]);
                }
            } else {
                roots.push(commentMap[c.id]);
            }
        });

        return roots;
    };

    const commentTree = buildCommentTree(comments);

    return (
        <div className="comments-section" id="comments-section">
            <h3 className="comments-title">
                <MessageSquare size={20} />
                {t('comments.title')} ({comments ? comments.length : 0})
            </h3>

            {!user && (
                <button
                    className="comments-login-prompt"
                    onClick={() => navigate('/login')}
                >
                    {t('comments.login_to_comment')}
                </button>
            )}

            {user && (
                <form className="comment-form" onSubmit={handleSubmit}>
                    {replyTo && (
                        <div className="replying-to-banner">
                            <span>Replying to {replyTo.username}</span>
                            <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className="comment-input-wrapper">
                        <textarea
                            className="comment-input"
                            placeholder={t('comments.post_placeholder')}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                        />
                        <button type="submit" className="comment-submit-btn" disabled={!newComment.trim()}>
                            <Send size={16} />
                            {t('comments.send')}
                        </button>
                    </div>
                </form>
            )}

            <div className="comments-list">
                {commentTree.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        replies={comment.replies}
                        currentUser={user}
                        onDelete={handleDeleteComment}
                        onUpdate={handleUpdateComment}
                        onReply={(c) => {
                            setReplyTo(c);
                            document.querySelector('.comment-input')?.focus();
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default CommentSection;
