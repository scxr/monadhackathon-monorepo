'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import styles from './Dashboard.module.css';
import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { FaHome, FaSearch, FaBell, FaEnvelope, FaBookmark, FaList, FaUser, FaEllipsisH, FaImage, FaGift, FaPoll, FaSmile, FaCalendar, FaRetweet, FaHeart, FaShareSquare, FaComment } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

// Define the Post type
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

export function Dashboard() {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [userData, setUserData] = useState<any>(null);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [postIds, setPostIds] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  
  const POSTS_PER_PAGE = 20;
  const activeWallet = wallets[0];

  const fetchPosts = async (currentOffset: number) => {
    try {
      setIsLoading(true);
      console.log("Fetching posts", currentOffset);
      const response = await fetch(`/api/get-posts?offset=${currentOffset}&limit=${POSTS_PER_PAGE}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      if (data.length < POSTS_PER_PAGE) {
        console.log("No more posts", data.length);
        setHasMore(false);
      }
      let validPosts = []
      for (let i = 0; i < data.length; i++) {
        if (data[i].postId) {
          if (postIds.includes(data[i].postId.toString())) {
            continue;
          } else {
            // Ensure likes object is properly structured
            const post = {
              ...data[i],
              likes: {
                likeCount: Number(data[i].likes?.likeCount) || 0,
                likers: data[i].likes?.likers || []
              }
            };
            validPosts.push(post);
            postIds.push(data[i].postId.toString());
          }
        }
      }
      
      setPosts(prevPosts => [...prevPosts, ...validPosts]);
      setOffset(currentOffset + data.length);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial posts fetch
  useEffect(() => {
    fetchPosts(0);
  }, []);

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        console.log("Intersection:", first.intersectionRatio, hasMore, isLoading);
        if (first.isIntersecting && hasMore && !isLoading) {
          console.log("Triggering fetch with offset:", offset);
          fetchPosts(offset);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [offset, hasMore, isLoading]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!activeWallet) return;

      try {
        const response = await fetch(`/api/users/${activeWallet.address}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        console.log("User data fetched:", data);
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [activeWallet]);

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!postContent.trim()) return;
    
    setIsPosting(true);
    
    try {
      const response = await fetch('/api/create-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: postContent }),
      });
      let data = await response.json();
      console.log(data);
      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: "0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95",
          value: "0x0",
          data: data.data,
          from: activeWallet.address,
          gasLimit: 175000
        }],
      });
      console.log("Transaction sent:", txHash);
      setPostContent('');
      toast.success(
        <div>
          Successfully created post! 
          <a 
            href={`https://monad-testnet.socialscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '5px', color: '#4caf50', textDecoration: 'underline' }}
          >
            See transaction
          </a>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      await fetch(`/api/create-post?txn=${txHash}`);
      
      // Refresh the posts after creating a new one
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      fetchPosts(0);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      let post = posts.find(post => post.postId.toString() === postId);
      if (!post) {
        toast.error('Post not found');
        return;
      }
      if (post.likes.likers.includes(activeWallet.address)) {
        toast.error('You already liked this post');
        return;
      }
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });
      const data = await response.json();
      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: "0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95",
          value: "0x0",
          data: data.transactionData,
          from: activeWallet.address,
          gasLimit: 175000
        }],
      });
      
      // Update the UI optimistically
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.postId.toString() === postId
            ? {
                ...post,
                likes: {
                  likeCount: post.likes.likeCount + 1,
                  likers: [...post.likes.likers, activeWallet.address]
                }
              }
            : post
        )
      );

      console.log("Post liked:", data);
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post. Please try again.');
    }
  };

  return (
    <div className={styles.twitterLayout}>
      <ToastContainer theme="dark" />
      
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.logo}>MonadSocial</h1>
      </div>
      
      <div className={styles.mainContainer}>
        {/* Left Column - Home label */}
        <div className={styles.leftColumn}>
          <div className={styles.homeLabel}>Home</div>
          
          {/* User Input Area */}
          <div className={styles.userInputArea}>
            <div className={styles.userAvatar}>
              <img 
                src={userData?.user?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                alt="Your avatar" 
              />
            </div>
            <div className={styles.inputWrapper}>
              <textarea 
                placeholder="What's happening?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
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
                  onClick={handlePostSubmit}
                  className={styles.postButton}
                  disabled={!postContent.trim() || isPosting}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
          
          {/* Feed */}
          <div className={styles.feed}>
            {posts.map(post => (
              <Link href={`/post/${post.postId}`} key={post.postId} className={styles.postLink}>
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
                      <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}><FaComment /> <span>{post.comments.commentCount}</span></button>
                      <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}><FaRetweet /> <span>{post.reposts}</span></button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLikePost(post.postId.toString());
                        }}
                        className={post.likes.likers.includes(activeWallet.address) ? styles.likedButton : ''}
                      >
                        <FaHeart /> <span>{post.likes.likeCount}</span>
                      </button>
                      <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}><FaShareSquare /></button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Loading indicator */}
            <div ref={loadingRef} className={styles.loadingIndicator}>
              {isLoading && <div className={styles.spinner}>Loading...</div>}
              {!hasMore && <div className={styles.noMorePosts}>No more posts</div>}
            </div>
          </div>
        </div>
        
        {/* Right Column - Navigation */}
        <div className={styles.rightColumn}>
          <nav className={styles.mainNav}>
            <ul>
              <li className={styles.active}><FaHome /> <span>Home</span></li>
              <li><FaSearch /> <span>Explore</span></li>
              <li><FaBell /> <span>Notifications</span></li>
              <li><FaEnvelope /> <span>Messages</span></li>
              <li><FaBookmark /> <span>Bookmarks</span></li>
              <li><FaList /> <span>Lists</span></li>
              <li><FaUser /> <span>Profile</span></li>
              <li><FaEllipsisH /> <span>More</span></li>
            </ul>
          </nav>
          
          <div className={styles.postButtonLarge}>
            <button>Post</button>
          </div>
          
          {/* User Info Box */}
          <div className={styles.userInfoBox}>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {userData?.user?.username || 'nemo'}
              </div>
              <div className={styles.userAddress}>
                {activeWallet ? `${activeWallet.address.substring(0, 6)}...${activeWallet.address.substring(activeWallet.address.length - 4)}` : '0xD4D...604B'}
              </div>
            </div>
            
            <button onClick={logout} className={styles.signOutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 