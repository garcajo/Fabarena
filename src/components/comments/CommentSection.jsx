import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CornerDownRight, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DeckService } from '../../services/api';
import '../../styles/Comments.css';

const CommentItem = ({ comment, depth = 0, onReply, replies }) => {
    const { t } = useLanguage();
    const dateStr = new Date(comment.created_at).toLocaleDateString();

    return (
        <div className="comment-item" style={{ marginLeft: depth > 0 ? '2rem' : '0' }}>
            <div className="comment-header">
                <span className="comment-author">{comment.username}</span>
                <span className="comment-date">{dateStr}</span>
            </div>
            <div className="comment-content">
                {comment.content}
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
            alert("Failed to post comment: " + err.message); // Temporary for debug
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
