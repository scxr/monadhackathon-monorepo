'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import styles from './PostPage.module.css';
import { FaComment, FaRetweet, FaHeart, FaShareSquare, FaImage, FaGift, FaPoll, FaSmile, FaCalendar, FaArrowLeft } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

interface Post {
  id: number;
  username: string;
  handle: string;
  avatar: string;
  content: string;
  time: string;
  comments: {
    commentCount: number;
    comments: string[];
    commenters: string[];
  }
  reposts: number;
  postId: string | number;
  user: {
    username: string;
    id: string;
  }
  likes: {
    likeCount: number;
    likers: string[];
  }
}

export default function PostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [post, setPost] = useState<Post | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const activeWallet = wallets[0];

  useEffect(() => {
    const fetchPost = async () => {
      try {
        let {id: postId} = await params
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        const data = await response.json();
        console.log(data);
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
      }
    };

    const fetchUserData = async () => {
      if (!activeWallet) return;
      try {
        const response = await fetch(`/api/users/${activeWallet.address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchPost();
    fetchUserData();
  }, []);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsPosting(true);
    try {
      let {id: postId} = await params
      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const data = await response.json();
      console.log(data.commentData);
      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: "0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95",
          data: data.commentData.transactionData,
          from: activeWallet.address,
          gasLimit: 250000
        }],
      });

      // Update post with new comment
      setPost(prevPost => {
        if (!prevPost) return null;
        return {
          ...prevPost,
          comments: {
            commentCount: prevPost.comments.commentCount + 1,
            comments: [...prevPost.comments.comments, commentContent],
            commenters: [...prevPost.comments.commenters, activeWallet.address]
          }
        };
      });

      setCommentContent('');
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsPosting(false);
    }
  };

  if (!post) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ToastContainer theme="dark" />
      
      {/* Back Button */}
      <button 
        className={styles.backButton}
        onClick={() => router.push('/')}
      >
        <FaArrowLeft />
        Back to Feed
      </button>
      
      {/* Main Post */}
      <div className={styles.post}>
        <div className={styles.postAvatar}>
          <img src={post.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={`${post.user.username}'s avatar`} />
        </div>
        <div className={styles.postContent}>
          <div className={styles.postHeader}>
            <span className={styles.postUsername}>{post.user.username}</span>
            <span className={styles.postHandle}>{post.handle}</span>
            <span className={styles.postTime}>· {post.time}</span>
          </div>
          <div className={styles.postText}>
            {post.content}
          </div>
          <div className={styles.postActions}>
            <button><FaComment /> <span>{post.comments.commentCount}</span></button>
            <button><FaRetweet /> <span>{post.reposts}</span></button>
            <button><FaHeart /> <span>{post.likes.likeCount}</span></button>
            <button><FaShareSquare /></button>
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className={styles.commentInput}>
        <div className={styles.userAvatar}>
          <img 
            src={userData?.user?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
            alt="Your avatar" 
          />
        </div>
        <div className={styles.inputWrapper}>
          <textarea 
            placeholder="Write a comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            maxLength={280}
          />
          <div className={styles.inputActions}>
            <div className={styles.mediaButtons}>
              <button type="button"><FaImage /></button>
              <button type="button"><FaGift /></button>
              <button type="button"><FaPoll /></button>
              <button type="button"><FaSmile /></button>
              <button type="button"><FaCalendar /></button>
            </div>
            <button 
              onClick={handleCommentSubmit}
              className={styles.commentButton}
              disabled={!commentContent.trim() || isPosting}
            >
              Comment
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className={styles.commentsSection}>
        <h2>Comments</h2>
        {post.comments.comments.length === 0 ? (
          <div className={styles.noComments}>
            Be the first to comment
          </div>
        ) : (
          post.comments.comments.map((comment, index) => (
            <div key={index} className={styles.comment}>
              <div className={styles.commentAvatar}>
                <img src={post.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="User avatar" />
              </div>
              <div className={styles.commentContent}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentUsername}>{post.comments.commenters[index]}</span>
                  <span className={styles.commentTime}>{post.time}</span>
                </div>
                <div className={styles.commentText}>
                  {comment}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 