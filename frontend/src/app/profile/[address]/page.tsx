'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import styles from '../ProfilePage.module.css';
import { FaHome, FaEdit, FaUser, FaSignOutAlt, FaArrowLeft, FaCalendarAlt, FaComment, FaRetweet, FaHeart, FaShareSquare } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

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

interface UserProfile {
  username: string;
  pfp: string;
  bio: string;
  joinDate: string;
  postCount: number;
  pfpLink: string;
}

export default function UserProfilePage({ params }: { params: { address: string } }) {
  const router = useRouter();
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeWallet = wallets[0];
  const postIdsRef = useRef<Set<string>>(new Set());
  const {address} = useParams();

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderCollapsed(window.scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if this is the current user's profile
  useEffect(() => {
    const checkIfCurrentUser = async () => {
      let {address} = await params;
      if (activeWallet) {
        setIsCurrentUser(activeWallet.address.toLowerCase() === address.toLowerCase());
      }
    };
    
    checkIfCurrentUser();
  }, [activeWallet]);

  // Fetch user profile and posts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        console.log(`Fetching profile for address: ${address}`);
        setIsLoading(true);
        
        // Fetch user profile
        const profileResponse = await fetch(`/api/profile/${address}`);
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }
        const profileData = await profileResponse.json();
        console.log(`Profile data:`, profileData);
        profileData.pfp = profileData.pfpLink;
        setUserProfile(profileData);
        
        // Fetch user posts
        const postsResponse = await fetch(`/api/profile/${address}/posts`);
        if (!postsResponse.ok) {
          throw new Error('Failed to fetch user posts');
        }
        const postsData = await postsResponse.json();
        console.log(`Posts data:`, postsData);
        
        // Reset the postIdsRef when fetching posts for a new profile
        postIdsRef.current = new Set();
        
        const validPosts: Post[] = [];
        for (const post of postsData) {
          if (post.postId) {
            const postIdStr = post.postId.toString();
            if (!postIdsRef.current.has(postIdStr)) {
              validPosts.push({
                ...post,
                likes: {
                  likeCount: Number(post.likes?.likeCount) || 0,
                  likers: post.likes?.likers || []
                }
              });
              postIdsRef.current.add(postIdStr);
            }
          }
        }
        
        console.log(`Valid posts to display:`, validPosts);
        setUserPosts(validPosts);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchUserProfile();
    }
  }, [address]);

  const handleLikePost = async (postId: string) => {
    if (!activeWallet) return;
    
    try {
      // Find the post in our state
      const postIndex = userPosts.findIndex(p => p.postId.toString() === postId);
      if (postIndex === -1) return;
      
      const post = userPosts[postIndex];
      const isLiked = post.likes.likers.includes(activeWallet.address);
      
      // Optimistically update UI
      const updatedPosts = [...userPosts];
      updatedPosts[postIndex] = {
        ...post,
        likes: {
          likeCount: isLiked ? post.likes.likeCount - 1 : post.likes.likeCount + 1,
          likers: isLiked 
            ? post.likes.likers.filter(addr => addr !== activeWallet.address)
            : [...post.likes.likers, activeWallet.address]
        }
      };
      setUserPosts(updatedPosts);
      
      // Send request to API
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: activeWallet.address })
      });
      
      if (!response.ok) {
        throw new Error('Failed to like post');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    console.log(userProfile);
    setEditedProfile({
      username: userProfile?.username || '',
      bio: userProfile?.bio || '',
      pfp: userProfile?.pfp || '',
      pfpLink: userProfile?.pfpLink || ''
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditedProfile({
            ...editedProfile,
            pfp: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveProfile = async () => {
    if (!activeWallet) return;
    
    try {
      const response = await fetch(`/api/profile/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedProfile)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleFollowUser = async () => {
    if (!activeWallet) return;
    
    setIsFollowLoading(true);
    try {
      // Optimistically update UI
      const newFollowState = !isFollowing;
      setIsFollowing(newFollowState);
      
      console.log("Sending follow request for:", address, "follower:", activeWallet.address);
      let response;
      let text = newFollowState ? "follow" : "unfollow";
      if (newFollowState == true) {
      // Send request to API
          response = await fetch(`/api/profile/${address}/follow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ followerAddress: activeWallet.address })
        });
      } else {
        response = await fetch(`/api/profile/${address}/unfollow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ address: address, followerAddress: activeWallet.address })
        });
      }
      
      if (!response.ok) {
        console.error("Follow request failed with status:", response.status);
        // Revert optimistic update if request fails
        setIsFollowing(!newFollowState);
        throw new Error('Failed to follow user');
      }
      
      const data = await response.json();
      console.log("Follow response:", data);

      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: "0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95",
          value: "0x0",
          data: data.data.transactionData,
          from: activeWallet.address,
          gas: data.data.estimatedGas
        }],
      });
      console.log("Transaction sent:", txHash);
      const receipt = await provider.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      });
      console.log("Transaction receipt:", receipt);
      
      toast.success(`Transaction confirmed! User ${text}ed successfully`);
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Check if current user is following this profile
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!activeWallet || isCurrentUser) return;
      
      try {
        console.log("Checking follow status for:", address, "follower:", activeWallet.address);
        
        // The correct URL format for the API route
        const response = await fetch(`/api/profile/${address}/follow?followerAddress=${activeWallet.address}`);
        
        if (!response.ok) {
          console.error("Follow status check failed with status:", response.status);
          throw new Error('Failed to check follow status');
        }
        
        const data = await response.json();
        console.log("Follow status response:", data);
        setIsFollowing(data.isFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    
    if (address && activeWallet) {
      checkFollowStatus();
    }
  }, [activeWallet, address, isCurrentUser]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Header */}
      <header className={`${styles.header} ${isHeaderCollapsed ? styles.headerCollapsed : styles.headerExpanded}`}>
        <div className={styles.headerContent}>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navItem}>
              <FaHome size={18} /> {!isHeaderCollapsed && "Home"}
            </Link>
            <Link href="/create" className={styles.navItem}>
              <FaEdit size={18} /> {!isHeaderCollapsed && "Post"}
            </Link>
            <Link href={activeWallet ? `/profile/${activeWallet.address}` : "/profile"} className={`${styles.navItem} ${styles.active}`}>
              <FaUser size={18} /> {!isHeaderCollapsed && "Profile"}
            </Link>
            <button onClick={logout} className={styles.navItem}>
              <FaSignOutAlt size={18} /> {!isHeaderCollapsed && "Logout"}
            </button>
          </nav>
        </div>
      </header>

      <div className={styles.container}>
        <ToastContainer theme="dark" />
        
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
        >
          <FaArrowLeft />
          Back to Feed
        </button>
        
        <div className={styles.profileHeader}>
          <div className={styles.coverImage}>
            <img src="https://imgur.com/E4bgElt.png" alt="Cover" />
          </div>
          
          <div className={styles.profileInfo}>
            {isEditingProfile ? (
              <div className={styles.profileAvatarEditable}>
                <div 
                  className={styles.editableAvatar} 
                  onClick={() => {
                    console.log("Avatar clicked");
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <img src={editedProfile.pfp || userProfile?.pfpLink || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="Avatar" />
                  <div className={styles.avatarOverlay}>
                    <FaEdit />
                  </div>
                </div>  
                <button 
                  className={styles.changePhotoButton}
                  onClick={() => {
                    console.log("Change photo button clicked");
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  Change Photo
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
            ) : (
              <div className={styles.profileAvatar}>
                <img src={userProfile?.pfpLink || userProfile?.pfp || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="Avatar" />
              </div>
            )}
            
            {isCurrentUser && (
              <div className={styles.profileActions}>
                {isEditingProfile ? (
                  <>
                    <button onClick={() => setIsEditingProfile(false)} className={styles.cancelButton}>
                      Cancel
                    </button>
                    <button onClick={handleSaveProfile} className={styles.saveButton}>
                      Save
                    </button>
                  </>
                ) : (
                  <button onClick={handleEditProfile} className={styles.editButton}>
                    Edit profile
                  </button>
                )}
              </div>
            )}
            
            {!isCurrentUser && activeWallet && (
              <div className={styles.profileActions}>
                <button 
                  onClick={handleFollowUser}
                  className={isFollowing ? styles.unfollowButton : styles.followButton}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? 'Processing...' : (isFollowing ? 'Unfollow' : 'Follow')}
                </button>
              </div>
            )}
          </div>
          
          {isEditingProfile ? (
            <div className={styles.editForm}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  value={editedProfile.username || ''} 
                  onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})}
                  maxLength={50}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Bio</label>
                <textarea 
                  value={editedProfile.bio || ''} 
                  onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                  maxLength={160}
                />
              </div>
            </div>
          ) : (
            <div className={styles.profileDetails}>
              <h1 className={styles.profileName}>{userProfile?.username || 'Anonymous'}</h1>
              <p className={styles.profileBio}>{userProfile?.bio || 'No bio yet'}</p>
              
              <div className={styles.profileMeta}>
                <span className={styles.metaItem}>
                  <FaCalendarAlt /> Joined {userProfile?.joinDate || 'Recently'}
                </span>
              </div>
              
              <div className={styles.profileStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{userProfile?.postCount || 0}</span>
                  <span className={styles.statLabel}>Posts</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.profileTabs}>
          <button className={`${styles.tabButton} ${styles.active}`}>Posts</button>
          <button className={styles.tabButton}>Replies</button>
          <button className={styles.tabButton}>Media</button>
          <button className={styles.tabButton}>Likes</button>
        </div>
        
        <div className={styles.userPosts}>
          {userPosts.length === 0 ? (
            <div className={styles.noPosts}>
              <p>No posts yet</p>
              {isCurrentUser && (
                <Link href="/" className={styles.createPostLink}>Create your first post</Link>
              )}
            </div>
          ) : (
            userPosts.map(post => (
              <Link href={`/post/${post.postId}`} key={post.postId} className={styles.postLink}>
                <div className={styles.post}>
                  <div className={styles.postAvatar}>
                    <img src={post.avatar || userProfile?.pfpLink || userProfile?.pfp || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={`${userProfile?.username}'s avatar`} />
                  </div>
                  <div className={styles.postContent}>
                    <div className={styles.postHeader}>
                      <span className={styles.postUsername}>{userProfile?.username}</span>
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
                        className={activeWallet && post.likes.likers.includes(activeWallet.address) ? styles.likedButton : ''}
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
            ))
          )}
        </div>
      </div>
    </>
  );
} 